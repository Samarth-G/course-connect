function Header({ user, onShowAuth, onLogout }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #eee' }}>
      <span style={{ fontSize: '20px' }}>📖</span>
      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <span>Courses</span>
        <span>Discussions/Resources</span>
        <span>Study Sessions</span>
        {!user && (
          <>
            <button type="button" onClick={() => onShowAuth?.('login')}>Sign in</button>
            <button type="button" onClick={() => onShowAuth?.('register')}>Register</button>
          </>
        )}
        {user && (
          <>
            <span>{user.name}</span>
            <button type="button" onClick={onLogout}>Logout</button>
          </>
        )}
      </nav>
    </header>
  )
}
export default Header