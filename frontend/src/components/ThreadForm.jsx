import { useState } from 'react'

export default function ThreadForm({ token }) {
  const [formData, setFormData] = useState({
    course: '',
    threadname: '',
    body: ''
  })
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const course = formData.course.trim()
      const threadname = formData.threadname.trim()
      const body = formData.body.trim()

      if (!course || !threadname || !body) {
        setError('All fields are required')
        setLoading(false)
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
          body: body,
          tags: []
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create thread')
      } else {
        setResponse(data)
        setFormData({
          course: '',
          threadname: '',
          body: ''
        })
      }
    } catch (err) {
      setError(err.message || 'Unexpected network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h2>Create a New Thread</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="course">Course:</label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value="">Select a course</option>
            <option value="COSC-222">COSC 222 - Data Structures</option>
            <option value="BIOL-117">BIOL 117 - Evolutionary Biology</option>
            <option value="COMM-105">COMM 105 - Business Fundamentals</option>
          </select>
        </div>

        <div>
          <label htmlFor="threadname">Thread Name:</label>
          <input
            type="text"
            id="threadname"
            name="threadname"
            value={formData.threadname}
            onChange={handleInputChange}
            placeholder="Enter thread title"
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label htmlFor="body">Body:</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleInputChange}
            placeholder="Enter your question or discussion"
            required
            rows="8"
            style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Thread'}
        </button>
      </form>

      {/* Display Error */}
      {error && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Display Success Response */}
      {response && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
          <strong>Success!</strong>
          <p>Thread created successfully!</p>
          <details style={{ marginTop: '8px' }}>
            <summary>View Response Details</summary>
            <pre style={{ marginTop: '8px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
