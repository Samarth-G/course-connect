import { useEffect, useState } from 'react'
import { useSocket } from '../contexts/socketContext'

export default function ProfilePage({ user, token, setUser }) {
  const { socket } = useSocket() || {}
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', profileImage: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyHasMore, setHistoryHasMore] = useState(true)

  const avatarUrl = user?.profileImage ? `/uploads/${user.profileImage}` : null

  useEffect(() => {
    if (!socket || !user?.id) return

    const handleUserUpdated = (updatedUser) => {
      if (!updatedUser?.id) return
      if (String(updatedUser.id) !== String(user.id)) return
      setUser(updatedUser)
    }

    socket.on('user:updated', handleUserUpdated)

    return () => {
      socket.off('user:updated', handleUserUpdated)
    }
  }, [socket, user?.id, setUser])

  useEffect(() => {
    if (!user?.id || !token) return
    loadHistory(1, true)
  }, [user?.id, token])

  async function loadHistory(page, reset = false) {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/analytics/user/${encodeURIComponent(user.id)}/history?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.results)) {
        setHistory((prev) => reset ? data.results : [...prev, ...data.results])
        setHistoryPage(page)
        setHistoryHasMore(data.results.length === 20)
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false) }
  }

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'profileImage') {
      setForm((prev) => ({ ...prev, profileImage: files?.[0] || null }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const formData = new FormData()
      if (form.name.trim()) formData.append('name', form.name.trim())
      if (form.email.trim()) formData.append('email', form.email.trim())
      if (form.profileImage) formData.append('profileImage', form.profileImage)

      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      if (data.user) setUser(data.user)
      setSuccess('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Unexpected network error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <section className="placeholder-page">
        <h2>Profile</h2>
        <p>Sign in to view your profile.</p>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar-placeholder">
              {(user.name || 'U').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <p className="profile-meta">
              Joined {formatDate(user.createdAt)}
              {user.role === 'admin' && <span className="profile-badge-admin">Admin</span>}
            </p>
          </div>
        </div>

        {!editing && (
          <button type="button" className="new-thread-button" onClick={() => { setEditing(true); setForm({ name: user.name || '', email: user.email || '', profileImage: null }); setSuccess('') }}>
            Edit Profile
          </button>
        )}

        {editing && (
          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Name" required />
            <input type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Email" required />
            <label className="file-upload-label">
              Profile Image
              <input type="file" name="profileImage" accept="image/png,image/jpeg,image/jpg,image/gif" onChange={handleInputChange} />
            </label>
            {error && <p className="panel-message panel-error">{error}</p>}
            <div className="profile-edit-actions">
              <button type="submit" className="reply-submit-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="ghost-button" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
            </div>
          </form>
        )}

        {success && <p className="panel-message profile-success">{success}</p>}
      </div>

      <div className="activity-history-section">
        <h3>My Activity</h3>
        {history.length === 0 && !historyLoading && (
          <p className="panel-message">No activity yet.</p>
        )}
        <ul className="activity-history-list">
          {history.map((item, idx) => (
            <li key={`${item.type}-${item.threadId}-${idx}`} className="activity-history-item">
              <span className="activity-history-type">{item.type}</span>
              <div className="activity-history-content">
                <strong>{item.type === 'thread' ? item.content : (item.threadTitle || 'Thread reply')}</strong>
                {item.type === 'reply' && (
                  <span style={{ fontSize: '0.78rem', color: '#555' }}>
                    {(item.body || '').length > 100 ? item.body.slice(0, 100) + '...' : item.body}
                  </span>
                )}
                <div className="activity-history-meta">
                  {item.courseId} · {formatDate(item.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {historyLoading && <p className="panel-message">Loading...</p>}
        {!historyLoading && historyHasMore && history.length > 0 && (
          <button type="button" className="new-thread-button" style={{ marginTop: 10 }} onClick={() => loadHistory(historyPage + 1)}>
            Load more
          </button>
        )}
      </div>
    </section>
  )
}
