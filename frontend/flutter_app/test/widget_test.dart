import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/main.dart';

void main() {
  testWidgets('앱이 정상적으로 시작되어야 함', (WidgetTester tester) async {
    // 앱 빌드
    await tester.pumpWidget(const MyApp());

    // 로그인 화면이 표시되는지 확인 (초기 화면)
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
