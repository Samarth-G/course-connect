function Sidebar({
  title,
  items,
  searchTerm,
  onSearchTermChange,
  activeItemId,
  onSelectItem,
  subheading = 'Chats',
  searchInputId = 'thread-search',
  courses = [],
  selectedCourse = '',
  onSelectCourse,
}) {
  return (
    <aside className="thread-sidebar">
      <div className="sidebar-heading">= {title}</div>

      {courses.length > 0 && onSelectCourse && (
        <div className="sidebar-course-switcher">
          <label htmlFor="sidebar-course-select" className="sidebar-subheading">Course</label>
          <select
            id="sidebar-course-select"
            className="sidebar-course-select"
            value={selectedCourse}
            onChange={(e) => onSelectCourse(e.target.value)}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label || course.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="sidebar-search" htmlFor={searchInputId}>
        <input
          id={searchInputId}
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </label>

      <div className="sidebar-subheading">{subheading}</div>

      <ul className="sidebar-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={item.id === activeItemId ? 'sidebar-item active' : 'sidebar-item'}
              onClick={() => onSelectItem(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar