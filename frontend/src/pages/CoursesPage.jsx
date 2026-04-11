import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import CourseCard from '../components/CourseCard'
import CourseForm from '../components/CourseForm'

export default function CoursesPage({ user, token, courses, setCourses, selectedCourse, setSelectedCourse, openAuth }) {
  const navigate = useNavigate()
  const [courseSearch, setCourseSearch] = useState('')
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState('')
  const [showNewCourseForm, setShowNewCourseForm] = useState(false)

  useEffect(() => {
    loadCourses('')
  }, [])

  async function loadCourses(query = '') {
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
  }

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
    await loadCourses('')
    if (course?.id) setSelectedCourse(course.id)
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
        </div>

        {showNewCourseForm && <CourseForm token={token} onCreated={handleCourseCreated} />}

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
                navigate('/discussions')
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
