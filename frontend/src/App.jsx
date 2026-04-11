import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import CoursesPage from './pages/CoursesPage'
import ThreadsPage from './pages/ThreadsPage'
import ResourcesPage from './pages/ResourcesPage'
import SessionsPage from './pages/SessionsPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import { SocketProvider } from './contexts/SocketContext'
import './App.css'

const TOKEN_STORAGE_KEY = 'courseconnect_auth_token'

function AppInner() {
  const navigate = useNavigate()

  const [authMode, setAuthMode] = useState('login')
  const [showAuthPanel, setShowAuthPanel] = useState(false)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', profileImage: null })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(token))

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')

  // Restore session
  useEffect(() => {
    async function restoreSession() {
      if (!token) { setSessionLoading(false); return }
      try {
        const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (!response.ok) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken('')
          setUser(null)
          return
        }
        setUser(data.user || null)
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken('')
        setUser(null)
      } finally {
        setSessionLoading(false)
      }
    }
    restoreSession()
  }, [token])

  const handleAuthInputChange = (event) => {
    const { name, value, files } = event.target
    if (name === 'profileImage') {
      setAuthForm((prev) => ({ ...prev, profileImage: files[0] || null }))
    } else {
      setAuthForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match')
      setAuthLoading(false)
      return
    }

    try {
      let response
      if (authMode === 'register') {
        const formData = new FormData()
        formData.append('name', authForm.name.trim())
        formData.append('email', authForm.email.trim())
        formData.append('password', authForm.password)
        if (authForm.profileImage) formData.append('profileImage', authForm.profileImage)
        response = await fetch('/api/auth/register', { method: 'POST', body: formData })
      } else {
        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authForm.email.trim(), password: authForm.password }),
        })
      }

      const data = await response.json()
      if (!response.ok) { setAuthError(data.error || 'Authentication failed'); return }

      if (data.token) localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      setToken(data.token || '')
      setUser(data.user || null)
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '', profileImage: null })
      setShowAuthPanel(false)
    } catch (error) {
      setAuthError(error.message || 'Unexpected network error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
    navigate('/', { replace: true })
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setShowAuthPanel(true)
  }

  if (sessionLoading) {
    return <div className="loading-screen">Loading session...</div>
  }

  return (
    <SocketProvider token={token}>
      <div className="app-shell">
        <Header user={user} onShowAuth={openAuth} onLogout={handleLogout} />

        <main className="page-shell">
          <Routes>
            <Route
              path="/"
              element={
                <CoursesPage
                  user={user}
                  token={token}
                  courses={courses}
                  setCourses={setCourses}
                  selectedCourse={selectedCourse}
                  setSelectedCourse={setSelectedCourse}
                  openAuth={openAuth}
                />
              }
            />
            <Route
              path="/discussions"
              element={
                <ThreadsPage
                  user={user}
                  token={token}
                  courses={courses}
                  selectedCourse={selectedCourse}
                  setSelectedCourse={setSelectedCourse}
                  openAuth={openAuth}
                />
              }
            />
            <Route
              path="/resources"
              element={
                <ResourcesPage
                  user={user}
                  token={token}
                  courses={courses}
                  selectedCourse={selectedCourse}
                  setSelectedCourse={setSelectedCourse}
                  openAuth={openAuth}
                />
              }
            />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route
              path="/profile"
              element={
                user ? <ProfilePage user={user} token={token} setUser={setUser} /> : <Navigate to="/" replace />
              }
            />
            <Route
              path="/admin"
              element={
                user?.role === 'admin'
                  ? <AdminDashboard user={user} token={token} />
                  : <Navigate to="/" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />

        {showAuthPanel && !user && (
          <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Authentication">
            <div className="auth-panel">
              <h3>{authMode === 'login' ? 'Sign in' : 'Register'}</h3>
              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <input type="text" name="name" placeholder="Name" value={authForm.name} onChange={handleAuthInputChange} required />
                )}
                <input type="email" name="email" placeholder="Email" value={authForm.email} onChange={handleAuthInputChange} required />
                <input type="password" name="password" placeholder="Password" value={authForm.password} onChange={handleAuthInputChange} required />
                {authMode === 'register' && (
                  <>
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" value={authForm.confirmPassword} onChange={handleAuthInputChange} required />
                    <label className="file-upload-label" htmlFor="profile-image-upload">
                      Profile Image (optional)
                      <input id="profile-image-upload" type="file" name="profileImage" accept="image/png,image/jpeg,image/jpg,image/gif" onChange={handleAuthInputChange} />
                    </label>
                  </>
                )}
                {authError && <p className="panel-error">{authError}</p>}
                <div className="auth-actions">
                  <button type="submit" disabled={authLoading}>
                    {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Register'}
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}>
                    {authMode === 'login' ? 'Need an account?' : 'Already registered?'}
                  </button>
                </div>
              </form>
              <button type="button" className="close-auth" onClick={() => setShowAuthPanel(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </SocketProvider>
  )
}

export default function App() {
  return <AppInner />
}
