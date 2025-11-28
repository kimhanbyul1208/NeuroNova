/// Firebase Cloud Messaging (FCM) Notification Service
/// Handles push notification initialization, token management, and message handling.
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';
import '../utils/logger.dart';

/// Background message handler (must be top-level function)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  AppLogger.info('Background message received: ${message.messageId}');
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;

  /// Get current FCM token
  String? get fcmToken => _fcmToken;

  /// Initialize FCM and local notifications
  Future<void> initialize() async {
    try {
      // Initialize Firebase
      await Firebase.initializeApp();
      AppLogger.info('Firebase initialized');

      // Request notification permissions (iOS)
      NotificationSettings settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        AppLogger.info('Notification permission granted');
      } else {
        AppLogger.warning('Notification permission denied');
        return;
      }

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Get FCM token
      _fcmToken = await _firebaseMessaging.getToken();
      if (_fcmToken != null) {
        AppLogger.info('FCM Token: $_fcmToken');
        // Send token to Django backend
        await _sendTokenToServer(_fcmToken!);
      }

      // Handle token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        AppLogger.info('FCM Token refreshed: $newToken');
        _fcmToken = newToken;
        _sendTokenToServer(newToken);
      });

      // Set up foreground message handler
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Set up background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Handle notification opened from terminated state
      RemoteMessage? initialMessage =
          await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageOpened(initialMessage);
      }

      // Handle notification opened from background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpened);

      AppLogger.info('Notification service initialized');
    } catch (e, stackTrace) {
      AppLogger.error('Failed to initialize notification service', e, stackTrace);
    }
  }

  /// Initialize local notifications for foreground display
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _handleLocalNotificationTap,
    );
  }

  /// Send FCM token to Django backend
  Future<void> _sendTokenToServer(String token) async {
    try {
      final response = await http.patch(
        Uri.parse('${AppConfig.apiBaseUrl}/users/profiles/me/'),
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add JWT token from secure storage
          // 'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'fcm_token': token,
        }),
      );

      if (response.statusCode == 200) {
        AppLogger.info('FCM token sent to server successfully');
      } else {
        AppLogger.error('Failed to send FCM token: ${response.statusCode}');
      }
    } catch (e, stackTrace) {
      AppLogger.error('Error sending FCM token to server', e, stackTrace);
    }
  }

  /// Handle foreground messages (app is open)
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    AppLogger.info('Foreground message received: ${message.notification?.title}');

    // Display local notification
    if (message.notification != null) {
      await _showLocalNotification(message);
    }
  }

  /// Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'neuronova_channel',
      'NeuroNova Notifications',
      channelDescription: 'Ì…‘ Äè CDSS L¼',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'L¼',
      message.notification?.body ?? '',
      details,
      payload: jsonEncode(message.data),
    );
  }

  /// Handle when user taps on notification
  void _handleMessageOpened(RemoteMessage message) {
    AppLogger.info('Notification opened: ${message.notification?.title}');

    final notificationType = message.data['type'];

    switch (notificationType) {
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
        // Navigate to appointments screen
        // TODO: Implement navigation
        AppLogger.info('Navigate to appointments');
        break;

      case 'DIAGNOSIS_READY':
        // Navigate to diagnosis detail
        final predictionId = message.data['prediction_id'];
        AppLogger.info('Navigate to diagnosis: $predictionId');
        break;

      case 'PRESCRIPTION_READY':
        // Navigate to prescriptions
        AppLogger.info('Navigate to prescriptions');
        break;

      default:
        AppLogger.info('Unknown notification type: $notificationType');
    }
  }

  /// Handle local notification tap
  void _handleLocalNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!);
        final message = RemoteMessage(data: Map<String, dynamic>.from(data));
        _handleMessageOpened(message);
      } catch (e) {
        AppLogger.error('Error handling local notification tap', e);
      }
    }
  }

  /// Subscribe to topic (optional)
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      AppLogger.info('Subscribed to topic: $topic');
    } catch (e) {
      AppLogger.error('Failed to subscribe to topic', e);
    }
  }

  /// Unsubscribe from topic (optional)
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      AppLogger.info('Unsubscribed from topic: $topic');
    } catch (e) {
      AppLogger.error('Failed to unsubscribe from topic', e);
    }
  }

  /// Clear all notifications
  Future<void> clearAllNotifications() async {
    await _localNotifications.cancelAll();
  }
}
