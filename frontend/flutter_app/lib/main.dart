/// NeuroNova Patient App
/// Brain Tumor Diagnosis CDSS - Patient Mobile Application
import 'package:flutter/material.dart';
import 'core/config/app_config.dart';
import 'core/utils/logger.dart';
import 'data/local/local_database.dart';
import 'data/repositories/auth_repository.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_screen.dart';
import 'features/appointment/appointment_list_screen.dart';
import 'features/appointment/appointment_create_screen.dart';

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

  // TODO: Initialize Firebase for push notifications
  // await Firebase.initializeApp();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

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
      home: const SplashScreen(),
      // 라우트 정의
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const MainNavigationScreen(),
        '/appointments': (context) => const AppointmentListScreen(),
        '/appointment-create': (context) => const AppointmentCreateScreen(),
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
      final authRepo = AuthRepository();
      final isLoggedIn = await authRepo.isLoggedIn();

      if (mounted) {
        if (isLoggedIn) {
          // Already logged in - go to home
          Navigator.of(context).pushReplacementNamed('/home');
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
    const HomeScreen(),
    const AppointmentListScreen(),
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

/// Profile Screen (Placeholder)
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
            const CircleAvatar(
              radius: 50,
              child: Icon(Icons.person, size: 50),
            ),
            const SizedBox(height: 16),
            Text(
              '환자',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                // 설정 화면 등으로 이동
              },
              icon: const Icon(Icons.settings),
              label: const Text('설정'),
            ),
          ],
        ),
      ),
    );
  }
}
