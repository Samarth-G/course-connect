import { useCallback, useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { useSocket } from '../contexts/socketContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ADMIN_SERIES = [
  { key: 'signups',   color: '#7c3aed', label: 'Signups'   },
  { key: 'threads',   color: '#10b981', label: 'Threads'   },
  { key: 'replies',   color: '#f59e0b', label: 'Replies'   },
  { key: 'resources', color: '#ef4444', label: 'Resources' },
  { key: 'sessions',  color: '#3b82f6', label: 'Sessions'  },
]

function AdminChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="activity-chart-tooltip">
      <p className="activity-chart-tooltip-label">{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} className="activity-chart-tooltip-row">
          <span style={{ color }}>{name}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function formatAdminTick(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

export default function AdminDashboard({ user, token }) {
  const { socket } = useSocket() || {}

  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')

  const [threads, setThreads] = useState([])
  const [threadCourse, setThreadCourse] = useState('')
  const [courses, setCourses] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')

  const [editingThread, setEditingThread] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', body: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Usage report state
  const today = new Date().toISOString().slice(0, 10)
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const [reportStart, setReportStart] = useState(thirtyAgo)
  const [reportEnd, setReportEnd] = useState(today)
  const [summary, setSummary] = useState(null)
  const [activityChart, setActivityChart] = useState([])
  const [reportLoading, setReportLoading] = useState(false)

  // Load courses on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        const data = await res.json()
        if (res.ok && Array.isArray(data.results)) {
          setCourses(data.results)
          if (data.results.length > 0) setThreadCourse(data.results[0].id)
        }
      } catch {
        // ignore
      }
    }
    fetchCourses()
  }, [])

  // Load usage reports
  useEffect(() => {
    if (!token) return
    async function fetchReports() {
      setReportLoading(true)
      try {
        const params = new URLSearchParams({ startDate: reportStart, endDate: reportEnd })
        const [sumRes, actRes] = await Promise.all([
          fetch(`/api/analytics/summary?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/analytics/activity?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (sumRes.ok) {
          const sumData = await sumRes.json()
          setSummary(sumData)
        }
        if (actRes.ok) {
          const actData = await actRes.json()
          const dateMap = {}
          const addToMap = (arr, key) => {
            (arr || []).forEach(({ _id, count }) => {
              if (!dateMap[_id]) dateMap[_id] = { date: _id }
              dateMap[_id][key] = count
            })
          }
          addToMap(actData.threads, 'threads')
          addToMap(actData.replies, 'replies')
          addToMap(actData.resources, 'resources')
          addToMap(actData.users, 'signups')
          addToMap(actData.sessions, 'sessions')
          setActivityChart(Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)))
        }
      } catch { /* ignore */ }
      finally { setReportLoading(false) }
    }
    fetchReports()
  }, [token, reportStart, reportEnd])

  // Load users
  const loadUsers = useCallback(async (searchTerm = '') => {
    if (!token) return
    setUsersLoading(true)
    setUsersError('')

    try {
      const q = String(searchTerm).trim()
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : '/api/admin/users'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) {
        setUsersError(data.error || 'Failed to load users')
        return
      }
      setUsers(Array.isArray(data.results) ? data.results : [])
    } catch (err) {
      setUsersError(err.message || 'Unexpected network error')
    } finally {
      setUsersLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUsers('')
  }, [loadUsers])

  // Load threads when course changes
  useEffect(() => {
    if (threadCourse) loadThreads(threadCourse)
  }, [threadCourse])

  // Socket.io live updates for admin
  useEffect(() => {
    if (!socket) return

    const handleUserToggled = (payload) => {
      const normalizedUserId = payload?.userId || payload?.id
      const normalizedEnabled = payload?.enabled
      if (!normalizedUserId || typeof normalizedEnabled !== 'boolean') return

      setUsers((prev) => prev.map((u) => (u.id === normalizedUserId ? { ...u, enabled: normalizedEnabled } : u)))
    }
    const handleUserUpdated = (updatedUser) => {
      if (!updatedUser?.id) return
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)))
    }
    const handleThreadCreated = (thread) => {
      if (thread.courseId === threadCourse) {
        setThreads((prev) => [thread, ...prev])
      }
    }
    const handleThreadUpdated = (thread) => {
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)))
    }
    const handleThreadDeleted = ({ threadId }) => {
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
    }

    socket.on('user:toggled', handleUserToggled)
    socket.on('user:updated', handleUserUpdated)
    socket.on('thread:created', handleThreadCreated)
    socket.on('thread:updated', handleThreadUpdated)
    socket.on('thread:deleted', handleThreadDeleted)

    return () => {
      socket.off('user:toggled', handleUserToggled)
      socket.off('user:updated', handleUserUpdated)
      socket.off('thread:created', handleThreadCreated)
      socket.off('thread:updated', handleThreadUpdated)
      socket.off('thread:deleted', handleThreadDeleted)
    }
  }, [socket, threadCourse])

  async function handleToggleUser(userId) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setUsersError(data.error || 'Failed to toggle user')
        return
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, enabled: data.user.enabled } : u)))
    } catch (err) {
      setUsersError(err.message || 'Unexpected network error')
    }
  }

  async function loadThreads(courseId) {
    setThreadsLoading(true)
    setThreadsError('')

    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/threads?limit=100`)
      const data = await res.json()
      if (!res.ok) {
        setThreadsError(data.error || 'Failed to load threads')
        return
      }
      setThreads(Array.isArray(data.results) ? data.results : [])
    } catch (err) {
      setThreadsError(err.message || 'Unexpected network error')
    } finally {
      setThreadsLoading(false)
    }
  }

  async function handleDeleteThread(courseId, threadId) {
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/threads/${threadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        setThreadsError(data.error || 'Failed to delete thread')
        return
      }
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
    } catch (err) {
      setThreadsError(err.message || 'Unexpected network error')
    }
  }

  async function handleEditThread(e) {
    e.preventDefault()
    if (!editingThread) return
    setEditLoading(true)
    setEditError('')

    try {
      const res = await fetch(
        `/api/courses/${encodeURIComponent(editingThread.courseId)}/threads/${editingThread.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: DOMPurify.sanitize(editForm.title.trim()),
            body: DOMPurify.sanitize(editForm.body.trim()),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || 'Failed to update thread')
        return
      }
      setThreads((prev) => prev.map((t) => (t.id === data.thread?.id ? data.thread : t)))
      setEditingThread(null)
    } catch (err) {
      setEditError(err.message || 'Unexpected network error')
    } finally {
      setEditLoading(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!user || user.role !== 'admin') {
    return (
      <section className="placeholder-page">
        <h2>Access Denied</h2>
        <p>Admin privileges required.</p>
      </section>
    )
  }

  return (
    <section className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* User Management */}
      <div className="admin-section">
        <h2>User Management</h2>
        <form className="admin-search-bar" onSubmit={(e) => { e.preventDefault(); loadUsers(userSearch) }}>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name, email, or post..."
          />
          <button type="submit" className="reply-submit-button">Search</button>
        </form>

        {usersLoading && <p className="panel-message">Loading users...</p>}
        {usersError && <p className="panel-message panel-error">{usersError}</p>}

        {!usersLoading && users.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={u.enabled ? 'admin-status-active' : 'admin-status-disabled'}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={u.enabled ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-success'}
                      onClick={() => handleToggleUser(u.id)}
                      disabled={u.id === user.id}
                    >
                      {u.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!usersLoading && users.length === 0 && !usersError && (
          <p className="panel-message">No users found.</p>
        )}
      </div>

      {/* Thread Management */}
      <div className="admin-section">
        <h2>Thread Management</h2>
        <div className="admin-course-select">
          <label htmlFor="admin-course">Course:</label>
          <select
            id="admin-course"
            value={threadCourse}
            onChange={(e) => setThreadCourse(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.label || c.id}</option>
            ))}
          </select>
        </div>

        {threadsLoading && <p className="panel-message">Loading threads...</p>}
        {threadsError && <p className="panel-message panel-error">{threadsError}</p>}

        {editingThread && (
          <form className="admin-edit-form" onSubmit={handleEditThread}>
            <h3>Edit Thread</h3>
            <input type="text" value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" required />
            <textarea value={editForm.body} onChange={(e) => setEditForm((prev) => ({ ...prev, body: e.target.value }))} placeholder="Body" rows={4} required />
            {editError && <p className="panel-message panel-error">{editError}</p>}
            <div className="profile-edit-actions">
              <button type="submit" className="reply-submit-button" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="ghost-button" onClick={() => setEditingThread(null)}>Cancel</button>
            </div>
          </form>
        )}

        {!threadsLoading && threads.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Date</th>
                <th>Replies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.authorName || 'Anonymous'}</td>
                  <td>{formatDate(t.createdAt)}</td>
                  <td>{Array.isArray(t.replies) ? t.replies.length : 0}</td>
                  <td className="admin-actions-cell">
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => { setEditingThread(t); setEditForm({ title: t.title, body: t.body }); setEditError('') }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDeleteThread(t.courseId, t.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!threadsLoading && threads.length === 0 && !threadsError && (
          <p className="panel-message">No threads in this course.</p>
        )}
      </div>

      {/* Usage Reports */}
      <div className="admin-section admin-usage-section">
        <h2>Usage Reports</h2>

        <div className="activity-chart-filters">
          <label>From</label>
          <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
          <label>To</label>
          <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
        </div>

        {reportLoading && <p className="panel-message">Loading reports...</p>}

        {!reportLoading && summary && (
          <div className="admin-summary-cards">
            <div className="admin-summary-card">
              <div className="summary-number">{summary.users}</div>
              <div className="summary-label">New Users</div>
            </div>
            <div className="admin-summary-card">
              <div className="summary-number">{summary.threads}</div>
              <div className="summary-label">Threads</div>
            </div>
            <div className="admin-summary-card">
              <div className="summary-number">{summary.replies}</div>
              <div className="summary-label">Replies</div>
            </div>
            <div className="admin-summary-card">
              <div className="summary-number">{summary.resources}</div>
              <div className="summary-label">Resources</div>
            </div>
            <div className="admin-summary-card">
              <div className="summary-number">{summary.sessions}</div>
              <div className="summary-label">Sessions</div>
            </div>
          </div>
        )}

        {!reportLoading && activityChart.length > 0 && (
          <div className="activity-chart-canvas" style={{ marginTop: 0, padding: '14px 0 4px' }}>
            <ResponsiveContainer>
              <LineChart data={activityChart} margin={{ left: -10, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8ec" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAdminTick}
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<AdminChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.78rem', paddingTop: '8px' }}
                />
                {ADMIN_SERIES.map(({ key, color, label }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={label}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!reportLoading && activityChart.length === 0 && !summary && (
          <p className="panel-message">No usage data for this period.</p>
        )}
      </div>
    </section>
  )
}
