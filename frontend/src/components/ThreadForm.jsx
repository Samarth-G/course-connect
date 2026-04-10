import { useEffect, useState } from 'react'

export default function ThreadForm({ token, defaultCourse = '', courseOptions = [], onCreated }) {
  const [formData, setFormData] = useState({
    course: defaultCourse,
    threadname: '',
    body: '',
    tags: '',
  })
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      course: defaultCourse,
    }))
  }, [defaultCourse])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResponse(null)

    if (!token) {
      setError('Sign in to create a thread')
      setLoading(false)
      return
    }

    try {
      const course = formData.course.trim()
      const threadname = formData.threadname.trim()
      const body = formData.body.trim()

      if (!course || !threadname || !body) {
        setError('All fields are required')
        return
      }

      const res = await fetch(`/api/courses/${encodeURIComponent(course)}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: threadname,
          body,
          tags: formData.tags
            ? formData.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create thread')
        return
      }

      setResponse(data)
      setFormData({
        course: defaultCourse,
        threadname: '',
        body: '',
        tags: '',
      })

      if (typeof onCreated === 'function') {
        await onCreated(data.thread)
      }
    } catch (err) {
      setError(err.message || 'Unexpected network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' }}>Compose</p>
          <h2 style={{ margin: '6px 0 0' }}>Create a new thread</h2>
        </div>
        <small style={{ color: '#6b7280' }}>
          Posting to: {courseOptions.find((c) => c.id === formData.course)?.label || formData.course || 'Select a course'}
        </small>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
        <div>
          <label htmlFor="course">Course</label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            required
            style={{ width: '100%', marginTop: '6px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
          >
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label || course.title || course.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="threadname">Thread title</label>
          <input
            type="text"
            id="threadname"
            name="threadname"
            value={formData.threadname}
            onChange={handleInputChange}
            placeholder="Enter thread title"
            required
            style={{ width: '100%', marginTop: '6px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div>
          <label htmlFor="body">Body</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleInputChange}
            placeholder="Enter your question or discussion"
            required
            rows="7"
            style={{ width: '100%', marginTop: '6px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'vertical' }}
          />
        </div>

        <div>
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="exam, study group, assignment"
            style={{ width: '100%', marginTop: '6px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit thread'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '12px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '12px' }}>
          <strong>Success!</strong>
          <p style={{ marginBottom: 0 }}>Thread created successfully.</p>
        </div>
      )}
    </section>
  )
}