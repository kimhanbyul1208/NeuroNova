import 'package:flutter/material.dart';
import '../../data/repositories/appointment_repository.dart';
import '../../data/models/appointment_model.dart';
import '../../core/utils/logger.dart';

/// 예약 목록 화면
/// 모든 예약 조회 및 관리
class AppointmentListScreen extends StatefulWidget {
  const AppointmentListScreen({super.key});

  @override
  State<AppointmentListScreen> createState() => _AppointmentListScreenState();
}

class _AppointmentListScreenState extends State<AppointmentListScreen> {
  final AppointmentRepository _appointmentRepo = AppointmentRepository();
  List<AppointmentModel> _appointments = [];
  bool _isLoading = true;
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 로컬 DB에서 예약 목록 가져오기
      _appointments = await _appointmentRepo.getLocalAppointments();
    } catch (e) {
      AppLogger.error('Failed to load appointments: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  List<AppointmentModel> get _filteredAppointments {
    if (_selectedFilter == 'ALL') {
      return _appointments;
    }
    return _appointments
        .where((apt) => apt.status == _selectedFilter)
        .toList();
  }

  Future<void> _cancelAppointment(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('예약 취소'),
        content: const Text('이 예약을 취소하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('아니오'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('예, 취소합니다'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _appointmentRepo.cancelAppointment(id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('예약이 취소되었습니다')),
          );
          _loadAppointments();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('예약 취소 실패: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('예약 목록'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              // 예약 생성 화면으로 이동
              final result =
                  await Navigator.pushNamed(context, '/appointment-create');
              if (result == true) {
                _loadAppointments();
              }
            },
            tooltip: '예약 생성',
          ),
        ],
      ),
      body: Column(
        children: [
          // 필터 칩
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', '전체'),
                  const SizedBox(width: 8),
                  _buildFilterChip('PENDING', '대기'),
                  const SizedBox(width: 8),
                  _buildFilterChip('CONFIRMED', '확정'),
                  const SizedBox(width: 8),
                  _buildFilterChip('COMPLETED', '완료'),
                  const SizedBox(width: 8),
                  _buildFilterChip('CANCELLED', '취소'),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          // 예약 목록
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadAppointments,
                    child: _filteredAppointments.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.event_busy,
                                  size: 64,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  '예약이 없습니다',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredAppointments.length,
                            itemBuilder: (context, index) {
                              final appointment = _filteredAppointments[index];
                              return _buildAppointmentCard(appointment);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = value;
        });
      },
      selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
      checkmarkColor: Theme.of(context).primaryColor,
    );
  }

  Widget _buildAppointmentCard(AppointmentModel appointment) {
    final statusColor = _getStatusColor(appointment.status);
    final statusText = _getStatusText(appointment.status);
    final canCancel = appointment.status == 'PENDING' ||
        appointment.status == 'CONFIRMED';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          // 예약 상세 화면으로 이동 (구현 예정)
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 18,
                          color: Theme.of(context).primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _formatDateTime(appointment.scheduledAt),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
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
              const SizedBox(height: 12),
              if (appointment.doctorName != null) ...[
                Row(
                  children: [
                    const Icon(Icons.person, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Text(
                      '담당의: ${appointment.doctorName}',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
              if (appointment.visitType != null) ...[
                Row(
                  children: [
                    const Icon(Icons.category, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Text(
                      _getVisitTypeText(appointment.visitType!),
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
              if (appointment.reason != null) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.note, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        appointment.reason!,
                        style: TextStyle(color: Colors.grey[700]),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              if (canCancel) ...[
                const SizedBox(height: 12),
                const Divider(),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () => _cancelAppointment(appointment.id!),
                    icon: const Icon(Icons.cancel, size: 18),
                    label: const Text('예약 취소'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
        return Colors.green;
      case 'COMPLETED':
        return Colors.blue;
      case 'CANCELLED':
      case 'NO_SHOW':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return '대기';
      case 'CONFIRMED':
        return '확정';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      case 'NO_SHOW':
        return '미방문';
      default:
        return status;
    }
  }

  String _getVisitTypeText(String type) {
    switch (type) {
      case 'FIRST_VISIT':
        return '초진';
      case 'FOLLOW_UP':
        return '재진';
      case 'CHECK_UP':
        return '검진';
      default:
        return type;
    }
  }

  String _formatDateTime(DateTime date) {
    return '${date.year}.${date.month.toString().padLeft(2, '0')}.${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
