import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CoursesPage from '../CoursesPage'
import { useState } from 'react'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

jest.mock('../../components/CourseCard', () => function MockCourseCard(props) {
  return (
    <div data-testid="course-card">
      <div>{props.code}</div>
      <div>{props.title}</div>
      <button type="button" onClick={props.onOpenDiscussion}>Discussion</button>
      <button type="button" onClick={props.onOpenResources}>Resources</button>
    </div>
  )
})

jest.mock('../../components/CourseForm', () => function MockCourseForm() {
  return <div data-testid="course-form" />
})

jest.mock('../../components/ActivityChart', () => function MockActivityChart() {
  return <div data-testid="activity-chart" />
})

function CoursesHarness({ user, token, openAuth }) {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')

  return (
    <CoursesPage
      user={user}
      token={token}
      courses={courses}
      setCourses={setCourses}
      setSelectedCourse={setSelectedCourse}
      openAuth={openAuth}
    />
  )
}

describe('CoursesPage', () => {
  let originalFetch

  beforeEach(() => {
    mockNavigate.mockReset()
    originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 'COSC-222', label: 'COSC-222', title: 'Data Structures', description: 'Graph and trees' },
          { id: 'BIOL-117', label: 'BIOL-117', title: 'Biology', description: 'Cells and DNA' },
        ],
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('loads courses and filters them by search text', async () => {
    render(
      <CoursesHarness
        user={{ id: 'u1', role: 'user', name: 'User' }}
        token="token"
        openAuth={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/courses')
    })

    expect(await screen.findByText('Data Structures')).toBeInTheDocument()
    expect(screen.getByText('Biology')).toBeInTheDocument()
    expect(screen.getByTestId('activity-chart')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Find A Course (e.g. COSC 320)'), { target: { value: 'COSC' } })
    expect(screen.getByText('Data Structures')).toBeInTheDocument()
    expect(screen.queryByText('Biology')).not.toBeInTheDocument()
  })
})
