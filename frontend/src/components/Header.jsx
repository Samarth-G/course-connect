function Header({ user, activePage, onNavigate, onShowAuth, onLogout }) {
  const showAuthButtons = !user

  const avatarUrl = user?.profileImage
    ? `/uploads/${user.profileImage}`
    : null

  return (
    <header className="topbar">
      <button type="button" className="logo-mark" onClick={() => onNavigate('courses')} aria-label="CourseConnect Home">
        C
      </button>

      <nav className="main-nav" aria-label="Primary">
        <button
          type="button"
          className={activePage === 'courses' ? 'nav-chip active' : 'nav-chip'}
          onClick={() => onNavigate('courses')}
        >
          Courses
        </button>
        <button
          type="button"
          className={activePage === 'threads' ? 'nav-chip active' : 'nav-chip'}
          onClick={() => onNavigate('threads')}
        >
          Discussions
        </button>
        <button
          type="button"
          className={activePage === 'resources' ? 'nav-chip active' : 'nav-chip'}
          onClick={() => onNavigate('resources')}
        >
          Resources
        </button>
        <button
          type="button"
          className={activePage === 'sessions' ? 'nav-chip active' : 'nav-chip'}
          onClick={() => onNavigate('sessions')}
        >
          Study Sessions
        </button>
      </nav>

      <div className="topbar-right">
        {showAuthButtons && (
          <>
            <button type="button" className="auth-chip" onClick={() => onShowAuth?.('login')}>
              Sign in
            </button>
            <button type="button" className="auth-chip auth-chip-dark" onClick={() => onShowAuth?.('register')}>
              Register
            </button>
          </>
        )}

        {user && (
          <>
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="header-avatar-img" />
            ) : (
              <span className="avatar-shell">{(user.name || 'U').slice(0, 1).toUpperCase()}</span>
            )}
            <span className="user-name">{user.name}</span>
            <button type="button" className="auth-chip" onClick={onLogout}>
              Logout
            </button>
          </>
        )}

        {!showAuthButtons && !user && <span className="avatar-shell" aria-hidden="true">o</span>}
      </div>
    </header>
  )
}

export default Header