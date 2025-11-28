import 'package:flutter/material.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/local/local_database.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/logger.dart';

/// Profile Screen
/// 사용자 프로필 및 설정
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthRepository _authRepo = AuthRepository();
  Map<String, dynamic>? _userInfo;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    try {
      setState(() => _isLoading = true);
      final userInfo = await _authRepo.getUserInfo();
      setState(() {
        _userInfo = userInfo;
        _isLoading = false;
      });
    } catch (e) {
      AppLogger.error('Failed to load user info: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('로그아웃'),
        content: const Text('정말 로그아웃 하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _authRepo.logout();
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/login');
        }
      } catch (e) {
        AppLogger.error('Logout failed: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('로그아웃에 실패했습니다.')),
          );
        }
      }
    }
  }

  Future<void> _clearLocalData() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('로컬 데이터 삭제'),
        content: const Text(
          '저장된 모든 로컬 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('삭제'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await LocalDatabase.clearAllData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('로컬 데이터가 삭제되었습니다.')),
          );
        }
      } catch (e) {
        AppLogger.error('Failed to clear local data: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('데이터 삭제에 실패했습니다.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // User Info Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue.shade400, Colors.blue.shade600],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundColor: Colors.white,
                          child: Icon(
                            Icons.person,
                            size: 60,
                            color: Colors.blue.shade600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _userInfo?['username'] ?? '사용자',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _userInfo?['email'] ?? '',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Settings List
                  const SizedBox(height: 16),
                  _buildSectionTitle('계정 정보'),
                  _buildListTile(
                    icon: Icons.badge,
                    title: '사용자 ID',
                    subtitle: _userInfo?['id']?.toString() ?? '-',
                  ),
                  _buildListTile(
                    icon: Icons.verified_user,
                    title: '역할',
                    subtitle: _userInfo?['role'] ?? 'PATIENT',
                  ),
                  const Divider(),

                  _buildSectionTitle('앱 정보'),
                  _buildListTile(
                    icon: Icons.info,
                    title: '앱 버전',
                    subtitle: AppConfig.appVersion,
                  ),
                  _buildListTile(
                    icon: Icons.security,
                    title: '데이터 보관 기간',
                    subtitle: '${AppConfig.dataExpirationDays}일',
                  ),
                  const Divider(),

                  _buildSectionTitle('데이터 관리'),
                  _buildActionTile(
                    icon: Icons.delete_sweep,
                    title: '로컬 데이터 삭제',
                    subtitle: '저장된 모든 로컬 데이터를 삭제합니다',
                    onTap: _clearLocalData,
                    color: Colors.orange,
                  ),
                  const Divider(),

                  _buildSectionTitle('계정'),
                  _buildActionTile(
                    icon: Icons.logout,
                    title: '로그아웃',
                    subtitle: '현재 계정에서 로그아웃합니다',
                    onTap: _handleLogout,
                    color: Colors.red,
                  ),

                  const SizedBox(height: 32),
                  Text(
                    '© 2025 ${AppConfig.appName}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue),
      title: Text(title),
      subtitle: Text(subtitle),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required Color color,
  }) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: TextStyle(color: color)),
      subtitle: Text(subtitle),
      trailing: Icon(Icons.chevron_right, color: color),
      onTap: onTap,
    );
  }
}
