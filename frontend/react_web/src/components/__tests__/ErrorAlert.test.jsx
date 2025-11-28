import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorAlert from '../ErrorAlert'

describe('ErrorAlert', () => {
  it('에러 메시지가 표시되어야 함', () => {
    const errorMessage = '테스트 에러 메시지'
    render(<ErrorAlert message={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('onClose 콜백이 호출되어야 함', () => {
    const onClose = vi.fn()
    render(<ErrorAlert message="에러" onClose={onClose} />)

    // Close 버튼 클릭
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('메시지가 없으면 렌더링하지 않아야 함', () => {
    const { container } = render(<ErrorAlert message="" />)

    // Alert가 렌더링되지 않음
    expect(container.firstChild).toBeNull()
  })

  it('심각도가 error여야 함', () => {
    render(<ErrorAlert message="에러" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('MuiAlert-standardError')
  })
})
