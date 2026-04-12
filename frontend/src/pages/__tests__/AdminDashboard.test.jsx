import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from '../AdminDashboard'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ socket: null }),
}))

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}), { virtual: true })

describe('AdminDashboard - usage reports', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch

    global.fetch = jest.fn((url) => {
      if (url.startsWith('/api/courses')) {
        return Promise.resolve({ ok: true, json: async () => ({ results: [{ id: 'COSC-222', label: 'COSC-222' }] }) })
      }
      if (url.startsWith('/api/admin/users')) {
        return Promise.resolve({ ok: true, json: async () => ({ results: [{ id: 'u1', name: 'User', email: 'u@example.com', role: 'user', enabled: true }] }) })
      }
      if (url.startsWith('/api/courses/COSC-222/threads')) {
        return Promise.resolve({ ok: true, json: async () => ({ results: [] }) })
      }
      if (url.startsWith('/api/analytics/summary')) {
        return Promise.resolve({ ok: true, json: async () => ({ users: 5, threads: 9, replies: 11, resources: 3, sessions: 2 }) })
      }
      if (url.startsWith('/api/analytics/activity')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            threads: [{ _id: '2026-04-01', count: 2 }],
            replies: [{ _id: '2026-04-01', count: 3 }],
            resources: [{ _id: '2026-04-01', count: 1 }],
            users: [{ _id: '2026-04-01', count: 1 }],
            sessions: [{ _id: '2026-04-01', count: 1 }],
          }),
        })
      }

      return Promise.resolve({ ok: true, json: async () => ({ results: [] }) })
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('renders summary cards and refetches reports when date filter changes', async () => {
    render(<AdminDashboard user={{ id: 'admin-1', role: 'admin' }} token="token-1" />)

    expect(screen.getByText('Usage Reports')).toBeInTheDocument()

    expect(await screen.findByText('New Users')).toBeInTheDocument()
    expect(screen.getByText('Threads')).toBeInTheDocument()
    expect(screen.getByText('Replies')).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBeGreaterThanOrEqual(2)

    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/summary?startDate=2026-01-01'),
        expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } })
      )
    })
  })
})
