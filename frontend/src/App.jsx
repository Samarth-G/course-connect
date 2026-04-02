import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import ThreadForm from './components/ThreadForm'

const TOKEN_STORAGE_KEY = 'courseconnect_auth_token'

const COURSE_OPTIONS = [
  { code: 'COSC-222', title: 'COSC 222 - Data Structures', description: 'Trees, graphs, recursion, and runtime analysis.' },
  { code: 'BIOL-117', title: 'BIOL 117 - Evolutionary Biology', description: 'Selection, adaptation, and genetics review.' },
  { code: 'COMM-105', title: 'COMM 105 - Business Fundamentals', description: 'Case studies, presentations, and team work.' },
]

const DEFAULT_COURSE = COURSE_OPTIONS[0].code
const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(value) {
  if (!value) {
    return 'recently'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'recently'
  }

  return DATE_FORMAT.format(date)
}

function parseTags(value) {
  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(token))

  const [selectedCourse, setSelectedCourse] = useState(DEFAULT_COURSE)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [threads, setThreads] = useState([])
  const [threadMeta, setThreadMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')

  const [editingThreadId, setEditingThreadId] = useState('')
  const [editForm, setEditForm] = useState({ title: '', body: '', tags: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setSessionLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (!response.ok) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken('')
          setUser(null)
          return
        }

        setUser(data.user || null)
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken('')
        setUser(null)
      } finally {
        setSessionLoading(false)
      }
    }

    restoreSession()
  }, [token])

  useEffect(() => {
    loadThreads(selectedCourse, '')
  }, [selectedCourse])

  async function loadThreads(courseId, query = '') {
    const trimmedQuery = query.trim()
    const searchParams = new URLSearchParams()

    if (trimmedQuery) {
      searchParams.set('q', trimmedQuery)
    }

    searchParams.set('limit', '50')

    setThreadsLoading(true)
    setThreadsError('')

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(courseId)}/threads${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      )
      const data = await response.json()

      if (!response.ok) {
        setThreads([])
        setThreadMeta({ total: 0, page: 1, limit: 20, totalPages: 1 })
        setThreadsError(data.error || 'Failed to load threads')
        return
      }

      setThreads(Array.isArray(data.results) ? data.results : [])
      setThreadMeta({
        total: Number.isFinite(data.total) ? data.total : 0,
        page: Number.isFinite(data.page) ? data.page : 1,
        limit: Number.isFinite(data.limit) ? data.limit : 20,
        totalPages: Number.isFinite(data.totalPages) ? data.totalPages : 1,
      })
      setActiveQuery(trimmedQuery)
    } catch (error) {
      setThreads([])
      setThreadMeta({ total: 0, page: 1, limit: 20, totalPages: 1 })
      setThreadsError(error.message || 'Unexpected network error')
    } finally {
      setThreadsLoading(false)
    }
  }

  const handleAuthInputChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const payload = {
      email: authForm.email.trim(),
      password: authForm.password,
    }

    if (authMode === 'register') {
      payload.name = authForm.name.trim()
    }

    try {
      const response = await fetch(`/api/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }

      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      }
      setToken(data.token || '')
      setUser(data.user || null)
      setAuthForm({ name: '', email: '', password: '' })
    } catch (error) {
      setAuthError(error.message || 'Unexpected network error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
    setEditingThreadId('')
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadThreads(selectedCourse, searchTerm)
    setSearchTerm('')
  }

  const beginEdit = (thread) => {
    setEditingThreadId(thread.id)
    setEditError('')
    setEditForm({
      title: thread.title || '',
      body: thread.body || '',
      tags: Array.isArray(thread.tags) ? thread.tags.join(', ') : '',
    })
  }

  const cancelEdit = () => {
    setEditingThreadId('')
    setEditError('')
    setEditForm({ title: '', body: '', tags: '' })
  }

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateThread = async (event, thread) => {
    event.preventDefault()

    if (!token) {
      setEditError('Sign in to edit threads')
      return
    }

    setEditLoading(true)
    setEditError('')

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(thread.courseId)}/threads/${thread.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          body: editForm.body,
          tags: parseTags(editForm.tags),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || 'Failed to update thread')
        return
      }

      cancelEdit()
      await loadThreads(selectedCourse, activeQuery)
    } catch (error) {
      setEditError(error.message || 'Unexpected network error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteThread = async (thread) => {
    if (!token) {
      setThreadsError('Sign in to delete threads')
      return
    }

    const confirmed = window.confirm(`Delete "${thread.title}"?`)
    if (!confirmed) {
      return
    }

    setThreadsLoading(true)
    setThreadsError('')

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(thread.courseId)}/threads/${thread.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        setThreadsError(data.error || 'Failed to delete thread')
        return
      }

      if (editingThreadId === thread.id) {
        cancelEdit()
      }

      await loadThreads(selectedCourse, activeQuery)
    } catch (error) {
      setThreadsError(error.message || 'Unexpected network error')
    } finally {
      setThreadsLoading(false)
    }
  }

  if (sessionLoading) {
    return (
      <>
        <Header user={null} onShowAuth={setAuthMode} />
        <main style={{ padding: '24px' }}>
          <h1>CourseConnect</h1>
          <p>Loading session...</p>
        </main>
        <Footer />
      </>
    )
  }

  const activeCourse = COURSE_OPTIONS.find((course) => course.code === selectedCourse) || COURSE_OPTIONS[0]

  return (
    <>
      <Header user={user} onShowAuth={setAuthMode} onLogout={handleLogout} />
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', minHeight: 'calc(100vh - 130px)' }}>
        <Sidebar
          title="Course Threads"
          items={COURSE_OPTIONS.map((course) => course.code)}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
        />

        <main style={{ padding: '28px', background: 'linear-gradient(180deg, rgba(246,248,252,0.8), rgba(255,255,255,0.95))' }}>
          <section style={{ display: 'grid', gap: '18px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: '720px' }}>
                <p style={{ margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '12px', color: '#6b7280' }}>
                  Live MongoDB data
                </p>
                <h1 style={{ margin: '10px 0 8px', fontSize: 'clamp(2rem, 3vw, 3.5rem)' }}>CourseConnect dashboard</h1>
                <p style={{ margin: 0, color: '#4b5563', maxWidth: '62ch' }}>
                  Browse seeded discussions, search the database, and manage your own threads from the same interface.
                </p>
              </div>

              <div style={{ minWidth: '260px', padding: '16px', borderRadius: '18px', background: '#0f172a', color: '#f8fafc' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75 }}>Current course</div>
                <select
                  value={selectedCourse}
                  onChange={(event) => setSelectedCourse(event.target.value)}
                  style={{ width: '100%', marginTop: '10px', padding: '10px 12px', borderRadius: '12px', border: 'none' }}
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '12px 0 0', fontSize: '13px', opacity: 0.8 }}>{activeCourse.description}</p>
              </div>
            </div>

            {!user && (
              <section style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                <div style={{ padding: '18px', borderRadius: '18px', border: '1px solid #e5e7eb', background: 'white' }}>
                  <h2 style={{ marginTop: 0 }}>Sign in to contribute</h2>
                  <p style={{ marginTop: 0, color: '#4b5563' }}>
                    Reads are public. Create, edit, and delete are enabled after login.
                  </p>
                  {process.env.NODE_ENV !== 'production' && (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                      Demo account: demo@course-connect.local / Password123!
                    </p>
                  )}
                </div>

                <div style={{ padding: '18px', borderRadius: '18px', border: '1px solid #e5e7eb', background: 'white' }}>
                  <h3 style={{ marginTop: 0 }}>{authMode === 'login' ? 'Sign in' : 'Register'}</h3>
                  <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '12px' }}>
                    {authMode === 'register' && (
                      <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={authForm.name}
                        onChange={handleAuthInputChange}
                        required
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                      />
                    )}
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={authForm.email}
                      onChange={handleAuthInputChange}
                      required
                      style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={authForm.password}
                      onChange={handleAuthInputChange}
                      required
                      style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                    />
                    <button type="submit" disabled={authLoading}>
                      {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Register'}
                    </button>
                  </form>

                  {authError && <p style={{ color: '#b00020', marginBottom: 0 }}>{authError}</p>}

                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    style={{ marginTop: '12px', background: 'transparent', color: '#111827' }}
                  >
                    {authMode === 'login' ? 'Need an account?' : 'Already registered?'}
                  </button>
                </div>
              </section>
            )}
          </section>

          <section style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ marginBottom: '6px' }}>{activeCourse.code} threads</h2>
                <p style={{ marginTop: 0, color: '#6b7280' }}>
                  {activeQuery
                    ? `Search results for "${activeQuery}"`
                    : 'All threads loaded from MongoDB for the selected course'}
                </p>
              </div>
              <div style={{ color: '#6b7280' }}>
                {threadMeta.total} result{threadMeta.total === 1 ? '' : 's'}
              </div>
            </div>

            {threadsLoading && <p>Loading threads...</p>}
            {threadsError && <p style={{ color: '#b00020' }}>{threadsError}</p>}

            {!threadsLoading && !threadsError && threads.length === 0 && (
              <div style={{ padding: '20px', borderRadius: '18px', border: '1px dashed #cbd5e1', background: '#f8fafc' }}>
                No matching threads were found.
              </div>
            )}

            <div style={{ display: 'grid', gap: '14px' }}>
              {threads.map((thread) => {
                const isEditing = editingThreadId === thread.id
                const canEdit = user && thread.authorId === user.id

                return (
                  <article
                    key={thread.id}
                    style={{
                      padding: '18px',
                      borderRadius: '20px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {thread.courseId}
                        </p>
                        <h3 style={{ margin: '6px 0 4px' }}>{thread.title}</h3>
                        <p style={{ margin: 0, color: '#4b5563' }}>{thread.body}</p>
                      </div>
                      <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>
                        <div>{formatDate(thread.createdAt)}</div>
                        <div>{thread.authorName || thread.authorId}</div>
                      </div>
                    </div>

                    {Array.isArray(thread.tags) && thread.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {thread.tags.map((tag) => (
                          <span
                            key={`${thread.id}-${tag}`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '999px',
                              background: '#eef2ff',
                              color: '#3730a3',
                              fontSize: '12px',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                      <small style={{ color: '#6b7280' }}>
                        {canEdit ? 'You can edit this thread' : 'Read-only'}
                      </small>
                      {canEdit && !isEditing && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => beginEdit(thread)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteThread(thread)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <form onSubmit={(event) => handleUpdateThread(event, thread)} style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditFieldChange}
                          placeholder="Thread title"
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                        />
                        <textarea
                          name="body"
                          value={editForm.body}
                          onChange={handleEditFieldChange}
                          rows="5"
                          placeholder="Thread body"
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'vertical' }}
                        />
                        <input
                          type="text"
                          name="tags"
                          value={editForm.tags}
                          onChange={handleEditFieldChange}
                          placeholder="Tags, comma separated"
                          style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
                        />

                        {editError && <p style={{ margin: 0, color: '#b00020' }}>{editError}</p>}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Save changes'}
                          </button>
                          <button type="button" onClick={cancelEdit} disabled={editLoading}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section style={{ marginTop: '28px', display: 'grid', gap: '16px' }}>
            {user ? (
              <ThreadForm
                token={token}
                defaultCourse={selectedCourse}
                courseOptions={COURSE_OPTIONS}
                onCreated={async () => loadThreads(selectedCourse, activeQuery)}
              />
            ) : (
              <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', background: 'white' }}>
                <h3 style={{ marginTop: 0 }}>Create threads after sign in</h3>
                <p style={{ marginBottom: 0, color: '#4b5563' }}>
                  Register or sign in to post new threads, then you can edit or delete the ones you own.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  )
}

export default App