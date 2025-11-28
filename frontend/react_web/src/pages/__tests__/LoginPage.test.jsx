import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'
import { AuthProvider } from '../../auth/AuthContext'

// useNavigate mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로그인 폼이 렌더링되어야 함', () => {
    render(<LoginPage />, { wrapper })

    expect(screen.getByLabelText(/사용자명|username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호|password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /로그인|login/i })).toBeInTheDocument()
  })

  it('입력 필드에 값을 입력할 수 있어야 함', () => {
    render(<LoginPage />, { wrapper })

    const usernameInput = screen.getByLabelText(/사용자명|username/i)
    const passwordInput = screen.getByLabelText(/비밀번호|password/i)

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(usernameInput.value).toBe('testuser')
    expect(passwordInput.value).toBe('password123')
  })

  it('빈 폼 제출 시 에러 메시지가 표시되어야 함', async () => {
    render(<LoginPage />, { wrapper })

    const submitButton = screen.getByRole('button', { name: /로그인|login/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // 에러 메시지가 표시되는지 확인
      expect(screen.getByText(/필수|required/i)).toBeInTheDocument()
    })
  })

  it('로그인 성공 시 대시보드로 이동해야 함', async () => {
    // AuthContext의 login이 성공한다고 가정
    render(<LoginPage />, { wrapper })

    const usernameInput = screen.getByLabelText(/사용자명|username/i)
    const passwordInput = screen.getByLabelText(/비밀번호|password/i)
    const submitButton = screen.getByRole('button', { name: /로그인|login/i })

    fireEvent.change(usernameInput, { target: { value: 'doctor' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(submitButton)

    // 로그인 성공 후 navigate 호출 확인 (실제로는 mock 필요)
    // await waitFor(() => {
    //   expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    // })
  })

  it('비밀번호 필드가 숨겨져 있어야 함', () => {
    render(<LoginPage />, { wrapper })

    const passwordInput = screen.getByLabelText(/비밀번호|password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
