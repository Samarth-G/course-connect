import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import CourseCard from '../components/CourseCard'
import CourseForm from '../components/CourseForm'
import { useSocket } from '../contexts/socketContext'

export default function CoursesPage({ user, token, courses, setCourses, setSelectedCourse, openAuth }) {
  const { socket } = useSocket() || {}

  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [courseSearch, setCourseSearch] = useState('')
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState('')
  const [showNewCourseForm, setShowNewCourseForm] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState('')
  const [courseEditForm, setCourseEditForm] = useState({ title: '', description: '' })
  const [originalCourseEdit, setOriginalCourseEdit] = useState({ title: '', description: '' })
  const [courseActionError, setCourseActionError] = useState('')
  const [courseActionLoading, setCourseActionLoading] = useState(false)

  const loadCourses = useCallback(async (query = '') => {
    const trimmedQuery = query.trim()
    const searchParams = new URLSearchParams()
    if (trimmedQuery) searchParams.set('q', trimmedQuery)

    setCoursesLoading(true)
    setCoursesError('')

    try {
      const response = await fetch(`/api/courses${searchParams.toString() ? `?${searchParams}` : ''}`)
      const data = await response.json()

      if (!response.ok) {
        setCourses([])
        setCoursesError(data.error || 'Failed to load courses')
        return
      }

      const nextCourses = Array.isArray(data.results) ? data.results : []
      setCourses(nextCourses)
      setSelectedCourse((prev) => {
        if (nextCourses.length === 0) return ''
        const exists = nextCourses.some((c) => c.id === prev)
        return exists ? prev : nextCourses[0].id
      })
    } catch (error) {
      setCourses([])
      setCoursesError(error.message || 'Unexpected network error')
    } finally {
      setCoursesLoading(false)
    }
  }, [setCourses, setSelectedCourse])

  useEffect(() => {
    loadCourses('')
  }, [loadCourses])

  useEffect(() => {
    if (!socket) return

    const handleCourseCreated = (course) => {
      if (!course?.id) return

      setCourses((prev) => {
        if (prev.some((existing) => existing.id === course.id)) return prev
        return [course, ...prev]
      })
    }

    const handleCourseUpdated = (course) => {
      if (!course?.id) return
      setCourses((prev) => prev.map((existing) => (existing.id === course.id ? course : existing)))
    }

    const handleCourseDeleted = ({ courseId }) => {
      if (!courseId) return
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
      setEditingCourseId((prev) => (prev === courseId ? '' : prev))
      setSelectedCourse((prev) => (prev === courseId ? '' : prev))
    }

    socket.on('course:created', handleCourseCreated)
    socket.on('course:updated', handleCourseUpdated)
    socket.on('course:deleted', handleCourseDeleted)

    return () => {
      socket.off('course:created', handleCourseCreated)
      socket.off('course:updated', handleCourseUpdated)
      socket.off('course:deleted', handleCourseDeleted)
    }
  }, [socket, setCourses, setSelectedCourse])

  const filteredCourses = useMemo(() => {
    const normalized = courseSearch.trim().toLowerCase()
    if (!normalized) return courses
    return courses.filter((course) =>
      String(course.label || '').toLowerCase().includes(normalized) ||
      String(course.title || '').toLowerCase().includes(normalized) ||
      String(course.description || '').toLowerCase().includes(normalized)
    )
  }, [courseSearch, courses])

  const handleCourseCreated = async (course) => {
    setShowNewCourseForm(false)
    setCourseSearch('')
    setCourseActionError('')
    await loadCourses('')
    if (course?.id) setSelectedCourse(course.id)
  }

  async function handleCourseDelete(courseId) {
    if (!token || !isAdmin) return
    setCourseActionLoading(true)
    setCourseActionError('')

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (!response.ok) {
        setCourseActionError(data.error || 'Failed to delete course')
        return
      }

      setEditingCourseId('')
      await loadCourses(courseSearch)
    } catch (error) {
      setCourseActionError(error.message || 'Unexpected network error')
    } finally {
      setCourseActionLoading(false)
    }
  }

  async function handleCourseEditSubmit(event) {
    event.preventDefault()
    if (!token || !isAdmin || !editingCourseId) return

    const payload = {}
    const trimmedTitle = courseEditForm.title.trim()
    const trimmedDescription = courseEditForm.description.trim()

    if (trimmedTitle && trimmedTitle !== originalCourseEdit.title) {
      payload.title = DOMPurify.sanitize(trimmedTitle)
    }
    if (trimmedDescription !== originalCourseEdit.description) {
      payload.description = DOMPurify.sanitize(trimmedDescription)
    }

    if (Object.keys(payload).length === 0) {
      setCourseActionError('No changes detected')
      return
    }

    setCourseActionLoading(true)
    setCourseActionError('')

    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(editingCourseId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setCourseActionError(data.error || 'Failed to update course')
        return
      }

      setEditingCourseId('')
      await loadCourses(courseSearch)
    } catch (error) {
      setCourseActionError(error.message || 'Unexpected network error')
    } finally {
      setCourseActionLoading(false)
    }
  }

  return (
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
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Find A Course (e.g. COSC 320)"
            />
          </label>
          {isAdmin && (
            <button
              type="button"
              className="new-thread-button courses-new-button"
              onClick={() => {
                if (!user || !token) { openAuth('login'); return }
                setShowNewCourseForm((prev) => !prev)
              }}
            >
              {showNewCourseForm ? '✕ Cancel' : '+ New Course'}
            </button>
          )}
        </div>

        {showNewCourseForm && <CourseForm token={token} onCreated={handleCourseCreated} />}

        {editingCourseId && isAdmin && (
          <form className="resource-form" onSubmit={handleCourseEditSubmit}>
            <div className="resource-form-header">
              <div>
                <p className="resource-form-eyebrow">Edit</p>
                <h3>Update course</h3>
              </div>
              <small>Course: {editingCourseId}</small>
            </div>
            <input
              type="text"
              value={courseEditForm.title}
              onChange={(event) => setCourseEditForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Course title"
            />
            <textarea
              value={courseEditForm.description}
              onChange={(event) => setCourseEditForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Course description"
              rows={4}
            />
            {courseActionError && <p className="panel-message panel-error">{courseActionError}</p>}
            <div className="reply-submit-row">
              <button type="button" className="ghost-button" onClick={() => setEditingCourseId('')}>Cancel</button>
              <button type="submit" className="reply-submit-button" disabled={courseActionLoading}>
                {courseActionLoading ? 'Saving...' : 'Save course'}
              </button>
            </div>
          </form>
        )}

        <div className="course-grid">
          {coursesLoading && <p className="panel-message">Loading courses...</p>}
          {coursesError && <p className="panel-message panel-error">{coursesError}</p>}
          {courseActionError && !editingCourseId && <p className="panel-message panel-error">{courseActionError}</p>}

          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              code={course.label || course.id}
              title={course.title || course.label || course.id}
              description={course.description}
              onOpenDiscussion={() => {
                setSelectedCourse(course.id)
                navigate('/discussions')
              }}
              onOpenResources={() => {
                setSelectedCourse(course.id)
                navigate('/resources')
              }}
              canManage={isAdmin}
              onEdit={() => {
                setEditingCourseId(course.id)
                setCourseEditForm({
                  title: course.title || '',
                  description: course.description || '',
                })
                setOriginalCourseEdit({
                  title: course.title || '',
                  description: course.description || '',
                })
                setCourseActionError('')
              }}
              onDelete={() => {
                if (window.confirm(`Delete course ${course.id}?`)) {
                  handleCourseDelete(course.id)
                }
              }}
            />
          ))}

          {!coursesLoading && !coursesError && filteredCourses.length === 0 && (
            <p className="panel-message">No courses found.</p>
          )}
        </div>
      </section>
    </section>
  )
}
