function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      <span style={{ fontSize: '20px' }}>📖</span>
      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <a href="/courses">Courses</a>
        <a href="/discussions">Discussions/Resources</a>
        <a href="/sessions">Study Sessions</a>
        <button>Sign in</button>
        <button>Register</button>
      </nav>
    </header>
  )
}
export default Header