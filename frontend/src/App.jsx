import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import CourseCard from './components/CourseCard'
import Sidebar from './components/Sidebar'
import ThreadForm from './components/ThreadForm'

const TOKEN_STORAGE_KEY = 'courseconnect_auth_token'

const sampleCourses = [
  { code: 'COSC 222', title: 'Data Structures', description: 'Introduction to data structures.' },
  { code: 'BIOL 117', title: 'Evolutionary Biology', description: 'Evolutionary theory and genetics.' },
  { code: 'COMM 105', title: 'Business Fundamentals', description: 'Roles of business and its fundamentals.' },
]

const sidebarItems = ['Need help studying for MT1', 'DFS has me confused', 'How pseudo are we allowed to make pseudocode?']

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(token))

  const [searchCourse, setSearchCourse] = useState('COSC-222')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchMeta, setSearchMeta] = useState({ total: 0, page: 1, limit: 20 })

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setSessionLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
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
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const payload = {
      email: authForm.email.trim(),
      password: authForm.password,
    }

    if (authMode === 'register') {
      payload.name = authForm.name.trim()
    }

    try {
      const response = await fetch(`/api/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        return
      }

      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      }
      setToken(data.token || '')
      setUser(data.user || null)
      setAuthForm({ name: '', email: '', password: '' })
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
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()

    const termToSearch = searchTerm.trim()
    setHasSearched(true)
    setSearchError('')
    setSearchLoading(true)
    setSearchResults([])
    setSearchMeta({ total: 0, page: 1, limit: 20 })

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(searchCourse)}/threads?q=${encodeURIComponent(termToSearch)}`,
      )
      const data = await response.json()

      if (!response.ok) {
        setSearchError(data.error || 'Search failed')
      } else {
        setSearchResults(Array.isArray(data.results) ? data.results : [])
        setSearchMeta({
          total: Number.isFinite(data.total) ? data.total : 0,
          page: Number.isFinite(data.page) ? data.page : 1,
          limit: Number.isFinite(data.limit) ? data.limit : 20,
        })
      }
    } catch (error) {
      setSearchError(error.message || 'Unexpected network error')
    } finally {
      setSearchLoading(false)
      setSearchTerm('')
    }
  }

  if (sessionLoading) {
    return (
      <>
        <Header user={null} onShowAuth={setAuthMode} />
        <main style={{ padding: '24px' }}>
          <h1>CourseConnect</h1>
          <p>Loading session...</p>
        </main>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Header user={null} onShowAuth={setAuthMode} />
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
          <h1>CourseConnect</h1>
          <p>The Heart of UBC Academic Collaboration</p>
          <section style={{ marginTop: '24px', marginBottom: '24px' }}>
            <h2>Main Landing Page</h2>
            <p>Browse course discussions, share resources, and prepare with your peers.</p>
          </section>

          <section style={{ maxWidth: '420px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
            <h3>{authMode === 'login' ? 'Sign in to your dashboard' : 'Create an account'}</h3>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'register' && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={handleAuthInputChange}
                  required
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authForm.email}
                onChange={handleAuthInputChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authForm.password}
                onChange={handleAuthInputChange}
                required
              />
              <button type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Sign in'
                    : 'Register'}
              </button>
            </form>

            {authError && (
              <p style={{ color: '#b00020', marginTop: '10px' }}>
                {authError}
              </p>
            )}

            <p style={{ marginTop: '12px' }}>
              {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <div style={{ display: 'flex' }}>
        <Sidebar
          title="Dashboard Topics"
          items={sidebarItems}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
        />
        <main style={{ padding: '24px', flex: 1 }}>
          <h1>Dashboard</h1>
          <p>Welcome back, {user.name}. Search discussions and post a new thread.</p>
          <section style={{ marginTop: '20px', marginBottom: '20px' }}>
            <h2>Search Threads</h2>
            <label htmlFor="search-course">Course:</label>
            <select
              id="search-course"
              value={searchCourse}
              onChange={(e) => setSearchCourse(e.target.value)}
              style={{ marginLeft: '8px', padding: '6px' }}
            >
              <option value="COSC-222">COSC 222</option>
              <option value="BIOL-117">BIOL 117</option>
              <option value="COMM-105">COMM 105</option>
            </select>
            <p style={{ marginTop: '12px', marginBottom: '8px' }}>
              Enter a term in the sidebar search box and press Enter.
            </p>

            {searchLoading && <p>Searching...</p>}
            {searchError && <p style={{ color: '#b00020' }}>Error: {searchError}</p>}

            {!searchLoading && !searchError && hasSearched && searchResults.length === 0 && (
              <p>No results found</p>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <>
                <p style={{ marginTop: '8px' }}>
                  Showing {searchResults.length} of {searchMeta.total} results.
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                  {searchResults.map((result) => (
                    <li key={result.id} style={{ marginBottom: '10px' }}>
                      <strong>{result.title}</strong>
                      <div>{result.body}</div>
                      <small>{result.courseId} | {result.authorId || 'unknown-user'}</small>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
            {sampleCourses.map((c) => (
              <CourseCard key={c.code} code={c.code} title={c.title} description={c.description} />
            ))}
          </div>
          <hr style={{ margin: '40px 0' }} />
          <ThreadForm token={token} />
        </main>
      </div>
      <Footer />
    </>
  )
}
export default App