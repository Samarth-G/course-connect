import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import CourseCard from './components/CourseCard'
import CourseForm from './components/CourseForm'
import ThreadForm from './components/ThreadForm'
import './App.css'

const TOKEN_STORAGE_KEY = 'courseconnect_auth_token'
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
  const [showNewCourseForm, setShowNewCourseForm] = useState(false)
  const [threadSearch, setThreadSearch] = useState('')
  const [resourceSearch, setResourceSearch] = useState('')
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')
  const [activeThreadId, setActiveThreadId] = useState('')
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')
  const [activeResourceId, setActiveResourceId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [showNewResourceForm, setShowNewResourceForm] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    title: '',
    type: '',
    summary: '',
    resourceFile: null,
  })
  const [resourceSubmitError, setResourceSubmitError] = useState('')
  const [resourceSubmitLoading, setResourceSubmitLoading] = useState(false)

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
    setShowNewCourseForm(false)
  }, [activePage])

  useEffect(() => {
    if (!selectedCourse) {
      return
    }
    loadThreads(selectedCourse, '')
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedCourse) {
      setResources([])
      setResourcesLoading(false)
      setResourcesError('')
      return
    }

    loadResources(selectedCourse)
  }, [selectedCourse])

  useEffect(() => {
    setShowNewResourceForm(false)
    setResourceSubmitError('')
    setResourceForm((prev) => ({
      ...prev,
      title: '',
      type: '',
      summary: '',
      resourceFile: null,
    }))
  }, [selectedCourse])
  async function loadResources(courseId) {
    setResourcesLoading(true)
    setResourcesError('')

    const pageSize = 100
    let page = 1
    let allResources = []

    try {
      while (true) {
        const response = await fetch(
          `/api/courses/${encodeURIComponent(courseId)}/resources?limit=${pageSize}&page=${page}`,
        )
        const data = await response.json()

        if (!response.ok) {
          setResources([])
          setResourcesError(data.error || 'Failed to load resources')
          return
        }

        const pageResults = Array.isArray(data.results) ? data.results : []
        allResources = allResources.concat(pageResults)

        if (pageResults.length < pageSize) {
          break
        }

        page += 1
      }

      setResources(allResources)
    } catch (error) {
      setResources([])
      setResourcesError(error.message || 'Unexpected network error')
    } finally {
      setResourcesLoading(false)
    }
  }

  const handleResourceInputChange = (event) => {
    const { name, value, files } = event.target

    if (name === 'resourceFile') {
      setResourceForm((prev) => ({
        ...prev,
        resourceFile: files?.[0] || null,
      }))
      return
    }

    setResourceForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleResourceSubmit = async (event) => {
    event.preventDefault()
    setResourceSubmitError('')

    if (!user || !token) {
      openAuth('login')
      return
    }

    if (!selectedCourse) {
      setResourceSubmitError('Select a course first')
      return
    }

    if (!resourceForm.title.trim() || !resourceForm.type.trim() || !resourceForm.summary.trim() || !resourceForm.resourceFile) {
      setResourceSubmitError('All resource fields and a file are required')
      return
    }

    setResourceSubmitLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', resourceForm.title.trim())
      formData.append('type', resourceForm.type.trim())
      formData.append('summary', resourceForm.summary.trim())
      formData.append('resourceFile', resourceForm.resourceFile)

      const response = await fetch(`/api/courses/${encodeURIComponent(selectedCourse)}/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setResourceSubmitError(data.error || 'Failed to create resource')
        return
      }

      setResourceForm({
        title: '',
        type: '',
        summary: '',
        resourceFile: null,
      })
      setShowNewResourceForm(false)
      await loadResources(selectedCourse)
      if (data.id) {
        setActiveResourceId(data.id)
      }
    } catch (error) {
      setResourceSubmitError(error.message || 'Unexpected network error')
    } finally {
      setResourceSubmitLoading(false)
    }
  }

  useEffect(() => {
    setActiveResourceId('')
    setResourceSearch('')
  }, [selectedCourse])

  useEffect(() => {
    setReplyText('')
    setReplyError('')
    setReplyLoading(false)
  }, [activeThreadId])

  const handleCourseCreated = async (course) => {
    setShowNewCourseForm(false)
    setCourseSearch('')
    await loadCourses('')
    if (course?.id) {
      setSelectedCourse(course.id)
    }
  }

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
        String(course.description || '').toLowerCase().includes(normalized)
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
    const normalized = resourceSearch.trim().toLowerCase()

    if (!normalized) {
      return resources
    }

    return resources.filter((resource) => {
      return (
        String(resource.title || '').toLowerCase().includes(normalized)
        || String(resource.summary || '').toLowerCase().includes(normalized)
        || String(resource.type || '').toLowerCase().includes(normalized)
      )
    })
  }, [resourceSearch, resources])

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

  const resourceSidebarItems = useMemo(() => {
    return visibleResources.map((resource) => ({
      id: resource.id,
      label: resource.title,
    }))
  }, [visibleResources])

  const activeResource = visibleResources.find((resource) => resource.id === activeResourceId) || visibleResources[0] || null
  const activeResourceFileName = activeResource?.fileName || (activeResource?.filePath ? activeResource.filePath.split('/').pop() : '')
  const activeResourceFileUrl = activeResource?.filePath ? `/uploads/${activeResource.filePath}` : ''

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
                </label>
                <button
                  type="button"
                  className="new-thread-button courses-new-button"
                  onClick={() => {
                    if (!user || !token) {
                      openAuth('login')
                      return
                    }
                    setShowNewCourseForm((prev) => !prev)
                  }}
                >
                  {showNewCourseForm ? '✕ Cancel' : '+ New Course'}
                </button>
              </div>

              {showNewCourseForm && (
                <CourseForm
                  token={token}
                  onCreated={handleCourseCreated}
                />
              )}

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
                  <p className="panel-message">No courses found.</p>
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
                  courseOptions={courses}
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
              <div className="thread-stage-toolbar">
                <button
                  type="button"
                  className="new-thread-button"
                  onClick={() => {
                    if (!user || !token) {
                      openAuth('login')
                      return
                    }
                    setShowNewResourceForm((prev) => !prev)
                  }}
                >
                  {showNewResourceForm ? '✕ Cancel' : '+ New Resource'}
                </button>
              </div>

              {showNewResourceForm && (
                <form className="resource-form" onSubmit={handleResourceSubmit}>
                  <div className="resource-form-header">
                    <div>
                      <p className="resource-form-eyebrow">Upload</p>
                      <h3>Add a new resource</h3>
                    </div>
                    <small>Posting to: {activeCourse?.label || selectedCourse || 'Selected course'}</small>
                  </div>

                  <div className="resource-form-grid">
                    <input
                      type="text"
                      name="title"
                      value={resourceForm.title}
                      onChange={handleResourceInputChange}
                      placeholder="Resource title"
                      required
                    />
                    <input
                      type="text"
                      name="type"
                      value={resourceForm.type}
                      onChange={handleResourceInputChange}
                      placeholder="Type, e.g. Slides"
                      required
                    />
                  </div>

                  <textarea
                    name="summary"
                    value={resourceForm.summary}
                    onChange={handleResourceInputChange}
                    placeholder="Short description"
                    rows={5}
                    required
                  />

                  <input
                    type="file"
                    name="resourceFile"
                    onChange={handleResourceInputChange}
                    required
                  />

                  {resourceSubmitError && <p className="panel-message panel-error">{resourceSubmitError}</p>}

                  <div className="reply-submit-row">
                    <button type="submit" className="reply-submit-button" disabled={resourceSubmitLoading}>
                      {resourceSubmitLoading ? 'Uploading...' : 'Upload resource'}
                    </button>
                  </div>
                </form>
              )}

              {resourcesLoading && (
                <p className="panel-message">Loading resources...</p>
              )}

              {!resourcesLoading && resourcesError && (
                <p className="panel-message">{resourcesError}</p>
              )}

              {!resourcesLoading && !resourcesError && resourceSidebarItems.length === 0 && (
                <p className="panel-message">No resources yet for this course.</p>
              )}

              {!resourcesLoading && !resourcesError && resourceSidebarItems.length > 0 && activeResource && (
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
                          <p>{formatThreadDate(activeResource.createdAt || activeResource.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="thread-detail-course">{activeResource.type}</div>
                    </div>

                    <div className="resource-file-meta">
                      <strong>{activeResourceFileName || 'No file attached'}</strong>
                      <p>{activeResource.mimeType || 'Uploaded attachment'}</p>
                    </div>

                    <div className="resource-summary">
                      <p>{activeResource.summary}</p>
                    </div>

                    <div className="resource-actions">
                      {activeResourceFileUrl ? (
                        <>
                          <a href={activeResourceFileUrl} target="_blank" rel="noreferrer" className="resource-action-button resource-action-link">
                            Open Resource
                          </a>
                          <a href={activeResourceFileUrl} download className="resource-action-button resource-action-link">
                            Download
                          </a>
                        </>
                      ) : (
                        <button type="button" className="resource-action-button" disabled>
                          No file attached
                        </button>
                      )}
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