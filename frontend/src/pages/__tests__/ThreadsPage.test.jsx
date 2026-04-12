import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThreadsPage from '../ThreadsPage'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

jest.mock('../../components/Sidebar', () => function MockSidebar() {
  return <div data-testid="sidebar" />
})

jest.mock('../../components/ThreadForm', () => function MockThreadForm() {
  return <div data-testid="thread-form" />
})

jest.mock('../../components/HotThreads', () => function MockHotThreads() {
  return <div data-testid="hot-threads" />
})

describe('ThreadsPage - collapsible content', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch

    const longBody = 'A'.repeat(320)
    const longReply = 'B'.repeat(340)

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 'thread-1',
            title: 'Long thread',
            body: longBody,
            authorName: 'Author',
            authorId: 'user-1',
            courseId: 'COSC-222',
            tags: ['qa'],
            createdAt: '2026-04-10T00:00:00.000Z',
            replies: [
              { id: 'r1', body: longReply, authorName: 'R1', authorId: 'u1', createdAt: '2026-04-10T00:00:00.000Z' },
              { id: 'r2', body: 'reply-2', authorName: 'R2', authorId: 'u2', createdAt: '2026-04-10T00:00:00.000Z' },
              { id: 'r3', body: 'reply-3', authorName: 'R3', authorId: 'u3', createdAt: '2026-04-10T00:00:00.000Z' },
              { id: 'r4', body: 'reply-4', authorName: 'R4', authorId: 'u4', createdAt: '2026-04-10T00:00:00.000Z' },
            ],
          },
        ],
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('truncates long bodies and supports see more + show all replies', async () => {
    render(
      <ThreadsPage
        user={{ id: 'user-1', role: 'user', name: 'User' }}
        token="token"
        courses={[{ id: 'COSC-222', label: 'COSC-222' }]}
        selectedCourse="COSC-222"
        setSelectedCourse={jest.fn()}
        openAuth={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(await screen.findByRole('button', { name: 'Show all 4 replies' })).toBeInTheDocument()
    expect(screen.queryByText('R4')).not.toBeInTheDocument()

    const seeMoreButtons = screen.getAllByRole('button', { name: 'See more' })
    fireEvent.click(seeMoreButtons[0])
    expect(await screen.findByRole('button', { name: 'See less' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show all 4 replies' }))
    expect(await screen.findByText('R4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show less replies' })).toBeInTheDocument()
  })
})
