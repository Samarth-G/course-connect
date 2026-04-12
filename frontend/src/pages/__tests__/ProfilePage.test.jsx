import { render, screen, waitFor } from '@testing-library/react'
import ProfilePage from '../ProfilePage'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

describe('ProfilePage - user comment history', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            type: 'thread',
            content: 'Created a study thread',
            threadId: 't1',
            courseId: 'COSC-222',
            createdAt: '2026-04-01T00:00:00.000Z',
          },
          {
            type: 'reply',
            threadId: 't2',
            threadTitle: 'Exam prep',
            body: 'R'.repeat(130),
            courseId: 'COSC-222',
            createdAt: '2026-04-02T00:00:00.000Z',
          },
        ],
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('loads and renders activity list items', async () => {
    render(
      <ProfilePage
        user={{ id: 'u1', name: 'QA User', email: 'qa@example.com', createdAt: '2026-01-01T00:00:00.000Z' }}
        token="token"
        setUser={jest.fn()}
      />
    )

    expect(screen.getByText('My Activity')).toBeInTheDocument()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/user/u1/history?page=1&limit=20',
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      )
    })

    expect(await screen.findByText('Created a study thread')).toBeInTheDocument()
    expect(screen.getByText('Exam prep')).toBeInTheDocument()
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument()
  })
})
