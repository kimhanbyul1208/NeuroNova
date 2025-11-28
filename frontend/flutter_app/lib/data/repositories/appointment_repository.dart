import 'package:dio/dio.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/logger.dart';
import '../models/appointment_model.dart';
import '../local/local_database.dart';

/// 예약 Repository
/// 서버와 로컬 DB 간의 예약 데이터 동기화 관리
class AppointmentRepository {
  final Dio _dio;

  AppointmentRepository({Dio? dio}) : _dio = dio ?? Dio();

  /// 예약 생성 (서버)
  Future<AppointmentModel> createAppointment({
    required int patientId,
    required int doctorId,
    required DateTime scheduledAt,
    required String visitType,
    String? reason,
  }) async {
    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}${AppConfig.appointmentsEndpoint}',
        data: {
          'patient_id': patientId,
          'doctor_id': doctorId,
          'scheduled_at': scheduledAt.toIso8601String(),
          'visit_type': visitType,
          'reason': reason,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final appointment = AppointmentModel.fromJson(response.data);
        // 로컬 DB에 저장
        await LocalDatabase.insertAppointment(appointment.toMap());
        AppLogger.info('Appointment created: ${appointment.id}');
        return appointment;
      } else {
        throw Exception('예약 생성 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Create appointment error: ${e.message}');
      throw Exception('예약 생성 중 오류가 발생했습니다.');
    } catch (e) {
      AppLogger.error('Unexpected create appointment error: $e');
      throw Exception('예약 생성 중 오류가 발생했습니다.');
    }
  }

  /// 예약 목록 조회 (서버)
  Future<List<AppointmentModel>> fetchAppointments(int patientId) async {
    try {
      final response = await _dio.get(
        '${AppConfig.apiBaseUrl}${AppConfig.appointmentsEndpoint}',
        queryParameters: {'patient_id': patientId},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        final appointments =
            data.map((json) => AppointmentModel.fromJson(json)).toList();

        // 로컬 DB에 모두 저장 (서버 데이터가 최신)
        for (var appointment in appointments) {
          await LocalDatabase.insertAppointment(appointment.toMap());
        }

        AppLogger.info('Fetched ${appointments.length} appointments');
        return appointments;
      } else {
        throw Exception('예약 조회 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Fetch appointments error: ${e.message}');
      // 네트워크 오류 시 로컬 DB에서 가져오기 (오프라인 모드)
      AppLogger.info('Fetching from local database (offline mode)');
      final localData = await LocalDatabase.getAppointments();
      return localData.map((map) => AppointmentModel.fromMap(map)).toList();
    } catch (e) {
      AppLogger.error('Unexpected fetch appointments error: $e');
      throw Exception('예약 조회 중 오류가 발생했습니다.');
    }
  }

  /// 예약 상세 조회 (서버)
  Future<AppointmentModel> getAppointmentById(int id) async {
    try {
      final response = await _dio.get(
        '${AppConfig.apiBaseUrl}${AppConfig.appointmentsEndpoint}$id/',
      );

      if (response.statusCode == 200) {
        final appointment = AppointmentModel.fromJson(response.data);
        await LocalDatabase.insertAppointment(appointment.toMap());
        return appointment;
      } else {
        throw Exception('예약 조회 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Get appointment error: ${e.message}');
      throw Exception('예약 조회 중 오류가 발생했습니다.');
    }
  }

  /// 예약 취소 (서버)
  Future<void> cancelAppointment(int id) async {
    try {
      final response = await _dio.patch(
        '${AppConfig.apiBaseUrl}${AppConfig.appointmentsEndpoint}$id/',
        data: {'status': 'CANCELLED'},
      );

      if (response.statusCode == 200) {
        // 로컬 DB에서도 업데이트
        final updatedAppointment = AppointmentModel.fromJson(response.data);
        await LocalDatabase.insertAppointment(updatedAppointment.toMap());
        AppLogger.info('Appointment cancelled: $id');
      } else {
        throw Exception('예약 취소 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Cancel appointment error: ${e.message}');
      throw Exception('예약 취소 중 오류가 발생했습니다.');
    }
  }

  /// 로컬 DB에서 예약 목록 조회 (오프라인)
  Future<List<AppointmentModel>> getLocalAppointments() async {
    try {
      final localData = await LocalDatabase.getAppointments();
      return localData.map((map) => AppointmentModel.fromMap(map)).toList();
    } catch (e) {
      AppLogger.error('Get local appointments error: $e');
      return [];
    }
  }

  /// 동기화되지 않은 예약 서버로 전송
  Future<void> syncPendingAppointments() async {
    try {
      final pendingData = await LocalDatabase.getPendingAppointments();
      final pendingAppointments =
          pendingData.map((map) => AppointmentModel.fromMap(map)).toList();

      if (pendingAppointments.isEmpty) {
        AppLogger.info('No pending appointments to sync');
        return;
      }

      for (var appointment in pendingAppointments) {
        try {
          // 서버 ID가 없으면 생성
          if (appointment.serverId == null) {
            final response = await _dio.post(
              '${AppConfig.apiBaseUrl}${AppConfig.appointmentsEndpoint}',
              data: appointment.toJson(),
            );

            if (response.statusCode == 201 || response.statusCode == 200) {
              // 서버에서 받은 ID로 업데이트
              final serverAppointment =
                  AppointmentModel.fromJson(response.data);
              await LocalDatabase.insertAppointment(
                  serverAppointment.copyWith(synced: true).toMap());
            }
          }
        } catch (e) {
          AppLogger.error(
              'Failed to sync appointment ${appointment.id}: $e');
        }
      }

      AppLogger.info('Synced ${pendingAppointments.length} appointments');
    } catch (e) {
      AppLogger.error('Sync appointments error: $e');
      throw Exception('예약 동기화 중 오류가 발생했습니다.');
    }
  }

  /// 로컬 DB 초기화 (로그아웃 시)
  Future<void> clearLocalData() async {
    try {
      await LocalDatabase.clearAllData();
      AppLogger.info('Local appointment data cleared');
    } catch (e) {
      AppLogger.error('Clear local data error: $e');
    }
  }

  /// Dio 인터셉터 설정 (토큰 추가)
  void setAuthToken(String token) {
    _dio.interceptors.clear();
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.headers['Authorization'] = 'Bearer $token';
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            AppLogger.error('Unauthorized - Token expired');
          }
          return handler.next(error);
        },
      ),
    );
  }
}
