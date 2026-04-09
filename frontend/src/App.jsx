import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import CourseCard from './components/CourseCard'
import ThreadForm from './components/ThreadForm'
import './App.css'

const TOKEN_STORAGE_KEY = 'courseconnect_auth_token'

const LOCAL_RESOURCES = [
  {
    id: 'cosc-222-slides-week-3',
    courseId: 'COSC-222',
    title: 'Week 3 Graph Algorithms Slides',
    type: 'Slides',
    summary: 'Traversal concepts, BFS vs DFS patterns, and complexity walk-throughs.',
    uploader: 'Course Staff',
    updatedAt: '2026-03-04T15:00:00.000Z',
  },
  {
    id: 'cosc-222-midterm-guide',
    courseId: 'COSC-222',
    title: 'Midterm 1 Study Guide',
    type: 'Study Guide',
    summary: 'Practice topics and a checklist covering key graph and runtime questions.',
    uploader: 'Student Mentor',
    updatedAt: '2026-03-09T13:20:00.000Z',
  },
  {
    id: 'biol-117-genetics-summary',
    courseId: 'BIOL-117',
    title: 'Genetics Summary Notes',
    type: 'Notes',
    summary: 'Condensed notes for dominant/recessive patterns and Punnett square examples.',
    uploader: 'Course Staff',
    updatedAt: '2026-03-10T16:45:00.000Z',
  },
  {
    id: 'biol-117-lab-report-guide',
    courseId: 'BIOL-117',
    title: 'Lab Report Writing Guide',
    type: 'Guide',
    summary: 'Section-by-section expectations and citation format reminders for reports.',
    uploader: 'TA Team',
    updatedAt: '2026-03-11T11:10:00.000Z',
  },
  {
    id: 'comm-105-case-template',
    courseId: 'COMM-105',
    title: 'Case Study Analysis Template',
    type: 'Template',
    summary: 'A reusable structure for issue framing, options, and recommendations.',
    uploader: 'Course Staff',
    updatedAt: '2026-03-13T09:30:00.000Z',
  },
  {
    id: 'comm-105-presentation-checklist',
    courseId: 'COMM-105',
    title: 'Presentation Checklist',
    type: 'Checklist',
    summary: 'Narrative flow checkpoints and final slide polish reminders before presenting.',
    uploader: 'Student Mentor',
    updatedAt: '2026-03-15T18:00:00.000Z',
  },
]

