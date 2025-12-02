// Register Page - 의료진 회원가입
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'PATIENT',
    phone_number: '',
    department: '',
    license_number: '',
  });

  const roles = [
    { value: 'PATIENT', label: '환자' },
    { value: 'DOCTOR', label: '의사' },
    { value: 'NURSE', label: '간호사' },
    { value: 'ADMIN', label: '관리자' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Basic validation
    if (formData.password !== formData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone_number: formData.phone_number,
      };
      if (formData.role === 'DOCTOR' || formData.role === 'NURSE') {
        payload.department = formData.department;
        payload.license_number = formData.license_number;
      }
      await axiosClient.post(API_ENDPOINTS.REGISTER, payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        let message = '회원가입에 실패했습니다.';
        const fieldNames = {
          username: '사용자명',
          email: '이메일',
          password: '비밀번호',
          password_confirm: '비밀번호 확인',
          first_name: '이름',
          last_name: '성',
          role: '직책',
          phone_number: '전화번호',
          department: '부서',
          license_number: '면허번호',
        };
        if (typeof data === 'object') {
          const messages = [];
          if (data.non_field_errors) {
            const nf = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : data.non_field_errors;
            messages.push(nf);
          }
          for (const key in data) {
            if (key === 'non_field_errors') continue;
            let errContent = Array.isArray(data[key]) ? data[key].join(' ') : data[key];
            if (key === 'role' && errContent.includes('유효하지 않은 선택')) {
              messages.push('"직책"이 유효하지 않은 선택(choice)입니다.');
              continue;
            }
            const fieldName = fieldNames[key] || key;
            messages.push(`${fieldName}: ${errContent}`);
          }
          message = messages.join('\n');
        } else if (typeof data === 'string') {
          message = data;
        }
        setError(message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('서버와의 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError('회원가입 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <div className="login-header">
          <h1 className="login-title">NeuroNova</h1>
          <p className="login-subtitle">뇌종양 진단 임상 의사결정 지원 시스템</p>
          <h2 className="login-heading">의료진 회원가입</h2>
        </div>

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="error-box" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', color: '#155724' }}>
            <span className="error-icon">✓</span> 회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="register-grid">
            {/* 직책 */}
            <div className="form-group">
              <label className="form-label">직책 *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="form-input"
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 사용자명 */}
            <div className="form-group">
              <label className="form-label">사용자명 *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="form-input"
                autoComplete="username"
              />
            </div>

            {/* 이메일 */}
            <div className="form-group">
              <label className="form-label">이메일 *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                autoComplete="email"
              />
            </div>

            {/* 성 & 이름 */}
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">성 *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  autoComplete="family-name"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">이름 *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  autoComplete="given-name"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label className="form-label">비밀번호 *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                autoComplete="new-password"
                placeholder="최소 8자 이상"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
              <label className="form-label">비밀번호 확인 *</label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                className="form-input"
                autoComplete="new-password"
              />
            </div>

            {/* 전화번호 */}
            <div className="form-group">
              <label className="form-label">전화번호</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="form-input"
                autoComplete="tel"
                placeholder="010-1234-5678"
              />
            </div>

            {/* 부서 & 면허번호 - 의료진 전용 */}
            {(formData.role === 'DOCTOR' || formData.role === 'NURSE') && (
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">부서</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="신경외과"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">면허번호</label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="login-footer">
          <p className="footer-text">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="footer-link">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
