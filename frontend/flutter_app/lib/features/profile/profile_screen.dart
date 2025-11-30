import 'package:flutter/material.dart';
import '../../data/repositories/auth_repository.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthRepository _authRepository = AuthRepository();
  Map<String, dynamic>? _userInfo;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    try {
      // API를 통해 최신 정보 가져오기
      final userInfo = await _authRepository.fetchUserProfile();
      setState(() {
        _userInfo = userInfo;
        _isLoading = false;
      });
    } catch (e) {
      // API 실패 시 로컬 정보 시도 (선택 사항)
      final localInfo = await _authRepository.getUserInfo();
      setState(() {
        _userInfo = localInfo; // 로컬 정보라도 보여줌
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('최신 정보를 불러오지 못했습니다.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 정보'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => EditProfileScreen(userInfo: _userInfo),
                ),
              );
              if (result == true) {
                _loadUserProfile(); // Reload if updated
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 50,
              child: Icon(Icons.person, size: 50),
            ),
            const SizedBox(height: 24),
            _buildInfoTile('이름', _userInfo?['full_name'] ?? '이름 없음'),
            _buildInfoTile('이메일', _userInfo?['email'] ?? '이메일 없음'),
            _buildInfoTile('전화번호', _userInfo?['phone_number'] ?? '전화번호 없음'),
            _buildInfoTile('역할', _userInfo?['role'] ?? '환자'),
            if (_userInfo?['department'] != null)
              _buildInfoTile('소속 진료과', _userInfo!['department']['name']),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () async {
                await _authRepository.logout();
                if (mounted) {
                  Navigator.of(context).pushReplacementNamed('/login');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('로그아웃'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
