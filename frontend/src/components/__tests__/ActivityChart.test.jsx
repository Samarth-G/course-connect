import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ActivityChart from '../ActivityChart'

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}), { virtual: true })

describe('ActivityChart', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        threads: [{ _id: '2026-04-01', count: 2 }],
        replies: [{ _id: '2026-04-01', count: 3 }],
        resources: [{ _id: '2026-04-01', count: 1 }],
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test('fetches activity data and refetches when date filter changes', async () => {
    render(<ActivityChart token="tok-1" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/activity?startDate='),
        expect.objectContaining({ headers: { Authorization: 'Bearer tok-1' } })
      )
    })

    expect(await screen.findByTestId('line-chart')).toBeInTheDocument()

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/activity?startDate=2026-01-01'),
        expect.objectContaining({ headers: { Authorization: 'Bearer tok-1' } })
      )
    })
  })
})
