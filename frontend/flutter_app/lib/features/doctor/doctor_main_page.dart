import 'package:flutter/material.dart';
import '../../core/services/auth_service.dart';

class DoctorMainPage extends StatelessWidget {
  const DoctorMainPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('의사 페이지'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService().logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: const Center(
        child: Text('의사 기능을 준비 중입니다.'),
      ),
    );
  }
}
