import { fireEvent, render, screen } from '@testing-library/react'
import CourseCard from '../CourseCard'

describe('CourseCard', () => {
  test('renders base course info and primary actions', () => {
    render(
      <CourseCard
        code="COSC-320"
        title="Intermediate Algorithm Design"
        description="Core design strategies"
        onOpenDiscussion={() => {}}
        onOpenResources={() => {}}
      />
    )

    expect(screen.getByRole('heading', { name: 'COSC-320' })).toBeInTheDocument()
    expect(screen.getByText('Intermediate Algorithm Design')).toBeInTheDocument()
    expect(screen.getByText('Core design strategies')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resources' })).toBeInTheDocument()
  })

  test('shows admin actions only when canManage is true', () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    const { rerender } = render(
      <CourseCard
        code="COSC-320"
        title="Intermediate Algorithm Design"
        onOpenDiscussion={() => {}}
        onOpenResources={() => {}}
        canManage={false}
      />
    )

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()

    rerender(
      <CourseCard
        code="COSC-320"
        title="Intermediate Algorithm Design"
        onOpenDiscussion={() => {}}
        onOpenResources={() => {}}
        canManage
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
