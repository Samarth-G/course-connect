import { useEffect, useState } from 'react'

export default function CourseForm({ token, onCreated }) {
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData({
      courseId: '',
      title: '',
      description: '',
    })
  }, [])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!token) {
      setError('Sign in to create a course')
      setLoading(false)
      return
    }

    try {
      const courseId = formData.courseId.trim()
      const title = formData.title.trim()
      const description = formData.description.trim()

      if (!courseId || !title) {
        setError('All fields are required')
        return
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          title,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create course')
        return
      }

      setFormData({
        courseId: '',
        title: '',
        description: '',
      })

      if (typeof onCreated === 'function') {
        await onCreated(data)
      }
    } catch (err) {
      setError(err.message || 'Unexpected network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="course-form-panel">
      <div className="resource-form-header">
        <div>
          <p className="resource-form-eyebrow">Upload</p>
          <h3>Add a new course</h3>
        </div>
        <small>Posting to: Courses</small>
      </div>

      <form className="course-form" onSubmit={handleSubmit}>
        <div className="resource-form-grid">
          <input
            type="text"
            name="courseId"
            value={formData.courseId}
            onChange={handleInputChange}
            placeholder="Course code, e.g. COSC-301"
            required
          />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Course title"
            required
          />
        </div>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Course description (optional)"
          rows={4}
        />

        {error && <p className="panel-message panel-error">{error}</p>}

        <div className="reply-submit-row">
          <button type="submit" className="reply-submit-button" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload course'}
          </button>
        </div>
      </form>
    </section>
  )
}