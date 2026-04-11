import { NavLink, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'

function Header({ user, onShowAuth, onLogout }) {
  const navigate = useNavigate()
  const { notifications, clearNotifications } = useSocket() || {}
  const showAuthButtons = !user

  const avatarUrl = user?.profileImage
    ? `/uploads/${user.profileImage}`
    : null

  return (
    <header className="topbar">
      <NavLink to="/" className="logo-mark" aria-label="CourseConnect Home">
        C
      </NavLink>

      <nav className="main-nav" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-chip active' : 'nav-chip'}>
          Courses
        </NavLink>
        <NavLink to="/discussions" className={({ isActive }) => isActive ? 'nav-chip active' : 'nav-chip'}>
          Discussions
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => isActive ? 'nav-chip active' : 'nav-chip'}>
          Resources
        </NavLink>
        <NavLink to="/sessions" className={({ isActive }) => isActive ? 'nav-chip active' : 'nav-chip'}>
          Study Sessions
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-chip active nav-chip-admin' : 'nav-chip nav-chip-admin'}>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="topbar-right">
        {notifications && notifications.length > 0 && (
          <button type="button" className="notification-badge" onClick={clearNotifications} title="Clear notifications">
            {notifications.length}
          </button>
        )}

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
            <button type="button" className="header-profile-btn" onClick={() => navigate('/profile')} title="View profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="header-avatar-img" />
              ) : (
                <span className="avatar-shell">{(user.name || 'U').slice(0, 1).toUpperCase()}</span>
              )}
            </button>
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