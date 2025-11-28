/// App Configuration
/// Soft-coding: All configuration values defined here
class AppConfig {
  // App Information
  static const String appName = 'NeuroNova';
  static const String appVersion = '1.0.0';

  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000', // Android emulator localhost
  );

  // API Endpoints (aligned with Django backend)
  static const String loginEndpoint = '/api/auth/token/';
  static const String refreshTokenEndpoint = '/api/auth/token/refresh/';
  static const String registerEndpoint = '/api/auth/register/';
  static const String meEndpoint = '/api/auth/me/';
  static const String updateProfileEndpoint = '/api/auth/update-profile/';
  static const String appointmentsEndpoint = '/api/appointments/';
  static const String notificationsEndpoint = '/api/notifications/';
  static const String profileEndpoint = '/api/auth/me/';

  // Patient endpoints
  static const String patientsEndpoint = '/api/patients/';
  static const String patientsMineEndpoint = '/api/patients/mine/';

  // Medical records
  static const String medicalRecordsEndpoint = '/api/patients/records/';

  // ML endpoints (via Django proxy)
  static const String mlPredictEndpoint = '/api/ml/predict/';
  static const String mlSchemaEndpoint = '/api/ml/schema/';

  // Local Database
  static const String dbName = 'neuronova.db';
  static const int dbVersion = 1;
  static const String dbPassword = 'neuronova_secure_2025'; // SQLCipher password

  // Data Retention Policy
  static const int dataExpirationDays = 90; // 90일 후 자동 삭제

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration refreshTokenTimeout = Duration(seconds: 10);

  // Firebase
  static const String fcmSenderId = String.fromEnvironment(
    'FCM_SENDER_ID',
    defaultValue: '',
  );

  // Features
  static const bool enableBiometric = true;
  static const bool enableOfflineMode = true;
  static const bool enablePushNotifications = true;
}
