import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import Sidebar from '../components/Sidebar'

export default function ResourcesPage({ user, token, courses, selectedCourse, setSelectedCourse, openAuth }) {
  const [resourceSearch, setResourceSearch] = useState('')
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')
  const [activeResourceId, setActiveResourceId] = useState('')
  const [showNewResourceForm, setShowNewResourceForm] = useState(false)
  const [resourceForm, setResourceForm] = useState({ title: '', type: '', summary: '', resourceFile: null })
  const [resourceSubmitError, setResourceSubmitError] = useState('')
  const [resourceSubmitLoading, setResourceSubmitLoading] = useState(false)

  const activeCourse = courses.find((c) => c.id === selectedCourse) || courses[0] || null

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
    setActiveResourceId('')
    setResourceSearch('')
    setShowNewResourceForm(false)
    setResourceSubmitError('')
    setResourceForm({ title: '', type: '', summary: '', resourceFile: null })
  }, [selectedCourse])

  async function loadResources(courseId) {
    setResourcesLoading(true)
    setResourcesError('')
    const pageSize = 100
    let page = 1
    let allResources = []

    try {
      while (true) {
        const response = await fetch(`/api/courses/${encodeURIComponent(courseId)}/resources?limit=${pageSize}&page=${page}`)
        const data = await response.json()
        if (!response.ok) {
          setResources([])
          setResourcesError(data.error || 'Failed to load resources')
          return
        }
        const pageResults = Array.isArray(data.results) ? data.results : []
        allResources = allResources.concat(pageResults)
        if (pageResults.length < pageSize) break
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
      setResourceForm((prev) => ({ ...prev, resourceFile: files?.[0] || null }))
      return
    }
    setResourceForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleResourceSubmit = async (event) => {
    event.preventDefault()
    setResourceSubmitError('')

    if (!user || !token) { openAuth('login'); return }
    if (!selectedCourse) { setResourceSubmitError('Select a course first'); return }
    if (!resourceForm.title.trim() || !resourceForm.type.trim() || !resourceForm.summary.trim() || !resourceForm.resourceFile) {
      setResourceSubmitError('All resource fields and a file are required')
      return
    }

    setResourceSubmitLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', DOMPurify.sanitize(resourceForm.title.trim()))
      formData.append('type', DOMPurify.sanitize(resourceForm.type.trim()))
      formData.append('summary', DOMPurify.sanitize(resourceForm.summary.trim()))
      formData.append('resourceFile', resourceForm.resourceFile)

      const response = await fetch(`/api/courses/${encodeURIComponent(selectedCourse)}/resources`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setResourceSubmitError(data.error || 'Failed to create resource')
        return
      }

      setResourceForm({ title: '', type: '', summary: '', resourceFile: null })
      setShowNewResourceForm(false)
      await loadResources(selectedCourse)
      if (data.id) setActiveResourceId(data.id)
    } catch (error) {
      setResourceSubmitError(error.message || 'Unexpected network error')
    } finally {
      setResourceSubmitLoading(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return 'Recently'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const visibleResources = useMemo(() => {
    const normalized = resourceSearch.trim().toLowerCase()
    if (!normalized) return resources
    return resources.filter((r) =>
      String(r.title || '').toLowerCase().includes(normalized) ||
      String(r.summary || '').toLowerCase().includes(normalized) ||
      String(r.type || '').toLowerCase().includes(normalized)
    )
  }, [resourceSearch, resources])

  const resourceSidebarItems = useMemo(() => visibleResources.map((r) => ({ id: r.id, label: r.title })), [visibleResources])

  const activeResource = visibleResources.find((r) => r.id === activeResourceId) || visibleResources[0] || null
  const activeResourceFileName = activeResource?.fileName || (activeResource?.filePath ? activeResource.filePath.split('/').pop() : '')
  const activeResourceFileUrl = activeResource?.filePath ? `/uploads/${activeResource.filePath}` : ''

  return (
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
              if (!user || !token) { openAuth('login'); return }
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
              <input type="text" name="title" value={resourceForm.title} onChange={handleResourceInputChange} placeholder="Resource title" required />
              <input type="text" name="type" value={resourceForm.type} onChange={handleResourceInputChange} placeholder="Type, e.g. Slides" required />
            </div>
            <textarea name="summary" value={resourceForm.summary} onChange={handleResourceInputChange} placeholder="Short description" rows={5} required />
            <input type="file" name="resourceFile" onChange={handleResourceInputChange} required />
            {resourceSubmitError && <p className="panel-message panel-error">{resourceSubmitError}</p>}
            <div className="reply-submit-row">
              <button type="submit" className="reply-submit-button" disabled={resourceSubmitLoading}>
                {resourceSubmitLoading ? 'Uploading...' : 'Upload resource'}
              </button>
            </div>
          </form>
        )}

        {resourcesLoading && <p className="panel-message">Loading resources...</p>}
        {!resourcesLoading && resourcesError && <p className="panel-message">{resourcesError}</p>}
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
                    <p>{formatDate(activeResource.createdAt || activeResource.updatedAt)}</p>
                  </div>
                </div>
                <div className="thread-detail-course">{activeResource.type}</div>
              </div>
              <div className="resource-file-meta">
                <strong>{activeResourceFileName || 'No file attached'}</strong>
                <p>{activeResource.mimeType || 'Uploaded attachment'}</p>
              </div>
              <div className="resource-summary">
                <p>{DOMPurify.sanitize(activeResource.summary || '')}</p>
              </div>
              <div className="resource-actions">
                {activeResourceFileUrl ? (
                  <>
                    <a href={activeResourceFileUrl} target="_blank" rel="noreferrer" className="resource-action-button resource-action-link">Open Resource</a>
                    <a href={activeResourceFileUrl} download className="resource-action-button resource-action-link">Download</a>
                  </>
                ) : (
                  <button type="button" className="resource-action-button" disabled>No file attached</button>
                )}
              </div>
            </article>
          </>
        )}
      </section>
    </section>
  )
}
