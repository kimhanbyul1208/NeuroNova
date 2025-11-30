import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/config/app_config.dart';
import 'core/utils/logger.dart';
import 'core/services/notification_service.dart';
import 'core/services/auth_service.dart';
import 'data/local/local_database.dart';
import 'features/auth/login_screen.dart';
import 'features/patient/patient_main_page.dart';
import 'features/doctor/doctor_main_page.dart';
import 'features/admin/admin_main_page.dart';
import 'features/staff/staff_main_page.dart';
import 'features/appointment/appointment_list_screen.dart';
import 'features/appointment/appointment_create_screen.dart';
import 'features/medication/add_medication_screen.dart';
import 'features/records/medical_records_screen.dart';
import 'features/records/record_detail_screen.dart';
import 'features/profile/profile_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize logger
  AppLogger.info('Starting NeuroNova App v${AppConfig.appVersion}');

  // Initialize encrypted local database
  try {
    await LocalDatabase.database;
    AppLogger.info('Local database initialized');

    // Delete expired data on app start (90-day policy)
    final deletedCount = await LocalDatabase.deleteExpiredData();
    AppLogger.info('Deleted $deletedCount expired records');
  } catch (e, stackTrace) {
    AppLogger.error('Failed to initialize database', e, stackTrace);
  }

  // Initialize push notifications (placeholder)
  try {
    await NotificationService().initialize();
    AppLogger.info('Notification service initialized');
  } catch (e, stackTrace) {
    AppLogger.error('Failed to initialize notification service', e, stackTrace);
  }

  // Check for auto-login
  final initialRoute = await _getInitialRoute();
  runApp(MyApp(initialRoute: initialRoute));
}

Future<String> _getInitialRoute() async {
  final auth = AuthService();
  final role = await auth.tryAutoLogin();

  if (role != null) {
    // User is already logged in, route based on role
    switch (role) {
      case 'admin':
        return '/adminMain';
      case 'doctor':
        return '/doctorMain';
      case 'patient':
        return '/main';
      case 'staff':
        return '/staffMain';
      default:
        return '/patientMain'; // Default to patient
    }
  }
  return '/login';
}

class MyApp extends StatelessWidget {
  final String initialRoute;

  const MyApp({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1976D2),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
      ),
      locale: const Locale('ko', 'KR'),
      supportedLocales: const [Locale('ko', 'KR'), Locale('en', 'US')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      initialRoute: initialRoute,
      // 라우트 정의
      routes: {
        '/login': (context) => const LoginScreen(),
        '/main': (context) => const MainNavigationScreen(),
        '/patientMain': (context) => const PatientHomePage(),
        '/doctorMain': (context) => const DoctorMainPage(),
        '/adminMain': (context) => const AdminMainPage(),
        '/staffMain': (context) => const StaffMainPage(),
        '/appointments': (context) => const AppointmentListScreen(),
        '/appointment-create': (context) => const AppointmentCreateScreen(),
        '/add-medication': (context) => const AddMedicationScreen(),
        '/medical-records': (context) => const MedicalRecordsScreen(),
        '/record-detail': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as String;
          return RecordDetailScreen(recordId: args);
        },
      },
    );
  }
}

/// Splash Screen
/// Checks authentication and expired data
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await Future.delayed(const Duration(seconds: 2));

      // Check if user is logged in
      // TODO: Implement AuthRepository
      // final authRepo = AuthRepository();
      // final isLoggedIn = await authRepo.isLoggedIn();
      final isLoggedIn = false; // Temporarily hardcoded

      if (mounted) {
        if (isLoggedIn) {
          // Already logged in - go to home
          Navigator.of(context).pushReplacementNamed('/main');
        } else {
          // Not logged in - go to login screen
          Navigator.of(context).pushReplacementNamed('/login');
        }
      }
    } catch (e, stackTrace) {
      AppLogger.error('Initialization failed', e, stackTrace);
      if (mounted) {
        // On error, go to login screen
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.psychology,
              size: 100,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              AppConfig.appName,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '뇌종양 진단 CDSS',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

/// Main Navigation Screen with Bottom Navigation Bar
class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const PatientHomePage(), // Using actual patient home page
    const AppointmentListScreen(),
    const MedicalRecordsScreen(), // New Medical Records screen
    const NotificationsScreen(),
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: '홈',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: '예약',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.description),
            label: '진료내역',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: '알림',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: '프로필',
          ),
        ],
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}

/// Notifications Screen (Placeholder)
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('알림'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              '알림이 없습니다',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Profile Placeholder Screen
class ProfilePlaceholderScreen extends StatelessWidget {
  const ProfilePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              '프로필 페이지 개발 중...',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

