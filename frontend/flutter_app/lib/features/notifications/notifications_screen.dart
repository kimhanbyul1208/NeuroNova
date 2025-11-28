import 'package:flutter/material.dart';
import '../../data/repositories/notification_repository.dart';
import '../../core/utils/logger.dart';

/// Notifications Screen
/// 알림 목록 표시 및 관리
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationRepository _notificationRepo = NotificationRepository();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final notifications = await _notificationRepo.fetchNotifications();
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      AppLogger.error('Failed to load notifications: $e');
      setState(() {
        _error = '알림을 불러오는데 실패했습니다.';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(int id) async {
    try {
      await _notificationRepo.markAsRead(id);
      setState(() {
        _notifications = _notifications.map((notif) {
          if (notif['id'] == id) {
            return {...notif, 'is_read': true};
          }
          return notif;
        }).toList();
      });
    } catch (e) {
      AppLogger.error('Failed to mark as read: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('읽음 처리에 실패했습니다.')),
      );
    }
  }

  Future<void> _deleteNotification(int id) async {
    try {
      await _notificationRepo.deleteNotification(id);
      setState(() {
        _notifications.removeWhere((notif) => notif['id'] == id);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('알림이 삭제되었습니다.')),
      );
    } catch (e) {
      AppLogger.error('Failed to delete notification: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('알림 삭제에 실패했습니다.')),
      );
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'SUCCESS':
        return Icons.check_circle;
      case 'WARNING':
        return Icons.warning;
      case 'ERROR':
        return Icons.error;
      default:
        return Icons.info;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'SUCCESS':
        return Colors.green;
      case 'WARNING':
        return Colors.orange;
      case 'ERROR':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !(n['is_read'] ?? false)).length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('알림'),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 60, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadNotifications,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.notifications_none, size: 60, color: Colors.grey),
            SizedBox(height: 16),
            Text('알림이 없습니다.', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.separated(
        itemCount: _notifications.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final notification = _notifications[index];
          final isRead = notification['is_read'] ?? false;
          final type = notification['type'] ?? 'INFO';

          return Dismissible(
            key: Key(notification['id'].toString()),
            direction: DismissDirection.endToStart,
            background: Container(
              color: Colors.red,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 16),
              child: const Icon(Icons.delete, color: Colors.white),
            ),
            onDismissed: (direction) {
              _deleteNotification(notification['id']);
            },
            child: ListTile(
              tileColor: isRead ? null : Colors.blue.withOpacity(0.05),
              leading: CircleAvatar(
                backgroundColor: _getNotificationColor(type).withOpacity(0.2),
                child: Icon(
                  _getNotificationIcon(type),
                  color: _getNotificationColor(type),
                ),
              ),
              title: Row(
                children: [
                  Expanded(
                    child: Text(
                      notification['title'] ?? '',
                      style: TextStyle(
                        fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                  ),
                  if (!isRead)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'NEW',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(notification['message'] ?? ''),
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(notification['created_at']),
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
              trailing: !isRead
                  ? IconButton(
                      icon: const Icon(Icons.check, color: Colors.blue),
                      onPressed: () => _markAsRead(notification['id']),
                      tooltip: '읽음으로 표시',
                    )
                  : null,
              onTap: () {
                if (!isRead) {
                  _markAsRead(notification['id']);
                }
              },
            ),
          );
        },
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays > 0) {
        return '${difference.inDays}일 전';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}시간 전';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}분 전';
      } else {
        return '방금 전';
      }
    } catch (e) {
      return dateStr;
    }
  }
}
