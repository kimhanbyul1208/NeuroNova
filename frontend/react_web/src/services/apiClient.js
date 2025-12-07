/**
 * API 클라이언트 유틸리티
 * API 요청, 에러 처리, 인증 토큰 관리
 */

/**
 * API 에러 클래스
 */
export class APIError extends Error {
  constructor(message, status, detail, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
}

/**
 * 인증 토큰 가져오기
 */
function getAuthToken() {
  return localStorage.getItem('access_token');
}

/**
 * API 응답 처리
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} - JSON 데이터
 * @throws {APIError} - API 에러
 */
export async function handleAPIResponse(response) {
  // 성공 응답
  if (response.ok) {
    // 204 No Content는 JSON 파싱하지 않음
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  // 에러 응답
  let error;
  try {
    error = await response.json();
  } catch {
    // JSON 파싱 실패 시 기본 에러
    error = { error: 'Unknown error', detail: response.statusText };
  }

  // API 서비스 장애 (503)
  if (response.status === 503) {
    throw new APIError(
      error.error || 'Service temporarily unavailable',
      503,
      error.detail || 'External API not configured',
      error.code
    );
  }

  // Rate limit 초과 (429)
  if (response.status === 429) {
    const retryAfter = error.retry_after || 60;
    throw new APIError(
      error.error || 'Too many requests',
      429,
      error.detail || `Please retry after ${retryAfter} seconds`,
      error.code
    );
  }

  // 인증 실패 (401)
  if (response.status === 401) {
    throw new APIError(
      error.error || 'Authentication required',
      401,
      error.detail || 'Please login again',
      error.code
    );
  }

  // 권한 없음 (403)
  if (response.status === 403) {
    throw new APIError(
      error.error || 'Permission denied',
      403,
      error.detail || 'You do not have permission to access this resource',
      error.code
    );
  }

  // 서버 에러 (500)
  if (response.status >= 500) {
    throw new APIError(
      error.error || 'Server error',
      response.status,
      error.detail || 'An internal server error occurred',
      error.code
    );
  }

  // 기타 에러
  throw new APIError(
    error.error || 'Request failed',
    response.status,
    error.detail,
    error.code
  );
}

/**
 * GET 요청
 * @param {string} url - 요청 URL
 * @param {Object} options - 추가 옵션
 * @returns {Promise<any>}
 */
export async function apiGet(url, options = {}) {
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  return handleAPIResponse(response);
}

/**
 * POST 요청
 * @param {string} url - 요청 URL
 * @param {Object} data - 요청 바디 데이터
 * @param {Object} options - 추가 옵션
 * @returns {Promise<any>}
 */
export async function apiPost(url, data, options = {}) {
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  return handleAPIResponse(response);
}

/**
 * PUT 요청
 * @param {string} url - 요청 URL
 * @param {Object} data - 요청 바디 데이터
 * @param {Object} options - 추가 옵션
 * @returns {Promise<any>}
 */
export async function apiPut(url, data, options = {}) {
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    body: JSON.stringify(data),
    ...options,
  });

  return handleAPIResponse(response);
}

/**
 * DELETE 요청
 * @param {string} url - 요청 URL
 * @param {Object} options - 추가 옵션
 * @returns {Promise<any>}
 */
export async function apiDelete(url, options = {}) {
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  return handleAPIResponse(response);
}

/**
 * 파일 업로드 (multipart/form-data)
 * @param {string} url - 요청 URL
 * @param {FormData} formData - 폼 데이터
 * @param {Object} options - 추가 옵션
 * @returns {Promise<any>}
 */
export async function apiUpload(url, formData, options = {}) {
  const token = getAuthToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Content-Type을 설정하지 않음 (브라우저가 자동으로 boundary 설정)
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    body: formData,
    ...options,
  });

  return handleAPIResponse(response);
}

/**
 * 외부 API 직접 호출 (공개 API용)
 * 인증 토큰 없이 외부 API를 직접 호출
 *
 * @param {string} url - 외부 API URL
 * @param {Object} options - Fetch 옵션
 * @returns {Promise<any>}
 */
export async function externalApiGet(url, options = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new APIError(
      'External API request failed',
      response.status,
      `Failed to fetch from ${url}`,
      'EXTERNAL_API_ERROR'
    );
  }

  return response.json();
}

/**
 * Retry 기능이 있는 API 요청
 * Rate limit 등의 일시적 오류 시 재시도
 *
 * @param {Function} apiFunction - API 함수 (apiGet, apiPost 등)
 * @param {Array} args - API 함수 인자
 * @param {number} maxRetries - 최대 재시도 횟수
 * @returns {Promise<any>}
 */
export async function apiWithRetry(apiFunction, args, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiFunction(...args);
    } catch (error) {
      lastError = error;

      // Rate limit 에러가 아니면 재시도하지 않음
      if (!(error instanceof APIError) || error.status !== 429) {
        throw error;
      }

      // 마지막 시도면 에러 throw
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Retry-After 시간만큼 대기
      const retryAfter = error.detail?.retry_after || (attempt + 1) * 1000;
      console.warn(`Rate limit exceeded. Retrying after ${retryAfter}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter));
    }
  }

  throw lastError;
}

/**
 * 기본 에러 핸들러
 * UI에 에러 메시지 표시
 *
 * @param {Error} error - 에러 객체
 * @param {Function} showNotification - 알림 표시 함수
 */
export function handleAPIError(error, showNotification) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        // 인증 실패 - 로그인 페이지로 이동
        showNotification('인증이 만료되었습니다. 다시 로그인해주세요.', 'error');
        // 로그아웃 처리
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        break;

      case 403:
        showNotification('접근 권한이 없습니다.', 'error');
        break;

      case 429:
        showNotification(
          '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          'warning'
        );
        break;

      case 503:
        showNotification(
          '서비스가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요.',
          'error'
        );
        break;

      default:
        showNotification(
          error.detail || error.message || '요청 처리 중 오류가 발생했습니다.',
          'error'
        );
    }
  } else {
    // 네트워크 에러 등
    showNotification(
      '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      'error'
    );
  }

  console.error('API Error:', error);
}
