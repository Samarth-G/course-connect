import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SessionsPage from '../SessionsPage'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

describe('SessionsPage', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn((url, options) => {
      if (typeof url === 'string' && url.startsWith('/api/sessions?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            room: 'Room 117',
            rooms: ['Room 117', 'Room 204'],
            results: [
              {
                id: 's1',
                room: 'Room 117',
                title: 'Midterm review',
                authorId: 'u1',
                authorName: 'User',
                startAt: '2026-04-11T16:00:00.000Z',
                endAt: '2026-04-11T17:00:00.000Z',
              },
            ],
          }),
        })
      }
      if (typeof url === 'string' && url === '/api/sessions' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ session: { id: 's2' } }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('shows sessions and creates a new session', async () => {
    render(
      <SessionsPage
        user={{ id: 'u1', role: 'user', name: 'User' }}
        token="token"
        openAuth={jest.fn()}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/sessions?room=Room+117&weekStart='))
    })

    expect(await screen.findByText('Midterm review')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Session title'), { target: { value: 'New study session' } })
    fireEvent.click(screen.getByRole('button', { name: 'Book session' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sessions',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
