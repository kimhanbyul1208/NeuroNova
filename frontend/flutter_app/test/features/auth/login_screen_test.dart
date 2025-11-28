import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/features/auth/login_screen.dart';

void main() {
  group('LoginScreen Widget 테스트', () {
    testWidgets('로그인 폼이 렌더링되어야 함', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Assert
      expect(find.byType(TextField), findsNWidgets(2)); // 사용자명, 비밀번호
      expect(find.byType(ElevatedButton), findsOneWidget); // 로그인 버튼
    });

    testWidgets('빈 폼 제출 시 에러가 표시되어야 함', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Act
      final loginButton = find.byType(ElevatedButton);
      await tester.tap(loginButton);
      await tester.pump();

      // Assert
      // 에러 메시지가 표시되는지 확인
      expect(find.text('사용자명을 입력하세요'), findsOneWidget);
    });

    testWidgets('사용자명과 비밀번호를 입력할 수 있어야 함', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Act
      final usernameField = find.byKey(const Key('username_field'));
      final passwordField = find.byKey(const Key('password_field'));

      await tester.enterText(usernameField, 'testuser');
      await tester.enterText(passwordField, 'password123');

      // Assert
      expect(find.text('testuser'), findsOneWidget);
      expect(find.text('password123'), findsOneWidget);
    });

    testWidgets('로딩 중에는 버튼이 비활성화되어야 함', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Act
      final loginButton = find.byType(ElevatedButton);
      await tester.tap(loginButton);
      await tester.pump(const Duration(milliseconds: 100));

      // Assert
      final button = tester.widget<ElevatedButton>(loginButton);
      expect(button.onPressed, isNull); // 버튼 비활성화
    });
  });
}
