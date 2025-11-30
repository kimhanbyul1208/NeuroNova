import '../utils/logger.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  
  NotificationService._internal();

  Future<void> initialize() async {
    AppLogger.info('NotificationService: Placeholder');
  }
}
