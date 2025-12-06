import 'dart:convert';
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

        // JWT 토큰에서 정보 추출 (토큰에 role, groups 포함됨)
        final tokenPayload = _decodeJwt(data['access']);
        
        // 사용자 정보 저장 (JWT payload에서 추출)
        await _storage.write(
            key: 'user_id', value: tokenPayload['user_id']?.toString() ?? '');
        await _storage.write(
            key: 'username', value: tokenPayload['username'] ?? username);
        await _storage.write(
            key: 'role', value: tokenPayload['role'] ?? 'PATIENT');
        await _storage.write(
            key: 'email', value: tokenPayload['email'] ?? '');
        
        // Groups 정보 저장 (JSON 문자열로)
        if (tokenPayload['groups'] != null) {
          await _storage.write(
              key: 'groups', value: tokenPayload['groups'].toString());
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

  /// JWT 토큰 디코딩 (간단한 Base64 디코딩)
  Map<String, dynamic> _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        throw Exception('Invalid token');
      }

      // Payload는 두 번째 부분
      final payload = parts[1];
      
      // Base64 디코딩 (URL-safe)
      var normalized = base64Url.normalize(payload);
      var decoded = utf8.decode(base64Url.decode(normalized));
      
      return json.decode(decoded) as Map<String, dynamic>;
    } catch (e) {
      AppLogger.error('JWT decode error: $e');
      return {};
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
      final email = await _storage.read(key: 'email');

      return {
        'userId': userId,
        'username': username,
        'role': role,
        'email': email,
      };
    } catch (e) {
      AppLogger.error('getUserInfo error: $e');
      return {
        'userId': null,
        'username': null,
        'role': null,
        'email': null,
      };
    }
  }

  /// 사용자 역할 가져오기
  Future<String?> getUserRole() async {
    try {
      return await _storage.read(key: 'role');
    } catch (e) {
      AppLogger.error('getUserRole error: $e');
      return null;
    }
  }

  /// 특정 역할 확인
  Future<bool> hasRole(String role) async {
    try {
      final userRole = await _storage.read(key: 'role');
      return userRole == role;
    } catch (e) {
      AppLogger.error('hasRole error: $e');
      return false;
    }
  }

  /// 특정 그룹 소속 확인
  Future<bool> hasGroup(String groupName) async {
    try {
      final groupsStr = await _storage.read(key: 'groups');
      if (groupsStr == null) return false;
      
      // 간단한 문자열 검색 (실제로는 JSON 파싱 필요)
      return groupsStr.contains(groupName);
    } catch (e) {
      AppLogger.error('hasGroup error: $e');
      return false;
    }
  }
  /// 서버에서 사용자 프로필 정보 가져오기
  Future<Map<String, dynamic>> fetchUserProfile() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) throw Exception('로그인이 필요합니다.');

      // TODO: 실제 API 엔드포인트 확인 필요. 현재는 가정.
      final response = await _dio.get(
        '${AppConfig.apiBaseUrl}/api/users/me/', 
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception('프로필 조회 실패');
      }
    } catch (e) {
      AppLogger.error('Fetch profile error: $e');
      // API 호출 실패 시 로컬 스토리지 정보라도 반환 시도 가능
      throw Exception('프로필 정보를 불러오는데 실패했습니다.');
    }
  }

  /// 프로필 업데이트
  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) throw Exception('로그인이 필요합니다.');

      final response = await _dio.patch(
        '${AppConfig.apiBaseUrl}/api/users/me/',
        data: data,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode != 200) {
        throw Exception('프로필 업데이트 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Update profile error: ${e.message}');
      throw Exception('프로필 업데이트 중 오류가 발생했습니다.');
    }
  }

  /// SMS 인증 코드 요청
  /// [phone] 전화번호 (예: 010-1234-5678)
  /// Returns: 만료 시간(초)
  Future<int> requestSmsCode(String phone) async {
    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/v1/users/sms/request/',
        data: {'phone': phone},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        AppLogger.info('SMS code requested for: $phone');
        return data['expires_in'] ?? 300;
      } else {
        throw Exception('SMS 요청 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('SMS request error: ${e.message}');
      if (e.response?.statusCode == 404) {
        throw Exception('등록되지 않은 전화번호입니다.');
      }
      throw Exception('SMS 인증 요청 중 오류가 발생했습니다.');
    } catch (e) {
      AppLogger.error('Unexpected SMS request error: $e');
      throw Exception('SMS 인증 요청 중 오류가 발생했습니다.');
    }
  }

  /// SMS 인증 및 로그인
  /// [phone] 전화번호
  /// [code] 6자리 인증 코드
  /// Returns: 사용자 정보, 토큰, is_first_login 플래그
  Future<Map<String, dynamic>> verifySmsAndLogin(
      String phone, String code) async {
    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/v1/users/sms/verify/',
        data: {
          'phone': phone,
          'code': code,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;

        // 토큰 저장
        await _storage.write(key: 'access_token', value: data['access']);
        await _storage.write(key: 'refresh_token', value: data['refresh']);

        // is_first_login 플래그 저장
        final isFirstLogin = data['is_first_login'] ?? false;
        await _storage.write(
            key: 'is_first_login', value: isFirstLogin.toString());

        // JWT 토큰에서 정보 추출
        final tokenPayload = _decodeJwt(data['access']);

        // 사용자 정보 저장
        await _storage.write(
            key: 'user_id', value: tokenPayload['user_id']?.toString() ?? '');
        await _storage.write(
            key: 'username', value: tokenPayload['username'] ?? phone);
        await _storage.write(
            key: 'role', value: tokenPayload['role'] ?? 'PATIENT');
        await _storage.write(
            key: 'email', value: tokenPayload['email'] ?? '');

        AppLogger.info('SMS login successful for: $phone');
        return data;
      } else {
        throw Exception('SMS 로그인 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('SMS login error: ${e.message}');
      if (e.response?.statusCode == 400) {
        final errorMsg = e.response?.data['error'] ?? '인증 코드가 올바르지 않습니다.';
        throw Exception(errorMsg);
      }
      throw Exception('SMS 로그인 중 오류가 발생했습니다.');
    } catch (e) {
      AppLogger.error('Unexpected SMS login error: $e');
      throw Exception('SMS 로그인 중 오류가 발생했습니다.');
    }
  }

  /// 비밀번호 변경
  /// [oldPassword] 기존 비밀번호
  /// [newPassword] 새 비밀번호
  /// [newPasswordConfirm] 새 비밀번호 확인
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
    required String newPasswordConfirm,
  }) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) throw Exception('로그인이 필요합니다.');

      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/v1/users/change_password/',
        data: {
          'old_password': oldPassword,
          'new_password': newPassword,
          'new_password_confirm': newPasswordConfirm,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        // 비밀번호 변경 성공 시 is_first_login 플래그 false로 변경
        await _storage.write(key: 'is_first_login', value: 'false');
        AppLogger.info('Password changed successfully');
      } else {
        throw Exception('비밀번호 변경 실패: ${response.statusMessage}');
      }
    } on DioException catch (e) {
      AppLogger.error('Change password error: ${e.message}');
      if (e.response?.statusCode == 400) {
        final errorData = e.response?.data;
        if (errorData is Map) {
          if (errorData['old_password'] != null) {
            throw Exception('기존 비밀번호가 올바르지 않습니다.');
          }
          if (errorData['new_password'] != null) {
            throw Exception(errorData['new_password'][0]);
          }
          if (errorData['new_password_confirm'] != null) {
            throw Exception('새 비밀번호가 일치하지 않습니다.');
          }
        }
      }
      throw Exception('비밀번호 변경 중 오류가 발생했습니다.');
    } catch (e) {
      AppLogger.error('Unexpected change password error: $e');
      throw Exception('비밀번호 변경 중 오류가 발생했습니다.');
    }
  }

  /// 첫 로그인 여부 확인
  Future<bool> isFirstLogin() async {
    try {
      final isFirstLoginStr = await _storage.read(key: 'is_first_login');
      return isFirstLoginStr == 'true';
    } catch (e) {
      AppLogger.error('isFirstLogin check error: $e');
      return false;
    }
  }
}
