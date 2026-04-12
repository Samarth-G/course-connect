import { render, screen, waitFor } from '@testing-library/react'
import HotThreads from '../HotThreads'

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}), { virtual: true })

describe('HotThreads', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('renders top trending threads from last 7 days', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { _id: '1', title: 'Thread one', courseId: 'COSC-222', authorName: 'Sam', recentReplyCount: 5 },
          { _id: '2', title: 'Thread two', courseId: 'BIOL-117', authorName: 'Lee', recentReplyCount: 4 },
          { _id: '3', title: 'Thread three', courseId: 'COMM-105', authorName: 'Ari', recentReplyCount: 3 },
        ],
      }),
    })

    render(<HotThreads />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/hot-threads?limit=3&days=7')
    })

    expect(await screen.findByText('🔥 Trending Threads (Last 7 Days)')).toBeInTheDocument()
    expect(screen.getByText('Thread one')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
