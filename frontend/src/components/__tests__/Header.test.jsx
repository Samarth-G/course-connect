import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Header from '../Header'

jest.mock('../../contexts/socketContext', () => ({
  useSocket: () => ({ notifications: [], clearNotifications: jest.fn() }),
}))

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
})
