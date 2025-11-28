import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PatientCard from '../PatientCard'

describe('PatientCard', () => {
  const mockPatient = {
    id: 1,
    name: '홍길동',
    birth_date: '1990-01-01',
    gender: 'M',
    phone: '010-1234-5678',
  }

  it('환자 정보가 올바르게 표시되어야 함', () => {
    render(<PatientCard patient={mockPatient} />)

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText(/1990-01-01/)).toBeInTheDocument()
    expect(screen.getByText(/010-1234-5678/)).toBeInTheDocument()
  })

  it('성별이 올바르게 표시되어야 함', () => {
    render(<PatientCard patient={mockPatient} />)

    // 남성 아이콘 또는 텍스트가 있는지 확인
    expect(screen.getByText(/남성|Male/i)).toBeInTheDocument()
  })

  it('환자 데이터가 없으면 렌더링하지 않아야 함', () => {
    const { container } = render(<PatientCard patient={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('카드 컴포넌트가 렌더링되어야 함', () => {
    const { container } = render(<PatientCard patient={mockPatient} />)

    // MUI Card가 렌더링되는지 확인
    const card = container.querySelector('.MuiCard-root')
    expect(card).toBeInTheDocument()
  })
})
