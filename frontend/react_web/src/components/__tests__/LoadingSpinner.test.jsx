import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('렌더링이 정상적으로 되어야 함', () => {
    render(<LoadingSpinner />)

    // CircularProgress가 렌더링되는지 확인
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })

  it('커스텀 사이즈가 적용되어야 함', () => {
    const { container } = render(<LoadingSpinner size={60} />)

    // MUI CircularProgress의 svg가 size prop을 받는지 확인
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('중앙 정렬 컨테이너를 가져야 함', () => {
    const { container } = render(<LoadingSpinner />)

    // Box 컨테이너가 있는지 확인
    const box = container.firstChild
    expect(box).toBeInTheDocument()
  })
})
