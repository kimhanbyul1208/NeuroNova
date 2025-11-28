/// Authentication Service for NeuroNova
/// Handles login, token management, and auto-login functionality
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../utils/logger.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  String? _accessToken;
  String? _refreshToken;

  /// Login with username and password
  Future<LoginResult> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}${AppConfig.loginEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _accessToken = data['access'];
        _refreshToken = data['refresh'];

        // Save tokens
        await _saveTokens();

        // Fetch user profile
        final userProfile = await fetchUserProfile();

        AppLogger.info('Login successful for user: $username');
        return LoginResult(
          success: true,
          message: '로그인 성공',
          userRole: userProfile?['role'],
          userData: userProfile,
        );
      } else {
        AppLogger.warning('Login failed: ${response.statusCode}');
        return LoginResult(
          success: false,
          message: '로그인에 실패했습니다.',
        );
      }
    } catch (e, stackTrace) {
      AppLogger.error('Login error', e, stackTrace);
      return LoginResult(
        success: false,
        message: '네트워크 오류가 발생했습니다.',
      );
    }
  }

  /// Fetch user profile using current access token
  Future<Map<String, dynamic>?> fetchUserProfile() async {
    if (_accessToken == null) return null;

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/api/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_accessToken',
        },
      ).timeout(AppConfig.apiTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to fetch user profile', e, stackTrace);
      return null;
    }
  }

  /// Try auto-login on app start
  Future<String?> tryAutoLogin() async {
    try {
      // Load tokens from storage
      final prefs = await SharedPreferences.getInstance();
      _accessToken = prefs.getString('access');
      _refreshToken = prefs.getString('refresh');

      if (_accessToken == null) return null;

      // Verify token by fetching user profile
      final userProfile = await fetchUserProfile();
      if (userProfile == null) {
        // Token invalid, clear storage
        await logout();
        return null;
      }

      return userProfile['role'];
    } catch (e, stackTrace) {
      AppLogger.error('Auto-login failed', e, stackTrace);
      return null;
    }
  }

  /// Save tokens to local storage
  Future<void> _saveTokens() async {
    final prefs = await SharedPreferences.getInstance();
    if (_accessToken != null) {
      await prefs.setString('access', _accessToken!);
    }
    if (_refreshToken != null) {
      await prefs.setString('refresh', _refreshToken!);
    }
  }

  /// Logout and clear tokens
  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access');
    await prefs.remove('refresh');

    AppLogger.info('User logged out');
  }

  /// Get current access token
  String? get accessToken => _accessToken;

  /// Get current refresh token
  String? get refreshToken => _refreshToken;
}

/// Login Result
class LoginResult {
  final bool success;
  final String message;
  final String? userRole;
  final Map<String, dynamic>? userData;

  LoginResult({
    required this.success,
    required this.message,
    this.userRole,
    this.userData,
  });
}
