import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import Sidebar from '../components/Sidebar'
import ThreadForm from '../components/ThreadForm'
import { useSocket } from '../contexts/SocketContext'

export default function ThreadsPage({ user, token, courses, selectedCourse, setSelectedCourse, openAuth }) {
  const { socket, addNotification } = useSocket() || {}
  const addNotificationRef = useRef(addNotification)
  useEffect(() => { addNotificationRef.current = addNotification }, [addNotification])

  const [threadSearch, setThreadSearch] = useState('')
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')
  const [activeThreadId, setActiveThreadId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)

  const activeCourse = courses.find((c) => c.id === selectedCourse) || courses[0] || null
  const activeThread = threads.find((t) => t.id === activeThreadId) || null
  const activeThreadReplies = Array.isArray(activeThread?.replies) ? activeThread.replies : []

  useEffect(() => {
    if (!selectedCourse) return
    loadThreads(selectedCourse, '')
  }, [selectedCourse])

  useEffect(() => {
    setReplyText('')
    setReplyError('')
    setReplyLoading(false)
  }, [activeThreadId])

  // Socket.io live updates
  useEffect(() => {
    if (!socket) return

    const handleThreadCreated = (thread) => {
      if (thread.courseId === selectedCourse) {
        setThreads((prev) => [thread, ...prev])
        addNotificationRef.current?.(`New thread: ${thread.title}`)
      }
    }
    const handleThreadUpdated = (thread) => {
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)))
    }
    const handleThreadDeleted = ({ threadId }) => {
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      if (activeThreadId === threadId) setActiveThreadId('')
    }
    const handleReplyAdded = ({ thread }) => {
      if (thread) {
        setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)))
        addNotificationRef.current?.('New reply added')
      }
    }

    socket.on('thread:created', handleThreadCreated)
    socket.on('thread:updated', handleThreadUpdated)
    socket.on('thread:deleted', handleThreadDeleted)
    socket.on('reply:added', handleReplyAdded)

    return () => {
      socket.off('thread:created', handleThreadCreated)
      socket.off('thread:updated', handleThreadUpdated)
      socket.off('thread:deleted', handleThreadDeleted)
      socket.off('reply:added', handleReplyAdded)
    }
  }, [socket, selectedCourse, activeThreadId])

  async function loadThreads(courseId, query = '') {
    const trimmedQuery = query.trim()
    const searchParams = new URLSearchParams()
    if (trimmedQuery) searchParams.set('q', trimmedQuery)
    searchParams.set('limit', '50')

    setThreadsLoading(true)
    setThreadsError('')

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(courseId)}/threads${searchParams.toString() ? `?${searchParams}` : ''}`
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
        if (nextThreads.length === 0) return ''
        const exists = nextThreads.some((t) => t.id === prev)
        return exists ? prev : nextThreads[0].id
      })
    } catch (error) {
      setThreads([])
      setThreadsError(error.message || 'Unexpected network error')
    } finally {
      setThreadsLoading(false)
    }
  }

  const formatThreadDate = (value) => {
    if (!value) return 'Recently'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleReplySubmit = async (event) => {
    event.preventDefault()
    if (!selectedCourse || !activeThread) return

    if (!user || !token) {
      openAuth('login')
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
      const response = await fetch(
        `/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ body: DOMPurify.sanitize(trimmedReply) }),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setReplyError(data.error || 'Failed to add reply')
        return
      }

      const updatedThread = data.thread || null
      if (updatedThread) {
        setThreads((prev) => prev.map((t) => (t.id === updatedThread.id ? updatedThread : t)))
      }
      setReplyText('')
    } catch (error) {
      setReplyError(error.message || 'Unexpected network error')
    } finally {
      setReplyLoading(false)
    }
  }

  const visibleThreads = useMemo(() => {
    const normalized = threadSearch.trim().toLowerCase()
    if (!normalized) return threads
    return threads.filter((t) => {
      const title = String(t.title || '').toLowerCase()
      const body = String(t.body || '').toLowerCase()
      return title.includes(normalized) || body.includes(normalized)
    })
  }, [threadSearch, threads])

  const courseThreadList = useMemo(() => {
    return visibleThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      author: thread.authorName || 'Anonymous',
      body: thread.body,
      createdLabel: formatThreadDate(thread.createdAt),
      tags: Array.isArray(thread.tags) ? thread.tags : [],
    }))
  }, [visibleThreads])

  return (
    <section className="threads-page">
      <Sidebar
        title={`${activeCourse?.label || 'Course'} Topics`}
        searchTerm={threadSearch}
        onSearchTermChange={setThreadSearch}
        searchInputId="thread-search"
        subheading="Discussions"
        items={courseThreadList.map((t) => ({ id: t.id, label: t.title }))}
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
              if (!user || !token) { openAuth('login'); return }
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
              if (thread?.courseId) setSelectedCourse(thread.courseId)
              await loadThreads(thread?.courseId || selectedCourse, '')
              if (thread?.id) setActiveThreadId(thread.id)
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
                    <p>{DOMPurify.sanitize(activeThread?.body || '')}</p>
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
                  {activeThreadReplies.length === 0 && (
                    <p className="thread-replies-empty">No replies yet. Start the conversation below.</p>
                  )}
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
                          <p>{DOMPurify.sanitize(reply.body || '')}</p>
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
                      onChange={(e) => setReplyText(e.target.value)}
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
  )
}
