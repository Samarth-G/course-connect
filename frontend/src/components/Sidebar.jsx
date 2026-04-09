function Sidebar({ title, items, searchTerm, onSearchTermChange, activeItemId, onSelectItem }) {
  return (
    <aside className="thread-sidebar">
      <div className="sidebar-heading">= {title}</div>

      <label className="sidebar-search" htmlFor="thread-search">
        <input
          id="thread-search"
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
        <span>Q</span>
      </label>

      <div className="sidebar-subheading">Chats</div>

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