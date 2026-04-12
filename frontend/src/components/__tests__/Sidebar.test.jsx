import { fireEvent, render, screen } from '@testing-library/react'
import Sidebar from '../Sidebar'

describe('Sidebar', () => {
  test('renders items and highlights active item', () => {
    const onSelectItem = jest.fn()

    render(
      <Sidebar
        title="Course Topics"
        items={[{ id: 't1', label: 'Thread 1' }, { id: 't2', label: 'Thread 2' }]}
        searchTerm=""
        onSearchTermChange={jest.fn()}
        activeItemId="t2"
        onSelectItem={onSelectItem}
      />
    )

    const activeButton = screen.getByRole('button', { name: 'Thread 2' })
    expect(activeButton).toHaveClass('active')

    fireEvent.click(screen.getByRole('button', { name: 'Thread 1' }))
    expect(onSelectItem).toHaveBeenCalledWith('t1')
  })

  test('shows course switcher when courses are provided', () => {
    const onSelectCourse = jest.fn()

    render(
      <Sidebar
        title="Topics"
        items={[]}
        searchTerm=""
        onSearchTermChange={jest.fn()}
        activeItemId=""
        onSelectItem={jest.fn()}
        courses={[{ id: 'COSC-222', label: 'COSC-222' }, { id: 'BIOL-117', label: 'BIOL-117' }]}
        selectedCourse="COSC-222"
        onSelectCourse={onSelectCourse}
      />
    )

    const select = screen.getByLabelText('Course')
    fireEvent.change(select, { target: { value: 'BIOL-117' } })

    expect(onSelectCourse).toHaveBeenCalledWith('BIOL-117')
  })
})
