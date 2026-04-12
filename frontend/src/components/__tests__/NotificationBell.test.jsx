import { fireEvent, render, screen } from '@testing-library/react'
import NotificationBell from '../NotificationBell'

const mockUseNotifications = jest.fn()

jest.mock('../../contexts/NotificationContext.jsx', () => ({
  useNotifications: () => mockUseNotifications(),
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAllRead: jest.fn(),
    })
  })

  test('shows unread count and displays alerts for replies/new threads', () => {
    const markAllRead = jest.fn()

    mockUseNotifications.mockReturnValue({
      unreadCount: 2,
      markAllRead,
      notifications: [
        { id: 'n1', message: 'New thread by another user', read: false, time: new Date().toISOString() },
        { id: 'n2', message: 'Someone replied to your thread', read: false, time: new Date().toISOString() },
      ],
    })

    render(<NotificationBell />)

    expect(screen.getByLabelText('Notifications (2 unread)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Notifications (2 unread)' }))

    expect(screen.getByText('New thread by another user')).toBeInTheDocument()
    expect(screen.getByText('Someone replied to your thread')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }))
    expect(markAllRead).toHaveBeenCalledTimes(1)
  })
})