function App() {
  const [activePage, setActivePage] = useState('courses')
  const [authMode, setAuthMode] = useState('login')
  const [showAuthPanel, setShowAuthPanel] = useState(false)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', profileImage: null })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(token))

  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [threadSearch, setThreadSearch] = useState('')
  const [resourceSearch, setResourceSearch] = useState('')
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')
  const [activeThreadId, setActiveThreadId] = useState('')
  const [activeResourceId, setActiveResourceId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)

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
    loadCourses('')
  }, [])

  useEffect(() => {
    if (!selectedCourse) {
      return
    }
    loadThreads(selectedCourse, '')
  }, [selectedCourse])

  useEffect(() => {
    setActiveResourceId('')
    setResourceSearch('')
  }, [selectedCourse])

  useEffect(() => {
    setReplyText('')
    setReplyError('')
    setReplyLoading(false)
  }, [activeThreadId])

  async function loadCourses(query = '') {
    const trimmedQuery = query.trim()
    const searchParams = new URLSearchParams()
    if (trimmedQuery) {
      searchParams.set('q', trimmedQuery)
    }

    setCoursesLoading(true)
    setCoursesError('')

    try {
      const response = await fetch(`/api/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
      const data = await response.json()

      if (!response.ok) {
        setCourses([])
        setCoursesError(data.error || 'Failed to load courses')
        return
      }

      const nextCourses = Array.isArray(data.results) ? data.results : []
      setCourses(nextCourses)
      setSelectedCourse((prev) => {
        if (nextCourses.length === 0) {
          return ''
        }
        const exists = nextCourses.some((course) => course.id === prev)
        return exists ? prev : nextCourses[0].id
      })
    } catch (error) {
      setCourses([])
      setCoursesError(error.message || 'Unexpected network error')
    } finally {
      setCoursesLoading(false)
    }
  }

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
        setThreadsError(data.error || 'Failed to load threads')
        return
      }

      const nextThreads = Array.isArray(data.results) ? data.results : []
      setThreads(nextThreads)
      setActiveThreadId((prev) => {
        if (nextThreads.length === 0) {
          return ''
        }
        const exists = nextThreads.some((thread) => thread.id === prev)
        return exists ? prev : nextThreads[0].id
      })
    } catch (error) {
      setThreads([])
      setThreadsError(error.message || 'Unexpected network error')
    } finally {
      setThreadsLoading(false)
    }
  }

  const handleAuthInputChange = (event) => {
    const { name, value, files } = event.target
    if (name === 'profileImage') {
      setAuthForm((prev) => ({ ...prev, profileImage: files[0] || null }))
    } else {
      setAuthForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match')
      setAuthLoading(false)
      return
    }

    try {
      let response

      if (authMode === 'register') {
        const formData = new FormData()
        formData.append('name', authForm.name.trim())
        formData.append('email', authForm.email.trim())
        formData.append('password', authForm.password)
        if (authForm.profileImage) {
          formData.append('profileImage', authForm.profileImage)
        }

        response = await fetch('/api/auth/register', {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email.trim(), password: authForm.password }),
        })
      }

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
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '', profileImage: null })
      setShowAuthPanel(false)
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
  }

  const formatThreadDate = (value) => {
    if (!value) {
      return 'Recently'
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Recently'
    }

    return parsedDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleReplySubmit = async (event) => {
    event.preventDefault()

    if (!selectedCourse || !activeThread) {
      return
    }

    if (!user || !token) {
      setShowAuthPanel(true)
      setAuthMode('login')
      return
    }

    const trimmedReply = replyText.trim()
    if (!trimmedReply) {
      setReplyError('Reply cannot be empty')
      return
    }

    setReplyLoading(true)
    setReplyError('')

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: trimmedReply }),
      })
      const data = await response.json()

      if (!response.ok) {
        setReplyError(data.error || 'Failed to add reply')
        return
      }

      const updatedThread = data.thread || null
      if (updatedThread) {
        setThreads((prevThreads) => prevThreads.map((thread) => (thread.id === updatedThread.id ? updatedThread : thread)))
      }
      setReplyText('')
    } catch (error) {
      setReplyError(error.message || 'Unexpected network error')
    } finally {
      setReplyLoading(false)
    }
  }

  const activeCourse = courses.find((course) => course.id === selectedCourse) || courses[0] || null
  const activeThread = threads.find((thread) => thread.id === activeThreadId) || null
  const activeThreadReplies = Array.isArray(activeThread?.replies) ? activeThread.replies : []

  const filteredCourses = useMemo(() => {
    const normalized = courseSearch.trim().toLowerCase()
    if (!normalized) {
      return courses
    }
    return courses.filter((course) => {
      return (
        String(course.label || '').toLowerCase().includes(normalized) ||
        String(course.title || '').toLowerCase().includes(normalized) ||
        course.description.toLowerCase().includes(normalized)
      )
    })
  }, [courseSearch, courses])

  const visibleThreads = useMemo(() => {
    const normalized = threadSearch.trim().toLowerCase()
    if (!normalized) {
      return threads
    }
    return threads.filter((thread) => {
      const title = String(thread.title || '').toLowerCase()
      const body = String(thread.body || '').toLowerCase()
      return title.includes(normalized) || body.includes(normalized)
    })
  }, [threadSearch, threads])

  const visibleResources = useMemo(() => {
    const currentCourseId = String(selectedCourse || '').toUpperCase()
    const resourcesForCourse = LOCAL_RESOURCES.filter((resource) => String(resource.courseId || '').toUpperCase() === currentCourseId)
    const normalized = resourceSearch.trim().toLowerCase()

    if (!normalized) {
      return resourcesForCourse
    }

    return resourcesForCourse.filter((resource) => {
      return (
        String(resource.title || '').toLowerCase().includes(normalized)
        || String(resource.summary || '').toLowerCase().includes(normalized)
        || String(resource.type || '').toLowerCase().includes(normalized)
      )
    })
  }, [resourceSearch, selectedCourse])

  const courseThreadList = useMemo(() => {
    return visibleThreads.map((thread) => {
      return {
        id: thread.id,
        title: thread.title,
        author: thread.authorName || 'Anonymous',
        body: thread.body,
        createdLabel: formatThreadDate(thread.createdAt),
        tags: Array.isArray(thread.tags) ? thread.tags : [],
      }
    })
  }, [visibleThreads])

  const activeResource = useMemo(() => {
    if (visibleResources.length === 0) {
      return null
    }
    return visibleResources.find((resource) => resource.id === activeResourceId) || visibleResources[0]
  }, [activeResourceId, visibleResources])

  const resourceSidebarItems = useMemo(() => {
    return visibleResources.map((resource) => ({
      id: resource.id,
      label: resource.title,
    }))
  }, [visibleResources])

  const openAuth = (mode) => {
    setAuthMode(mode)
    setShowAuthPanel(true)
  }

  if (sessionLoading) {
    return <div className="loading-screen">Loading session...</div>
  }

  return (
    <div className="app-shell">
      <Header
        user={user}
        activePage={activePage}
        onNavigate={setActivePage}
        onShowAuth={openAuth}
        onLogout={handleLogout}
      />

      <main className="page-shell">
        {activePage === 'courses' && (
          <section className="courses-page">
            <section className="hero-panel">
              <h1>CourseConnect</h1>
              <p>The Heart of UBC Academic Collaboration</p>
            </section>

            <section className="courses-section">
              <div className="courses-header">
                <h2>Courses</h2>
                <label className="search-pill" htmlFor="course-search">
                  <span className="search-icon">=</span>
                  <input
                    id="course-search"
                    type="search"
                    value={courseSearch}
                    onChange={(event) => setCourseSearch(event.target.value)}
                    placeholder="Find A Course (e.g. COSC 320)"
                  />
                  <span className="search-icon">Q</span>
                </label>
              </div>

              <div className="course-grid">
                {coursesLoading && <p className="panel-message">Loading courses...</p>}
                {coursesError && <p className="panel-message panel-error">{coursesError}</p>}

                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    code={course.label || course.id}
                    title={course.title || course.label || course.id}
                    description={course.description}
                    onOpenDiscussion={() => {
                      setSelectedCourse(course.id)
                      setActivePage('threads')
                    }}
                  />
                ))}

                {!coursesLoading && !coursesError && filteredCourses.length === 0 && (
                  <p className="panel-message">No courses found from your thread data.</p>
                )}
              </div>
            </section>
          </section>
        )}

        {activePage === 'threads' && (
          <section className="threads-page">
            <Sidebar
              title={`${activeCourse?.label || 'Course'} Topics`}
              searchTerm={threadSearch}
              onSearchTermChange={setThreadSearch}
              searchInputId="thread-search"
              subheading="Discussions"
              items={courseThreadList.map((thread) => ({
                id: thread.id,
                label: thread.title,
              }))}
              activeItemId={activeThreadId}
              onSelectItem={setActiveThreadId}
              courses={courses}
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
            />

            <section className="thread-stage">
              <div className="thread-stage-toolbar">
                <button
                  type="button"
                  className="new-thread-button"
                  onClick={() => {
                    if (!user || !token) {
                      openAuth('login')
                      return
                    }
                    setShowNewThreadForm((prev) => !prev)
                  }}
                >
                  {showNewThreadForm ? '✕ Cancel' : '+ New Thread'}
                </button>
              </div>

              {showNewThreadForm && (
                <ThreadForm
                  token={token}
                  defaultCourse={selectedCourse}
                  courseOptions={courses.map((c) => ({ code: c.id, title: c.label || c.id }))}
                  onCreated={async (thread) => {
                    setShowNewThreadForm(false)
                    if (thread?.courseId) {
                      setSelectedCourse(thread.courseId)
                    }
                    await loadThreads(thread?.courseId || selectedCourse, '')
                    if (thread?.id) {
                      setActiveThreadId(thread.id)
                    }
                  }}
                />
              )}

              {threadsLoading && <p className="panel-message">Loading discussions...</p>}
              {threadsError && <p className="panel-message panel-error">{threadsError}</p>}

              {!threadsLoading && !threadsError && courseThreadList.length === 0 && (
                <p className="panel-message">No threads found for this course.</p>
              )}

              {!threadsLoading && !threadsError && courseThreadList.length > 0 && (
                <>
                  <header className="thread-title-row">
                    <h2>{activeThread?.title || activeCourse?.label || 'Threads'}</h2>
                  </header>

                  <div className="thread-detail-panel">
                    <div className="thread-detail-meta">
                      <div className="thread-detail-author">
                        {activeThread?.authorProfileImage ? (
                          <img src={`/uploads/${activeThread.authorProfileImage}`} alt="" className="avatar-img" />
                        ) : (
                          <span className="avatar-dot" aria-hidden="true">
                            {(activeThread?.authorName || 'A').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <strong>{activeThread?.authorName || 'Anonymous'}</strong>
                          <p>{formatThreadDate(activeThread?.createdAt)}</p>
                        </div>
                      </div>

                      <div className="thread-detail-course">{activeCourse?.label || 'Course'}</div>
                    </div>

                    <div className="thread-conversation">
                      <article className="thread-message thread-message-original">
                        <div className="thread-message-bubble">
                          <p>{activeThread?.body}</p>
                        </div>

                        {Array.isArray(activeThread?.tags) && activeThread.tags.length > 0 && (
                          <div className="thread-tags">
                            {activeThread.tags.map((tag) => (
                              <span key={`${activeThread.id}-${tag}`}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </article>

                      <div className="thread-replies-feed">
                        {activeThreadReplies.length === 0 && <p className="thread-replies-empty">No replies yet. Start the conversation below.</p>}

                        {activeThreadReplies.map((reply) => (
                          <article className="thread-message thread-message-reply" key={reply.id}>
                            {reply.authorProfileImage ? (
                              <img src={`/uploads/${reply.authorProfileImage}`} alt="" className="avatar-img avatar-img-reply" />
                            ) : (
                              <span className="avatar-dot avatar-dot-reply" aria-hidden="true">
                                {(reply.authorName || 'A').slice(0, 1).toUpperCase()}
                              </span>
                            )}

                            <div className="thread-message-content">
                              <div className="thread-message-meta">
                                <strong>{reply.authorName || 'Anonymous'}</strong>
                                <span>{formatThreadDate(reply.createdAt)}</span>
                              </div>
                              <div className="thread-message-bubble thread-message-bubble-reply">
                                <p>{reply.body}</p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      <form className="thread-reply-composer" onSubmit={handleReplySubmit}>
                        <label htmlFor="thread-reply-body">Reply to this thread</label>

                        {user ? (
                          <textarea
                            id="thread-reply-body"
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Write a reply..."
                            rows={4}
                          />
                        ) : (
                          <div className="thread-reply-lock">
                            <p>Sign in to reply and join the conversation.</p>
                            <button type="button" className="auth-chip auth-chip-dark" onClick={() => openAuth('login')}>
                              Sign in
                            </button>
                          </div>
                        )}

                        {replyError && <p className="panel-message panel-error">{replyError}</p>}

                        {user && (
                          <div className="reply-submit-row">
                            <button type="submit" className="reply-submit-button" disabled={replyLoading}>
                              {replyLoading ? 'Sending...' : 'Reply'}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </>
              )}
            </section>
          </section>
        )}

        {activePage === 'resources' && (
          <section className="threads-page">
            <Sidebar
              title={`${activeCourse?.label || 'Course'} Library`}
              searchTerm={resourceSearch}
              onSearchTermChange={setResourceSearch}
              searchInputId="resource-search"
              subheading="Resources"
              items={resourceSidebarItems}
              activeItemId={activeResource?.id || ''}
              onSelectItem={setActiveResourceId}
              courses={courses}
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
            />

            <section className="thread-stage resource-stage">
              {resourceSidebarItems.length === 0 && (
                <p className="panel-message">No local resources yet for this course.</p>
              )}

              {resourceSidebarItems.length > 0 && activeResource && (
                <>
                  <header className="thread-title-row">
                    <h2>{activeResource.title}</h2>
                  </header>

                  <article className="resource-detail-panel">
                    <div className="thread-detail-meta">
                      <div className="thread-detail-author">
                        <span className="avatar-dot" aria-hidden="true">
                          {(activeResource.uploader || 'U').slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{activeResource.uploader || 'Anonymous'}</strong>
                          <p>{formatThreadDate(activeResource.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="thread-detail-course">{activeResource.type}</div>
                    </div>

                    <div className="resource-summary">
                      <p>{activeResource.summary}</p>
                    </div>

                    <div className="resource-actions">
                      <button type="button" className="resource-action-button" disabled>
                        Open Resource (Coming Soon)
                      </button>
                      <button type="button" className="resource-action-button" disabled>
                        Download (Coming Soon)
                      </button>
                    </div>
                  </article>
                </>
              )}
            </section>
          </section>
        )}

        {activePage === 'sessions' && (
          <section className="placeholder-page">
            <h2>Study Sessions</h2>
            <p>Session scheduling will appear here next.</p>
          </section>
        )}
      </main>

      <Footer />

      {showAuthPanel && !user && (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Authentication">
          <div className="auth-panel">
            <h3>{authMode === 'login' ? 'Sign in' : 'Register'}</h3>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={handleAuthInputChange}
                  required
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authForm.email}
                onChange={handleAuthInputChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authForm.password}
                onChange={handleAuthInputChange}
                required
              />

              {authMode === 'register' && (
                <>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={authForm.confirmPassword}
                    onChange={handleAuthInputChange}
                    required
                  />
                  <label className="file-upload-label" htmlFor="profile-image-upload">
                    Profile Image (optional)
                    <input
                      id="profile-image-upload"
                      type="file"
                      name="profileImage"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={handleAuthInputChange}
                    />
                  </label>
                </>
              )}

              {authError && <p className="panel-error">{authError}</p>}

              <div className="auth-actions">
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Register'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
                >
                  {authMode === 'login' ? 'Need an account?' : 'Already registered?'}
                </button>
              </div>
            </form>
            <button type="button" className="close-auth" onClick={() => setShowAuthPanel(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App