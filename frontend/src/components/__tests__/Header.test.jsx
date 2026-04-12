import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Header from '../Header'

jest.mock('../NotificationBell', () => function MockNotificationBell() {
  return <div data-testid="notification-bell" />
})

describe('Header', () => {
  test('shows sign in buttons', () => {
    render(
      <MemoryRouter>
        <Header user={null} onShowAuth={jest.fn()} onLogout={jest.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  test('shows admin link for admins', () => {
    render(
      <MemoryRouter>
        <Header
          user={{ name: 'Admin', role: 'admin' }}
          onShowAuth={jest.fn()}
          onLogout={jest.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  test('shows notification bell for logged in users', () => {
    render(
      <MemoryRouter>
        <Header user={{ name: 'User', role: 'user' }} onShowAuth={jest.fn()} onLogout={jest.fn()} />
      </MemoryRouter>
    )

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
  })
})
