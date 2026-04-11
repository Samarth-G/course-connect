import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { useSocket } from '../contexts/socketContext'

const DAY_START_HOUR = 7
const DAY_END_HOUR = 22
const PIXELS_PER_MINUTE = 1
const MINUTES_IN_DAY_VIEW = (DAY_END_HOUR - DAY_START_HOUR) * 60
const SESSION_LENGTH_CHOICES = [30, 45, 60, 90, 120, 150, 180]

function startOfWeekMonday(sourceDate) {
  const date = new Date(sourceDate)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const distanceToMonday = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - distanceToMonday)
  return date
}

function addDays(sourceDate, numberOfDays) {
  const date = new Date(sourceDate)
  date.setDate(date.getDate() + numberOfDays)
  return date
}

function formatDateInput(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatTimeInput(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function toLocalDateTime(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00`)
}

function formatWeekday(date) {
  return date.toLocaleDateString('en-CA', { weekday: 'short' })
}

function formatDayNumber(date) {
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function formatSessionTimeRange(startAtValue, endAtValue) {
  const start = new Date(startAtValue)
  const end = new Date(endAtValue)
  return `${start.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}`
}

function minutesFromDayStart(date) {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes()
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

export default function SessionsPage({ user, token, openAuth }) {
  const { socket, addNotification } = useSocket() || {}
  const addNotificationRef = useRef(addNotification)
  useEffect(() => { addNotificationRef.current = addNotification }, [addNotification])

  const [rooms, setRooms] = useState(['Room 117'])
  const [selectedRoom, setSelectedRoom] = useState('Room 117')
  const [weekStartDate, setWeekStartDate] = useState(() => startOfWeekMonday(new Date()))
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')

  const [form, setForm] = useState(() => {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    if (now.getHours() < DAY_START_HOUR) now.setHours(DAY_START_HOUR, 0, 0, 0)
    if (now.getHours() > DAY_END_HOUR - 1) now.setHours(DAY_END_HOUR - 1, 0, 0, 0)
    return {
      date: formatDateInput(now),
      time: formatTimeInput(now),
      lengthMinutes: 60,
      title: '',
    }
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [editForm, setEditForm] = useState({ title: '', date: '', time: '', lengthMinutes: 60 })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index))
  }, [weekStartDate])

  const hourTicks = useMemo(() => {
    return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, idx) => DAY_START_HOUR + idx)
  }, [])

  const selectedSession = useMemo(() => sessions.find((session) => session.id === selectedSessionId) || null, [sessions, selectedSessionId])

  const canEditSelectedSession = useMemo(() => {
    if (!selectedSession || !user) return false
    return user.role === 'admin' || String(user.id) === String(selectedSession.authorId)
  }, [selectedSession, user])

  useEffect(() => {
    if (!selectedSession) {
      setEditForm({ title: '', date: '', time: '', lengthMinutes: 60 })
      setEditError('')
      return
    }

    const startAt = new Date(selectedSession.startAt)
    const endAt = new Date(selectedSession.endAt)
    const durationMinutes = Math.max(15, Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60)))

    setEditForm({
      title: selectedSession.title || '',
      date: formatDateInput(startAt),
      time: formatTimeInput(startAt),
      lengthMinutes: durationMinutes,
    })
    setEditError('')
  }, [selectedSession])

  async function loadSessions(room, weekStart) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        room,
        weekStart: formatDateInput(weekStart),
      })
      const response = await fetch(`/api/sessions?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        setSessions([])
        setError(data.error || 'Failed to load sessions')
        return
      }

      const nextRooms = Array.isArray(data.rooms) && data.rooms.length > 0 ? data.rooms : ['Room 117']
      setRooms(nextRooms)
      setSelectedRoom(data.room || room)

      const nextSessions = Array.isArray(data.results) ? data.results : []
      setSessions(nextSessions)
      setSelectedSessionId((prev) => (nextSessions.some((session) => session.id === prev) ? prev : ''))
    } catch (requestError) {
      setSessions([])
      setError(requestError.message || 'Unexpected network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedRoom) return
    loadSessions(selectedRoom, weekStartDate)
  }, [selectedRoom, weekStartDate])

  useEffect(() => {
    if (!socket) return

    const handleSessionCreated = (session) => {
      if (String(session?.room || '').toLowerCase() !== selectedRoom.toLowerCase()) return
      loadSessions(selectedRoom, weekStartDate)
      addNotificationRef.current?.(`New session: ${session.title}`)
    }

    const handleSessionUpdated = (session) => {
      if (String(session?.room || '').toLowerCase() !== selectedRoom.toLowerCase()) {
        loadSessions(selectedRoom, weekStartDate)
        return
      }
      loadSessions(selectedRoom, weekStartDate)
    }

    const handleSessionDeleted = ({ room }) => {
      if (String(room || '').toLowerCase() === selectedRoom.toLowerCase()) {
        loadSessions(selectedRoom, weekStartDate)
      }
    }

    socket.on('session:created', handleSessionCreated)
    socket.on('session:updated', handleSessionUpdated)
    socket.on('session:deleted', handleSessionDeleted)

    return () => {
      socket.off('session:created', handleSessionCreated)
      socket.off('session:updated', handleSessionUpdated)
      socket.off('session:deleted', handleSessionDeleted)
    }
  }, [socket, selectedRoom, weekStartDate])

  async function handleCreateSession(event) {
    event.preventDefault()
    setSubmitError('')

    if (!user || !token) {
      openAuth('login')
      return
    }

    const trimmedTitle = DOMPurify.sanitize(form.title.trim())
    if (!trimmedTitle) {
      setSubmitError('Session title is required')
      return
    }

    const sessionStart = toLocalDateTime(form.date, form.time)
    if (Number.isNaN(sessionStart.getTime())) {
      setSubmitError('Select a valid date and time')
      return
    }
    const duration = Number(form.lengthMinutes)
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000)

    setSubmitLoading(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room: selectedRoom,
          title: trimmedTitle,
          startAt: sessionStart.toISOString(),
          endAt: sessionEnd.toISOString(),
          timeZoneOffsetMinutes: sessionStart.getTimezoneOffset(),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to create session')
        return
      }

      setForm((prev) => ({ ...prev, title: '' }))
      await loadSessions(selectedRoom, weekStartDate)
      if (data.session?.id) setSelectedSessionId(data.session.id)
    } catch (requestError) {
      setSubmitError(requestError.message || 'Unexpected network error')
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleUpdateSession(event) {
    event.preventDefault()
    if (!selectedSession || !token || !canEditSelectedSession) return

    const trimmedTitle = DOMPurify.sanitize(editForm.title.trim())
    if (!trimmedTitle) {
      setEditError('Session title is required')
      return
    }

    const sessionStart = toLocalDateTime(editForm.date, editForm.time)
    if (Number.isNaN(sessionStart.getTime())) {
      setEditError('Select a valid date and time')
      return
    }

    const duration = Number(editForm.lengthMinutes)
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000)

    setEditLoading(true)
    setEditError('')

    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(selectedSession.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room: selectedRoom,
          title: trimmedTitle,
          startAt: sessionStart.toISOString(),
          endAt: sessionEnd.toISOString(),
          timeZoneOffsetMinutes: sessionStart.getTimezoneOffset(),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setEditError(data.error || 'Failed to update session')
        return
      }

      await loadSessions(selectedRoom, weekStartDate)
      if (data.session?.id) setSelectedSessionId(data.session.id)
    } catch (requestError) {
      setEditError(requestError.message || 'Unexpected network error')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeleteSession() {
    if (!selectedSession || !token || !canEditSelectedSession) return

    setEditLoading(true)
    setEditError('')
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(selectedSession.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || 'Failed to delete session')
        return
      }

      await loadSessions(selectedRoom, weekStartDate)
      setSelectedSessionId('')
    } catch (requestError) {
      setEditError(requestError.message || 'Unexpected network error')
    } finally {
      setEditLoading(false)
    }
  }

  function canManageSession(session) {
    if (!session || !user) return false
    return user.role === 'admin' || String(user.id) === String(session.authorId)
  }

  const sessionsByDay = useMemo(() => {
    const map = new Map()
    weekDays.forEach((day, index) => {
      const key = formatDateInput(day)
      map.set(key, { index, sessions: [] })
    })

    sessions.forEach((session) => {
      const startAt = new Date(session.startAt)
      const key = formatDateInput(startAt)
      if (map.has(key)) {
        map.get(key).sessions.push(session)
      }
    })

    return map
  }, [sessions, weekDays])

  const weekLabel = `${formatDayNumber(weekDays[0])} - ${formatDayNumber(weekDays[6])}`

  return (
    <section className="sessions-page">
      <header className="sessions-toolbar">
        <div className="sessions-toolbar-left">
          <label htmlFor="study-room" className="sessions-control-label">Study room</label>
          <select
            id="study-room"
            className="sessions-room-select"
            value={selectedRoom}
            onChange={(event) => setSelectedRoom(event.target.value)}
          >
            {rooms.map((room) => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>

        <div className="sessions-week-controls">
          <button type="button" onClick={() => setWeekStartDate((prev) => addDays(prev, -7))}>Previous</button>
          <button type="button" onClick={() => setWeekStartDate(startOfWeekMonday(new Date()))}>Today</button>
          <button type="button" onClick={() => setWeekStartDate((prev) => addDays(prev, 7))}>Next</button>
          <span>{weekLabel}</span>
        </div>
      </header>

      {loading && <p className="panel-message">Loading sessions...</p>}
      {!loading && error && <p className="panel-message panel-error">{error}</p>}

      {!loading && !error && (
        <section className="sessions-calendar-wrap">
          <div className="sessions-calendar-head">
            <div className="sessions-time-gutter">Time</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="sessions-day-head">
                <strong>{formatWeekday(day)}</strong>
                <span>{formatDayNumber(day)}</span>
              </div>
            ))}
          </div>

          <div className="sessions-calendar-body">
            <div className="sessions-time-column" style={{ height: `${MINUTES_IN_DAY_VIEW * PIXELS_PER_MINUTE}px` }}>
              {hourTicks.map((hour) => (
                <span key={hour} style={{ top: `${(hour - DAY_START_HOUR) * 60 * PIXELS_PER_MINUTE}px` }}>
                  {new Date(2024, 0, 1, hour, 0, 0).toLocaleTimeString('en-CA', { hour: 'numeric' })}
                </span>
              ))}
            </div>

            {weekDays.map((day) => {
              const dayKey = formatDateInput(day)
              const daySessions = sessionsByDay.get(dayKey)?.sessions || []
              return (
                <div
                  key={dayKey}
                  className="sessions-day-column"
                  style={{ height: `${MINUTES_IN_DAY_VIEW * PIXELS_PER_MINUTE}px` }}
                >
                  {daySessions.map((session) => {
                    const startAt = new Date(session.startAt)
                    const endAt = new Date(session.endAt)
                    const top = clamp(minutesFromDayStart(startAt), 0, MINUTES_IN_DAY_VIEW)
                    const rawHeight = Math.round((endAt.getTime() - startAt.getTime()) / (1000 * 60))
                    const height = clamp(rawHeight, 20, MINUTES_IN_DAY_VIEW - top)
                    const canEdit = canManageSession(session)

                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={session.id === selectedSessionId ? 'session-card active' : 'session-card'}
                        style={{ top: `${top * PIXELS_PER_MINUTE}px`, height: `${height * PIXELS_PER_MINUTE}px` }}
                        onClick={() => {
                          if (!canEdit) return
                          setSelectedSessionId(session.id)
                        }}
                        title={canEdit ? 'Edit or delete this session' : 'Only author/admin can edit'}
                      >
                        <strong>{session.title}</strong>
                        <span>{formatSessionTimeRange(session.startAt, session.endAt)}</span>
                        <small>{session.authorName}</small>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!loading && !error && sessions.length === 0 && (
        <p className="panel-message">No sessions scheduled for this room and week yet.</p>
      )}

      {selectedSession && canEditSelectedSession && (
        <form className="sessions-edit-panel" onSubmit={handleUpdateSession}>
          <h3>Edit session</h3>
          <div className="sessions-form-grid">
            <input
              type="text"
              value={editForm.title}
              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Session title"
              required
            />
            <select
              value={editForm.lengthMinutes}
              onChange={(event) => setEditForm((prev) => ({ ...prev, lengthMinutes: Number(event.target.value) }))}
            >
              {SESSION_LENGTH_CHOICES.map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
              ))}
            </select>
          </div>
          <div className="sessions-form-grid">
            <input
              type="date"
              value={editForm.date}
              onChange={(event) => setEditForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
            <input
              type="time"
              value={editForm.time}
              onChange={(event) => setEditForm((prev) => ({ ...prev, time: event.target.value }))}
              required
            />
          </div>
          {editError && <p className="panel-message panel-error">{editError}</p>}
          <div className="sessions-form-actions">
            <button type="button" className="ghost-button" onClick={() => setSelectedSessionId('')}>Cancel</button>
            <button
              type="button"
              className="resource-action-button"
              onClick={() => {
                if (window.confirm('Delete this study session?')) {
                  handleDeleteSession()
                }
              }}
              disabled={editLoading}
            >
              {editLoading ? 'Deleting...' : 'Delete'}
            </button>
            <button type="submit" className="reply-submit-button" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {Boolean(user) && (
        <form className="sessions-create-panel" onSubmit={handleCreateSession}>
          <h3>Book a new study session</h3>
          <div className="sessions-form-grid">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
            <input
              type="time"
              value={form.time}
              onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
              required
            />
          </div>
          <div className="sessions-form-grid">
            <select
              value={form.lengthMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, lengthMinutes: Number(event.target.value) }))}
            >
              {SESSION_LENGTH_CHOICES.map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
              ))}
            </select>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Session title"
              required
            />
          </div>
          {submitError && <p className="panel-message panel-error">{submitError}</p>}
          <div className="reply-submit-row">
            <button type="submit" className="reply-submit-button" disabled={submitLoading}>
              {submitLoading ? 'Booking...' : 'Book session'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
