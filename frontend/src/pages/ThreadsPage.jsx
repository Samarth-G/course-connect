import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import Sidebar from '../components/Sidebar'
import ThreadForm from '../components/ThreadForm'
import HotThreads from '../components/HotThreads'
import { useSocket } from '../contexts/socketContext'

export default function ThreadsPage({ user, token, courses, selectedCourse, setSelectedCourse, openAuth }) {
  const { socket } = useSocket() || {}

  const [threadSearch, setThreadSearch] = useState('')
  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsError, setThreadsError] = useState('')
  const [activeThreadId, setActiveThreadId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [threadEditMode, setThreadEditMode] = useState(false)
  const [threadEditForm, setThreadEditForm] = useState({ title: '', body: '', tags: '' })
  const [threadActionError, setThreadActionError] = useState('')
  const [threadActionLoading, setThreadActionLoading] = useState(false)
  const [editingReplyId, setEditingReplyId] = useState('')
  const [replyEditBody, setReplyEditBody] = useState('')
  const [replyEditLoading, setReplyEditLoading] = useState(false)
  const [replyEditError, setReplyEditError] = useState('')
  const [expandedBodies, setExpandedBodies] = useState({})
  const [showAllReplies, setShowAllReplies] = useState({})
  const [expandedReplies, setExpandedReplies] = useState({})

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
    setThreadEditMode(false)
    setThreadActionError('')
    setThreadActionLoading(false)
    setEditingReplyId('')
    setReplyEditBody('')
    setReplyEditError('')
    setReplyEditLoading(false)
  }, [activeThreadId])

  // Socket.io live updates
  useEffect(() => {
    if (!socket) return

    const handleThreadCreated = (thread) => {
      if (thread.courseId === selectedCourse) {
        setThreads((prev) => [thread, ...prev])
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
      }
    }
    const handleReplyUpdated = ({ thread }) => {
      if (thread) {
        setThreads((prev) => prev.map((t) => (t.id === thread.id ? thread : t)))
      }
    }
    const handleReplyDeleted = ({ threadId, replyId }) => {
      setThreads((prev) => prev.map((t) => {
        if (t.id !== threadId) return t
        return {
          ...t,
          replies: Array.isArray(t.replies) ? t.replies.filter((reply) => reply.id !== replyId) : [],
        }
      }))
    }

    socket.on('thread:created', handleThreadCreated)
    socket.on('thread:updated', handleThreadUpdated)
    socket.on('thread:deleted', handleThreadDeleted)
    socket.on('reply:added', handleReplyAdded)
    socket.on('reply:updated', handleReplyUpdated)
    socket.on('reply:deleted', handleReplyDeleted)

    return () => {
      socket.off('thread:created', handleThreadCreated)
      socket.off('thread:updated', handleThreadUpdated)
      socket.off('thread:deleted', handleThreadDeleted)
      socket.off('reply:added', handleReplyAdded)
      socket.off('reply:updated', handleReplyUpdated)
      socket.off('reply:deleted', handleReplyDeleted)
    }
  }, [socket, selectedCourse, activeThreadId])

  const canManageThread = useMemo(() => {
    if (!user || !activeThread) return false
    return user.role === 'admin' || String(user.id) === String(activeThread.authorId)
  }, [user, activeThread])

  function canManageReply(reply) {
    if (!user || !reply) return false
    return user.role === 'admin' || String(user.id) === String(reply.authorId)
  }

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

  async function handleThreadUpdate(event) {
    event.preventDefault()
    if (!selectedCourse || !activeThread || !token || !canManageThread) return

    const sanitizedTitle = DOMPurify.sanitize(threadEditForm.title.trim())
    const sanitizedBody = DOMPurify.sanitize(threadEditForm.body.trim())
    const tags = threadEditForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!sanitizedTitle || !sanitizedBody) {
      setThreadActionError('Title and body are required')
      return
    }

    setThreadActionLoading(true)
    setThreadActionError('')

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: sanitizedTitle, body: sanitizedBody, tags }),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setThreadActionError(data.error || 'Failed to update thread')
        return
      }

      if (data.thread) {
        setThreads((prev) => prev.map((thread) => (thread.id === data.thread.id ? data.thread : thread)))
      }
      setThreadEditMode(false)
    } catch (error) {
      setThreadActionError(error.message || 'Unexpected network error')
    } finally {
      setThreadActionLoading(false)
    }
  }

  async function handleThreadDelete() {
    if (!selectedCourse || !activeThread || !token || !canManageThread) return

    setThreadActionLoading(true)
    setThreadActionError('')

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setThreadActionError(data.error || 'Failed to delete thread')
        return
      }

      await loadThreads(selectedCourse, threadSearch)
    } catch (error) {
      setThreadActionError(error.message || 'Unexpected network error')
    } finally {
      setThreadActionLoading(false)
    }
  }

  function beginThreadEdit() {
    if (!activeThread) return
    setThreadEditForm({
      title: activeThread.title || '',
      body: activeThread.body || '',
      tags: Array.isArray(activeThread.tags) ? activeThread.tags.join(', ') : '',
    })
    setThreadEditMode(true)
    setThreadActionError('')
  }

  function beginReplyEdit(reply) {
    setEditingReplyId(reply.id)
    setReplyEditBody(reply.body || '')
    setReplyEditError('')
  }

  async function handleReplyUpdate(replyId) {
    if (!selectedCourse || !activeThread || !token) return
    const sanitizedBody = DOMPurify.sanitize(replyEditBody.trim())
    if (!sanitizedBody) {
      setReplyEditError('Reply cannot be empty')
      return
    }

    setReplyEditLoading(true)
    setReplyEditError('')
    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}/replies/${encodeURIComponent(replyId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: sanitizedBody }),
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setReplyEditError(data.error || 'Failed to update reply')
        return
      }

      if (data.thread) {
        setThreads((prev) => prev.map((thread) => (thread.id === data.thread.id ? data.thread : thread)))
      }
      setEditingReplyId('')
      setReplyEditBody('')
    } catch (error) {
      setReplyEditError(error.message || 'Unexpected network error')
    } finally {
      setReplyEditLoading(false)
    }
  }

  async function handleReplyDelete(replyId) {
    if (!selectedCourse || !activeThread || !token) return

    setReplyEditLoading(true)
    setReplyEditError('')
    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(selectedCourse)}/threads/${encodeURIComponent(activeThread.id)}/replies/${encodeURIComponent(replyId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setReplyEditError(data.error || 'Failed to delete reply')
        return
      }

      setThreads((prev) => prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread
        return {
          ...thread,
          replies: Array.isArray(thread.replies) ? thread.replies.filter((reply) => reply.id !== replyId) : [],
        }
      }))
      if (editingReplyId === replyId) {
        setEditingReplyId('')
        setReplyEditBody('')
      }
    } catch (error) {
      setReplyEditError(error.message || 'Unexpected network error')
    } finally {
      setReplyEditLoading(false)
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

        <HotThreads />

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
                  {threadEditMode ? (
                    <form className="resource-form" onSubmit={handleThreadUpdate}>
                      <input
                        type="text"
                        value={threadEditForm.title}
                        onChange={(event) => setThreadEditForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Thread title"
                        required
                      />
                      <textarea
                        value={threadEditForm.body}
                        onChange={(event) => setThreadEditForm((prev) => ({ ...prev, body: event.target.value }))}
                        placeholder="Thread body"
                        rows={6}
                        required
                      />
                      <input
                        type="text"
                        value={threadEditForm.tags}
                        onChange={(event) => setThreadEditForm((prev) => ({ ...prev, tags: event.target.value }))}
                        placeholder="Tags separated by commas"
                      />
                      {threadActionError && <p className="panel-message panel-error">{threadActionError}</p>}
                      <div className="reply-submit-row">
                        <button type="button" className="ghost-button" onClick={() => setThreadEditMode(false)}>Cancel</button>
                        <button type="submit" className="reply-submit-button" disabled={threadActionLoading}>
                          {threadActionLoading ? 'Saving...' : 'Save thread'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="thread-message-bubble">
                        {(activeThread?.body || '').length > 300 && !expandedBodies[activeThread?.id] ? (
                          <>
                            <p>{DOMPurify.sanitize((activeThread?.body || '').slice(0, 300))}...</p>
                            <button type="button" className="see-more-toggle" onClick={() => setExpandedBodies((prev) => ({ ...prev, [activeThread.id]: true }))}>See more</button>
                          </>
                        ) : (
                          <>
                            <p>{DOMPurify.sanitize(activeThread?.body || '')}</p>
                            {(activeThread?.body || '').length > 300 && (
                              <button type="button" className="see-more-toggle" onClick={() => setExpandedBodies((prev) => ({ ...prev, [activeThread.id]: false }))}>See less</button>
                            )}
                          </>
                        )}
                      </div>
                      {canManageThread && (
                        <div className="resource-actions">
                          <button type="button" className="resource-action-button" onClick={beginThreadEdit}>Edit thread</button>
                          <button
                            type="button"
                            className="resource-action-button"
                            onClick={() => {
                              if (window.confirm('Delete this thread?')) {
                                handleThreadDelete()
                              }
                            }}
                            disabled={threadActionLoading}
                          >
                            {threadActionLoading ? 'Deleting...' : 'Delete thread'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {!threadEditMode && threadActionError && <p className="panel-message panel-error">{threadActionError}</p>}
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
                  {activeThreadReplies.length > 3 && !showAllReplies[activeThreadId] && (
                    <button type="button" className="see-more-toggle" onClick={() => setShowAllReplies((prev) => ({ ...prev, [activeThreadId]: true }))}>
                      Show all {activeThreadReplies.length} replies
                    </button>
                  )}
                  {(showAllReplies[activeThreadId] ? activeThreadReplies : activeThreadReplies.slice(0, 3)).map((reply) => (
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
                        {editingReplyId === reply.id ? (
                          <div className="resource-form">
                            <textarea
                              value={replyEditBody}
                              onChange={(event) => setReplyEditBody(event.target.value)}
                              rows={4}
                              placeholder="Edit reply"
                            />
                            {replyEditError && <p className="panel-message panel-error">{replyEditError}</p>}
                            <div className="reply-submit-row">
                              <button type="button" className="ghost-button" onClick={() => setEditingReplyId('')}>Cancel</button>
                              <button
                                type="button"
                                className="reply-submit-button"
                                onClick={() => handleReplyUpdate(reply.id)}
                                disabled={replyEditLoading}
                              >
                                {replyEditLoading ? 'Saving...' : 'Save reply'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="thread-message-bubble thread-message-bubble-reply">
                              {(reply.body || '').length > 300 && !expandedReplies[reply.id] ? (
                                <>
                                  <p>{DOMPurify.sanitize((reply.body || '').slice(0, 300))}...</p>
                                  <button type="button" className="see-more-toggle" onClick={() => setExpandedReplies((prev) => ({ ...prev, [reply.id]: true }))}>See more</button>
                                </>
                              ) : (
                                <>
                                  <p>{DOMPurify.sanitize(reply.body || '')}</p>
                                  {(reply.body || '').length > 300 && (
                                    <button type="button" className="see-more-toggle" onClick={() => setExpandedReplies((prev) => ({ ...prev, [reply.id]: false }))}>See less</button>
                                  )}
                                </>
                              )}
                            </div>
                            {canManageReply(reply) && (
                              <div className="resource-actions">
                                <button
                                  type="button"
                                  className="resource-action-button"
                                  onClick={() => beginReplyEdit(reply)}
                                >
                                  Edit reply
                                </button>
                                <button
                                  type="button"
                                  className="resource-action-button"
                                  onClick={() => {
                                    if (window.confirm('Delete this reply?')) {
                                      handleReplyDelete(reply.id)
                                    }
                                  }}
                                  disabled={replyEditLoading}
                                >
                                  {replyEditLoading ? 'Deleting...' : 'Delete reply'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                  {activeThreadReplies.length > 3 && showAllReplies[activeThreadId] && (
                    <button type="button" className="see-more-toggle" onClick={() => setShowAllReplies((prev) => ({ ...prev, [activeThreadId]: false }))}>
                      Show less replies
                    </button>
                  )}
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
