function Sidebar({
  title,
  items,
  searchTerm,
  onSearchTermChange,
  activeItemId,
  onSelectItem,
  subheading = 'Chats',
  searchInputId = 'thread-search',
}) {
  return (
    <aside className="thread-sidebar">
      <div className="sidebar-heading">= {title}</div>

      <label className="sidebar-search" htmlFor={searchInputId}>
        <input
          id={searchInputId}
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
        <span aria-hidden="true">Q</span>
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