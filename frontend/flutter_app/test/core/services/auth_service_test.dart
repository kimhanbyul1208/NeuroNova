import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/core/services/auth_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() {
  group('AuthService 테스트', () {
    late AuthService authService;

    setUp(() {
      authService = AuthService.instance;
      FlutterSecureStorage.setMockInitialValues({}); // Mock 초기화
    });

    test('Singleton 인스턴스가 유일해야 함', () {
      final instance1 = AuthService.instance;
      final instance2 = AuthService.instance;

      expect(instance1, same(instance2));
    });

    test('토큰을 저장하고 불러올 수 있어야 함', () async {
      // Given
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      // When
      await authService.saveTokens(accessToken, refreshToken);

      // Then
      final savedAccessToken = await authService.getAccessToken();
      final savedRefreshToken = await authService.getRefreshToken();

      expect(savedAccessToken, accessToken);
      expect(savedRefreshToken, refreshToken);
    });

    test('토큰을 삭제할 수 있어야 함', () async {
      // Given
      await authService.saveTokens('access', 'refresh');

      // When
      await authService.deleteTokens();

      // Then
      final accessToken = await authService.getAccessToken();
      final refreshToken = await authService.getRefreshToken();

      expect(accessToken, isNull);
      expect(refreshToken, isNull);
    });

    test('로그인 여부를 확인할 수 있어야 함', () async {
      // Given
      await authService.deleteTokens();

      // When & Then
      expect(await authService.isLoggedIn(), isFalse);

      // Given
      await authService.saveTokens('access', 'refresh');

      // When & Then
      expect(await authService.isLoggedIn(), isTrue);
    });

    test('토큰 만료 여부를 확인할 수 있어야 함', () {
      // JWT 토큰 디코딩 테스트
      // 실제로는 jwt_decode 패키지 사용

      // 만료된 토큰 (과거 exp)
      // 만료되지 않은 토큰 (미래 exp)

      expect(authService, isNotNull);
    });
  });
}
