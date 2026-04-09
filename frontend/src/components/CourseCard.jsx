function CourseCard({ code, title, description, onOpenDiscussion, onOpenResources }) {
  return (
    <article className="course-card">
      <div className="course-image-placeholder" aria-hidden="true">
        [ ]
      </div>

      <h3>{code}</h3>
      <p className="course-title">{title}</p>
      <p className="course-description">{description}</p>

      <div className="course-actions">
        <button type="button" onClick={onOpenDiscussion}>Discussion</button>
        <button type="button" onClick={onOpenResources}>Resources</button>
      </div>
    </article>
  )
}

export default CourseCard