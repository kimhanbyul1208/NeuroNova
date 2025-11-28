import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/logger.dart';

/// 인증 Repository
/// JWT 기반 인증 관리
class AuthRepository {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthRepository({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage();

  /// 로그인
  /// [username] 사용자명
  /// [password] 비밀번호
  /// Returns: 사용자 정보 및 토큰
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}${AppConfig.loginEndpoint}',
        data: {
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;

        // 토큰 저장
        await _storage.write(key: 'access_token', value: data['access']);
        await _storage.write(key: 'refresh_token', value: data['refresh']);

        // 사용자 정보 저장
        if (data.containsKey('user')) {
          await _storage.write(
              key: 'user_id', value: data['user']['id'].toString());
          await _storage.write(key: 'username', value: data['user']['username']);
          await _storage.write(key: 'role', value: data['user']['role'] ?? 'PATIENT');
        }

        AppLogger.info('Login successful for user: $username');
        return data;
      } else {
        throw Exception('로그인 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Login error: ${e.message}');
      if (e.response?.statusCode == 401) {
        throw Exception('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
      throw Exception('로그인 중 오류가 발생했습니다.');
    } catch (e) {
      AppLogger.error('Unexpected login error: $e');
      throw Exception('로그인 중 오류가 발생했습니다.');
    }
  }

  /// 토큰 갱신
  /// Returns: 새로운 액세스 토큰
  Future<String> refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) {
        throw Exception('Refresh token이 없습니다.');
      }

      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}${AppConfig.refreshTokenEndpoint}',
        data: {'refresh': refreshToken},
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['access'];
        await _storage.write(key: 'access_token', value: newAccessToken);
        AppLogger.info('Token refreshed successfully');
        return newAccessToken;
      } else {
        throw Exception('토큰 갱신 실패');
      }
    } on DioException catch (e) {
      AppLogger.error('Token refresh error: ${e.message}');
      throw Exception('토큰 갱신에 실패했습니다.');
    }
  }

  /// 로그아웃
  Future<void> logout() async {
    try {
      // 토큰 삭제
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
      await _storage.delete(key: 'user_id');
      await _storage.delete(key: 'username');
      await _storage.delete(key: 'role');

      AppLogger.info('Logout successful');
    } catch (e) {
      AppLogger.error('Logout error: $e');
      throw Exception('로그아웃 중 오류가 발생했습니다.');
    }
  }

  /// 현재 로그인 상태 확인
  Future<bool> isLoggedIn() async {
    try {
      final accessToken = await _storage.read(key: 'access_token');
      return accessToken != null && accessToken.isNotEmpty;
    } catch (e) {
      AppLogger.error('isLoggedIn check error: $e');
      return false;
    }
  }

  /// 액세스 토큰 가져오기
  Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: 'access_token');
    } catch (e) {
      AppLogger.error('getAccessToken error: $e');
      return null;
    }
  }

  /// 사용자 정보 가져오기
  Future<Map<String, String?>> getUserInfo() async {
    try {
      final userId = await _storage.read(key: 'user_id');
      final username = await _storage.read(key: 'username');
      final role = await _storage.read(key: 'role');

      return {
        'userId': userId,
        'username': username,
        'role': role,
      };
    } catch (e) {
      AppLogger.error('getUserInfo error: $e');
      return {
        'userId': null,
        'username': null,
        'role': null,
      };
    }
  }
}
