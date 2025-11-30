import 'package:flutter/material.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/appointment_repository.dart';
import '../../data/models/appointment_model.dart';
import '../../core/utils/logger.dart';

/// 홈 화면
/// 사용자 정보 및 다음 예약 표시
class PatientHomePage extends StatefulWidget {
  const PatientHomePage({super.key});

  @override
  State<PatientHomePage> createState() => _PatientHomePageState();
}

class _PatientHomePageState extends State<PatientHomePage> {
  final AuthRepository _authRepo = AuthRepository();
  final AppointmentRepository _appointmentRepo = AppointmentRepository();

  Map<String, String?> _userInfo = {};
  List<AppointmentModel> _upcomingAppointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 사용자 정보 로드
      _userInfo = await _authRepo.getUserInfo();

      // 예약 정보 로드 (로컬)
      final appointments = await _appointmentRepo.getLocalAppointments();

      // 다가오는 예약만 필터링 (PENDING, CONFIRMED)
      final now = DateTime.now();
      _upcomingAppointments = appointments
          .where((apt) =>
              (apt.status == 'PENDING' || apt.status == 'CONFIRMED') &&
              apt.scheduledAt.isAfter(now))
          .toList()
        ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
    } catch (e) {
      AppLogger.error('Failed to load home data: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('로그아웃'),
        content: const Text('로그아웃 하시겠습니까?'),
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
        await _appointmentRepo.clearLocalData();
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
      } catch (e) {
        AppLogger.error('Logout failed: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('로그아웃 중 오류가 발생했습니다: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('홈'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: '로그아웃',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 병원 로고 및 이름
                    Center(
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Theme.of(context).primaryColor.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.local_hospital,
                              size: 60,
                              color: Theme.of(context).primaryColor,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'NeuroNova 병원',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).primaryColor,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '뇌종양 진단 전문',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 사용자 정보 카드
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundColor:
                                  Theme.of(context).primaryColor.withOpacity(0.1),
                              child: Icon(
                                Icons.person,
                                size: 40,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _userInfo['username'] ?? '환자님',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '환자',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: Colors.grey[600],
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 담당의사 및 진료과 정보 카드
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.medical_services,
                                  color: Theme.of(context).primaryColor,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '진료 정보',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            _buildInfoRow(
                              icon: Icons.person_outline,
                              label: '담당의사',
                              value: '김신경 교수',
                              context: context,
                            ),
                            const SizedBox(height: 12),
                            _buildInfoRow(
                              icon: Icons.local_hospital_outlined,
                              label: '진료과',
                              value: '신경외과',
                              context: context,
                            ),
                            const SizedBox(height: 12),
                            _buildInfoRow(
                              icon: Icons.location_on_outlined,
                              label: '진료실 위치',
                              value: '본관 3층 301호',
                              context: context,
                            ),
                            const SizedBox(height: 12),
                            _buildInfoRow(
                              icon: Icons.phone_outlined,
                              label: '진료과 전화',
                              value: '02-1234-5678',
                              context: context,
                            ),
                            const SizedBox(height: 12),
                            _buildInfoRow(
                              icon: Icons.access_time_outlined,
                              label: '진료 시간',
                              value: '평일 09:00-18:00',
                              context: context,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 병원 위치 정보 카드
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: InkWell(
                        onTap: () {
                          // TODO: Open map or directions
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('지도 앱으로 이동합니다.'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.map,
                                  color: Colors.green,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '병원 찾아오기',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '서울시 강남구 테헤란로 123',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: Colors.grey[600],
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 예약하기 버튼
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pushNamed(context, '/appointment-create');
                        },
                        icon: const Icon(Icons.calendar_today),
                        label: const Text(
                          '예약하기',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 다가오는 예약
                    Text(
                      '다가오는 예약',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),

                    if (_upcomingAppointments.isEmpty)
                      Card(
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.event_available,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '예약된 일정이 없습니다',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      ...(_upcomingAppointments.take(3).map((appointment) {
                        return _buildAppointmentCard(appointment);
                      })),

                    if (_upcomingAppointments.length > 3)
                      TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, '/appointments');
                        },
                        child: const Text('모든 예약 보기'),
                      ),
                    
                    const SizedBox(height: 24),

                    // 처방약 관리 섹션
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '처방약 관리',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        TextButton.icon(
                          onPressed: () {
                            Navigator.pushNamed(context, '/add-medication');
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('기록하기'),
                          style: TextButton.styleFrom(
                            foregroundColor: Theme.of(context).primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.medication,
                                size: 48,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '등록된 처방약이 없습니다',
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '\'기록하기\'를 눌러 처방약을 등록하세요',
                                style: TextStyle(
                                  color: Colors.grey[500],
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // 이전 진료기록 섹션
                    Text(
                      '이전 진료기록',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: InkWell(
                        onTap: () {
                          Navigator.pushNamed(context, '/medical-records');
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.description,
                                  color: Colors.blue,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '진료기록 조회',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '이전 진료 내역을 확인하세요',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: Colors.grey[600],
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  // Helper method to build info rows
  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required BuildContext context,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: Colors.grey[600],
        ),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }

  Widget _buildAppointmentCard(AppointmentModel appointment) {
    final statusColor = appointment.status == 'CONFIRMED'
        ? Colors.green
        : Colors.orange;
    final statusText =
        appointment.status == 'CONFIRMED' ? '확정' : '대기';

    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          // 예약 상세 화면으로 이동
          Navigator.pushNamed(
            context,
            '/appointment-detail',
            arguments: appointment.id,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.event,
                        color: Theme.of(context).primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(appointment.scheduledAt),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _formatTime(appointment.scheduledAt),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
              if (appointment.doctorName != null) ...[
                const SizedBox(height: 4),
                Text(
                  '담당의: ${appointment.doctorName}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
              ],
              if (appointment.reason != null) ...[
                const SizedBox(height: 8),
                Text(
                  appointment.reason!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}년 ${date.month}월 ${date.day}일';
  }

  String _formatTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
