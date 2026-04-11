import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

describe('Footer', () => {
  test('renders social section and static footer links', () => {
    render(<Footer />)

    expect(screen.getByLabelText('Social')).toBeInTheDocument()
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText('IG')).toBeInTheDocument()
    expect(screen.getByText('YT')).toBeInTheDocument()
    expect(screen.getByText('in')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })
})
