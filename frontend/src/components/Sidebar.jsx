function Sidebar({ title, items, searchTerm, onSearchTermChange, onSearchSubmit }) {
  return (
    <div style={{ width: '160px', borderRight: '1px solid #eee', padding: '12px', minHeight: '100vh' }}>
      <strong>☰ {title}</strong>
      <form onSubmit={onSearchSubmit}>
        <input
          type="search"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          style={{ width: '100%', margin: '10px 0', padding: '4px' }}
        />
      </form>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ padding: '6px 0', cursor: 'pointer' }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
export default Sidebar