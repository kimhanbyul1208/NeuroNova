/**
 * 단백질 구조 API 서비스
 * 서버를 거치지 않고 직접 외부 API 호출 (트래픽 절감)
 */

const PROTEIN_API_BASE = 'https://data.rcsb.org/rest/v1'; // 예시: RCSB PDB API

class ProteinService {
  /**
   * 단백질 구조 데이터 가져오기
   * @param {string} proteinId - 단백질 ID (예: 1HHO)
   * @returns {Promise<object>} 단백질 구조 데이터
   */
  async getStructure(proteinId) {
    try {
      // 1. 브라우저 캐시 확인 (선택사항)
      const cacheKey = `protein_structure_${proteinId}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log(`[Cache Hit] ${proteinId}`);
        return cached;
      }

      // 2. 외부 API 직접 호출 (서버 우회!)
      console.log(`[API Call] Fetching ${proteinId} from external API`);
      const response = await fetch(`${PROTEIN_API_BASE}/core/entry/${proteinId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // 3. 브라우저에 캐싱 (1시간)
      this.setCache(cacheKey, data, 3600);

      // 4. Django에 조회 기록만 저장 (작은 데이터)
      this.logView(proteinId, data.struct?.title || 'Unknown');

      return data;
    } catch (error) {
      console.error('Failed to fetch protein structure:', error);
      throw error;
    }
  }

  /**
   * 3D 구조 파일 다운로드 (PDB 형식)
   * @param {string} proteinId
   * @returns {Promise<string>} PDB 파일 내용
   */
  async getPDBFile(proteinId) {
    const cacheKey = `protein_pdb_${proteinId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // PDB 파일 직접 다운로드 (서버 우회)
    const response = await fetch(`https://files.rcsb.org/download/${proteinId}.pdb`);
    const pdbText = await response.text();

    // 캐싱 (1일)
    this.setCache(cacheKey, pdbText, 86400);

    return pdbText;
  }

  /**
   * 조회 기록을 Django에 저장 (메타데이터만)
   * @param {string} proteinId
   * @param {string} proteinName
   */
  async logView(proteinId, proteinName) {
    try {
      // 매우 작은 데이터만 전송 (< 1KB)
      await fetch('/api/proteins/log/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 인증 토큰 (필요한 경우)
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          protein_id: proteinId,
          protein_name: proteinName,
          viewed_at: new Date().toISOString()
        })
      });
    } catch (error) {
      // 로그 저장 실패는 무시 (메인 기능에 영향 없음)
      console.warn('Failed to log protein view:', error);
    }
  }

  /**
   * 브라우저 캐시에서 데이터 가져오기
   * @param {string} key
   * @returns {object|null}
   */
  getCache(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, expiry } = JSON.parse(item);

      // 만료 확인
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 브라우저 캐시에 데이터 저장
   * @param {string} key
   * @param {object} data
   * @param {number} ttl - Time to live (초)
   */
  setCache(key, data, ttl) {
    try {
      const item = {
        data,
        expiry: Date.now() + (ttl * 1000)
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('protein_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export default new ProteinService();
