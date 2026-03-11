import Header from './components/Header'
import Footer from './components/Footer'
import CourseCard from './components/CourseCard'
import Sidebar from './components/Sidebar'

const sampleCourses = [
  { code: 'COSC 222', title: 'Data Structures', description: 'Introduction to data structures.' },
  { code: 'BIOL 117', title: 'Evolutionary Biology', description: 'Evolutionary theory and genetics.' },
  { code: 'COMM 105', title: 'Business Fundamentals', description: 'Roles of business and its fundamentals.' },
]

const sidebarItems = ['Need help studying for MT1', 'DFS has me confused', 'How pseudo are we allowed to make pseudocode?']

function App() {
  return (
    <>
      <Header />
      <div style={{ display: 'flex' }}>
        <Sidebar title="COSC 222 Topics" items={sidebarItems} />
        <main style={{ padding: '24px', flex: 1 }}>
          <h1>CourseConnect</h1>
          <p>The Heart of UBC Academic Collaboration</p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
            {sampleCourses.map((c) => (
              <CourseCard key={c.code} code={c.code} title={c.title} description={c.description} />
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
export default App