import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import CourseCard from './components/CourseCard'
import Sidebar from './components/Sidebar'
import ThreadForm from './components/ThreadForm'

const sampleCourses = [
  { code: 'COSC 222', title: 'Data Structures', description: 'Introduction to data structures.' },
  { code: 'BIOL 117', title: 'Evolutionary Biology', description: 'Evolutionary theory and genetics.' },
  { code: 'COMM 105', title: 'Business Fundamentals', description: 'Roles of business and its fundamentals.' },
]

const sidebarItems = ['Need help studying for MT1', 'DFS has me confused', 'How pseudo are we allowed to make pseudocode?']

function App() {
  const [searchCourse, setSearchCourse] = useState('COSC-222')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearchSubmit = async (event) => {
    event.preventDefault()

    const termToSearch = searchTerm.trim()
    setHasSearched(true)
    setSearchError('')
    setSearchLoading(true)
    setSearchResults([])

    try {
      const response = await fetch(
        `/api/courses/${encodeURIComponent(searchCourse)}/threads?q=${encodeURIComponent(termToSearch)}`,
      )
      const data = await response.json()

      if (!response.ok) {
        setSearchError(data.error || 'Search failed')
      } else {
        setSearchResults(Array.isArray(data.results) ? data.results : [])
      }
    } catch (error) {
      setSearchError(error.message)
    } finally {
      setSearchLoading(false)
      setSearchTerm('')
    }
  }

  return (
    <>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar
          title="Course Topics"
          items={sidebarItems}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
        />
        <main style={{ padding: '24px', flex: 1 }}>
          <h1>CourseConnect</h1>
          <p>The Heart of UBC Academic Collaboration</p>
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
              <ul style={{ paddingLeft: '20px' }}>
                {searchResults.map((result) => (
                  <li key={result.id} style={{ marginBottom: '10px' }}>
                    <strong>{result.title}</strong>
                    <div>{result.body}</div>
                    <small>{result.courseId} | {result.author}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
            {sampleCourses.map((c) => (
              <CourseCard key={c.code} code={c.code} title={c.title} description={c.description} />
            ))}
          </div>
          <hr style={{ margin: '40px 0' }} />
          <ThreadForm />
        </main>
      </div>
      <Footer />
    </>
  )
}
export default App