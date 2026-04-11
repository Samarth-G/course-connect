import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ThreadForm from '../ThreadForm'

describe('ThreadForm', () => {
  test('shows sign in error', async () => {
    render(<ThreadForm token="" defaultCourse="COSC-320" courseOptions={[]} onCreated={jest.fn()} />)

    fireEvent.submit(screen.getByRole('button', { name: 'Submit thread' }))

    expect(await screen.findByText('Sign in to create a thread')).toBeInTheDocument()
  })

  test('sends tags as a list', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ thread: { id: 'thread-1' } }),
    })

    const onCreated = jest.fn()

    render(
      <ThreadForm
        token="demo-token"
        defaultCourse="COSC-320"
        courseOptions={[{ id: 'COSC-320', label: 'COSC 320' }]}
        onCreated={onCreated}
      />
    )

    fireEvent.change(screen.getByLabelText('Thread title'), { target: { value: 'Study help' } })
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Need help for the exam' } })
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'exam, study group, exam' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit thread' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/courses/COSC-320/threads',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Study help',
            body: 'Need help for the exam',
            tags: ['exam', 'study group', 'exam'],
          }),
        })
      )
    })

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: 'thread-1' })
    })
  })
})
