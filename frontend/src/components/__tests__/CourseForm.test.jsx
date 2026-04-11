import { fireEvent, render, screen } from '@testing-library/react'
import CourseForm from '../CourseForm'

describe('CourseForm', () => {
  test('shows sign in error', async () => {
    render(<CourseForm token="" onCreated={jest.fn()} />)

    fireEvent.submit(screen.getByRole('button', { name: 'Upload course' }))

    expect(await screen.findByText('Sign in to create a course')).toBeInTheDocument()
  })

  test('shows required fields error', async () => {
    render(<CourseForm token="demo-token" onCreated={jest.fn()} />)

    fireEvent.submit(screen.getByRole('button', { name: 'Upload course' }))

    expect(await screen.findByText('All fields are required')).toBeInTheDocument()
  })
})
