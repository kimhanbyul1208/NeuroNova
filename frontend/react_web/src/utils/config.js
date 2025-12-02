/**
 * Configuration file for NeuroNova Web Application.
 * Soft-coding: All configuration values are defined here.
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  ORTHANC_URL: import.meta.env.VITE_ORTHANC_URL || 'http://localhost:8042', // Orthanc DICOM server
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication (aligned with Django backend)
  LOGIN: `/api/${API_CONFIG.API_VERSION}/users/login/`,
  REFRESH_TOKEN: `/api/${API_CONFIG.API_VERSION}/users/refresh/`,
  REGISTER: `/api/${API_CONFIG.API_VERSION}/users/register/`,
  ME: `/api/${API_CONFIG.API_VERSION}/users/profiles/me/`,

  // Users
  USERS: `/api/${API_CONFIG.API_VERSION}/users/users/`,
  USER_PROFILE: (id) => `/api/${API_CONFIG.API_VERSION}/users/profiles/${id}/`,
  USER_PROFILES: `/api/${API_CONFIG.API_VERSION}/users/profiles/`,

  // EMR
  PATIENTS: `/api/${API_CONFIG.API_VERSION}/emr/patients/`,
  PATIENT_DETAIL: (id) => `/api/${API_CONFIG.API_VERSION}/emr/patients/${id}/`,
  ENCOUNTERS: `/api/${API_CONFIG.API_VERSION}/emr/encounters/`,
  SOAP_CHARTS: `/api/${API_CONFIG.API_VERSION}/emr/soap/`,
  VITALS: `/api/${API_CONFIG.API_VERSION}/emr/vitals/`,
  DOCUMENTS: `/api/${API_CONFIG.API_VERSION}/emr/documents/`,

  // Custom
  APPOINTMENTS: `/api/${API_CONFIG.API_VERSION}/custom/appointments/`,
  PREDICTIONS: `/api/${API_CONFIG.API_VERSION}/custom/predictions/`,
  PRESCRIPTIONS: `/api/${API_CONFIG.API_VERSION}/custom/prescriptions/`,

  // AI Services
  AI_PRESCRIPTION_RECOMMEND: `/api/${API_CONFIG.API_VERSION}/ai/prescription/recommend/`,
  AI_DIAGNOSIS_ASSIST: `/api/${API_CONFIG.API_VERSION}/ai/diagnosis/assist/`,
  AI_DRUG_INTERACTION: `/api/${API_CONFIG.API_VERSION}/ai/drug/interaction/`,

  // Notifications
  NOTIFICATIONS: `/api/${API_CONFIG.API_VERSION}/notifications/`,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'NeuroNova',
  APP_VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'ko',
  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  PATIENT: 'PATIENT',
};

// Status Constants
export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  COMPLETED: 'COMPLETED',
};

export const ENCOUNTER_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Tumor Types
export const TUMOR_TYPES = {
  GLIOMA: 'Glioma',
  MENINGIOMA: 'Meningioma',
  PITUITARY: 'Pituitary',
  NO_TUMOR: 'No Tumor',
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  APP_CONFIG,
  USER_ROLES,
  APPOINTMENT_STATUS,
  ENCOUNTER_STATUS,
  TUMOR_TYPES,
  CHART_COLORS,
};
