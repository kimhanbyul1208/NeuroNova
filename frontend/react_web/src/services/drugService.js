/**
 * 약물 정보 서비스
 * DrugBank, PubChem 등의 약물 데이터베이스 통합
 */

import { apiGet } from './apiClient';

class DrugService {
  /**
   * DrugBank API를 통한 약물 정보 조회
   * 백엔드 프록시를 통해 API 키를 안전하게 관리
   *
   * @param {string} drugId - DrugBank ID (예: 'DB00001')
   * @returns {Promise<Object>} 약물 정보
   */
  async getDrugInfo(drugId) {
    try {
      const data = await apiGet(`/api/drug/drugbank/${drugId}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch drug info for ${drugId}:`, error);
      throw error;
    }
  }

  /**
   * 약물 상호작용 정보 조회
   *
   * @param {string} drugId - DrugBank ID
   * @returns {Promise<Object>} 상호작용 정보
   */
  async getDrugInteractions(drugId) {
    try {
      const data = await apiGet(`/api/drug/drugbank/${drugId}/interactions`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch drug interactions for ${drugId}:`, error);
      throw error;
    }
  }

  /**
   * PubChem API를 통한 화합물 정보 조회
   * 백엔드 프록시를 통해 rate limit 관리
   *
   * @param {string} compoundName - 화합물 이름 (예: 'aspirin')
   * @returns {Promise<Object>} 화합물 정보
   */
  async getCompoundInfo(compoundName) {
    try {
      const data = await apiGet(`/api/drug/pubchem/${encodeURIComponent(compoundName)}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch compound info for ${compoundName}:`, error);
      throw error;
    }
  }

  /**
   * 약물 검색
   * 내부 데이터베이스 검색
   *
   * @param {string} query - 검색어
   * @returns {Promise<Array>} 검색 결과
   */
  async searchDrugs(query) {
    try {
      const data = await apiGet(`/api/drug/search/?q=${encodeURIComponent(query)}`);
      return data;
    } catch (error) {
      console.error(`Failed to search drugs with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * 환자의 약물 목록 조회
   *
   * @param {number} patientId - 환자 ID
   * @returns {Promise<Array>} 약물 목록
   */
  async getPatientDrugs(patientId) {
    try {
      const data = await apiGet(`/api/emr/patients/${patientId}/medications/`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch drugs for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * 약물 처방 추가
   *
   * @param {number} patientId - 환자 ID
   * @param {Object} medication - 약물 정보
   * @returns {Promise<Object>} 생성된 처방
   */
  async addMedication(patientId, medication) {
    try {
      const data = await apiPost(
        `/api/emr/patients/${patientId}/medications/`,
        medication
      );
      return data;
    } catch (error) {
      console.error(`Failed to add medication for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * 약물 상호작용 체크
   * 여러 약물 간의 상호작용 확인
   *
   * @param {Array<string>} drugIds - DrugBank ID 배열
   * @returns {Promise<Object>} 상호작용 정보
   */
  async checkDrugInteractions(drugIds) {
    try {
      const data = await apiPost('/api/drug/check-interactions/', {
        drug_ids: drugIds
      });
      return data;
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      throw error;
    }
  }
}

export default new DrugService();
