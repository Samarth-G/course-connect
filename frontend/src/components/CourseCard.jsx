function CourseCard({ code, title, description, onOpenDiscussion, onOpenResources, onEdit, onDelete, canManage }) {
  return (
    <article className="course-card">
      <div className="course-image-placeholder" aria-hidden="true">
        [ ]
      </div>

      <h3>{code}</h3>
      <p className="course-title">{title}</p>
      {description ? <p className="course-description">{description}</p> : null}

      <div className="course-actions">
        <button type="button" onClick={onOpenDiscussion}>Discussion</button>
        <button type="button" onClick={onOpenResources || onOpenDiscussion}>Resources</button>
        {canManage && (
          <>
            <button type="button" onClick={onEdit}>Edit</button>
            <button type="button" onClick={onDelete}>Delete</button>
          </>
        )}
      </div>
    </article>
  )
}

export default CourseCard