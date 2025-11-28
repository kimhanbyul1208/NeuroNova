import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import axios from 'axios'

// Axios mock
vi.mock('axios')

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('AuthContext', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('초기 상태는 로그아웃 상태여야 함', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('로그인이 성공하면 사용자 정보와 토큰을 저장해야 함', async () => {
    const mockResponse = {
      data: {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: 1,
          username: 'testuser',
          role: 'DOCTOR',
        },
      },
    }

    axios.post.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('testuser', 'password123')
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user.username).toBe('testuser')
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token')
    })
  })

  it('로그인 실패 시 에러를 throw해야 함', async () => {
    axios.post.mockRejectedValueOnce(new Error('로그인 실패'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('wronguser', 'wrongpassword')
      })
    ).rejects.toThrow()

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('로그아웃 시 사용자 정보와 토큰을 삭제해야 함', async () => {
    // 먼저 로그인 상태로 만들기
    localStorage.setItem('accessToken', 'test-token')
    localStorage.setItem('refreshToken', 'test-refresh')

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('토큰이 있으면 자동으로 사용자 정보를 로드해야 함', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IkRPQ1RPUiJ9.test'
    localStorage.setItem('accessToken', mockToken)

    const { result } = renderHook(() => useAuth(), { wrapper })

    // 토큰에서 사용자 정보가 디코딩되었는지 확인
    await waitFor(() => {
      expect(result.current.user).not.toBeNull()
    })
  })
})
