import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ResourcesPage from '../ResourcesPage'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

jest.mock('../../components/Sidebar', () => function MockSidebar() {
  return <div data-testid="sidebar" />
})

describe('ResourcesPage', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        results: [
          {
            id: 'res-1',
            title: 'Very long resource summary',
            type: 'Notes',
            summary: 'S'.repeat(240),
            uploader: 'Course Staff',
            courseId: 'COSC-222',
            filePath: 'file.pdf',
            fileName: 'file.pdf',
            mimeType: 'application/pdf',
            createdAt: '2026-04-11T00:00:00.000Z',
          },
        ],
      }),
      json: async () => ({
        results: [
          {
            id: 'res-1',
            title: 'Very long resource summary',
            type: 'Notes',
            summary: 'S'.repeat(240),
            uploader: 'Course Staff',
            courseId: 'COSC-222',
            filePath: 'file.pdf',
            fileName: 'file.pdf',
            mimeType: 'application/pdf',
            createdAt: '2026-04-11T00:00:00.000Z',
          },
        ],
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('truncates long resource summaries and expands them', async () => {
    render(
      <ResourcesPage
        user={{ id: 'u1', role: 'user', name: 'User' }}
        token="token"
        courses={[{ id: 'COSC-222', label: 'COSC-222' }]}
        selectedCourse="COSC-222"
        setSelectedCourse={jest.fn()}
        openAuth={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/courses/COSC-222/resources?limit=100&page=1')
    })

    expect(await screen.findByText(/S{50}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'See more' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'See more' }))
    expect(await screen.findByRole('button', { name: 'See less' })).toBeInTheDocument()
  })
})
