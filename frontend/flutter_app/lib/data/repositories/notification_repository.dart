import 'package:dio/dio.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/logger.dart';
import 'auth_repository.dart';

/// Notification Repository
/// 알림 관련 API 통신
class NotificationRepository {
  final Dio _dio = Dio();
  final AuthRepository _authRepo = AuthRepository();

  NotificationRepository() {
    _dio.options.baseUrl = AppConfig.apiBaseUrl;
    _dio.options.connectTimeout = AppConfig.apiTimeout;
    _dio.options.receiveTimeout = AppConfig.apiTimeout;
  }

  /// 알림 목록 조회
  Future<List<Map<String, dynamic>>> fetchNotifications() async {
    try {
      final token = await _authRepo.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await _dio.get(
        AppConfig.notificationsEndpoint,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map && data.containsKey('results')) {
          return List<Map<String, dynamic>>.from(data['results']);
        } else if (data is List) {
          return List<Map<String, dynamic>>.from(data);
        }
        return [];
      } else {
        throw Exception('Failed to fetch notifications');
      }
    } catch (e) {
      AppLogger.error('Error fetching notifications: $e');
      rethrow;
    }
  }

  /// 알림 읽음 처리
  Future<void> markAsRead(int id) async {
    try {
      final token = await _authRepo.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      await _dio.patch(
        '${AppConfig.notificationsEndpoint}$id/',
        data: {'is_read': true},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } catch (e) {
      AppLogger.error('Error marking notification as read: $e');
      rethrow;
    }
  }

  /// 알림 삭제
  Future<void> deleteNotification(int id) async {
    try {
      final token = await _authRepo.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      await _dio.delete(
        '${AppConfig.notificationsEndpoint}$id/',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } catch (e) {
      AppLogger.error('Error deleting notification: $e');
      rethrow;
    }
  }
}
