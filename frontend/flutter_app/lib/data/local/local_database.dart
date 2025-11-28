/// Local Encrypted Database using SQLCipher
/// 90-day auto-deletion policy for patient data security
import 'package:sqflite_sqlcipher/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/config/app_config.dart';
import '../../core/utils/logger.dart';

class LocalDatabase {
  static Database? _database;

  /// Get database instance
  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  /// Initialize encrypted database
  static Future<Database> _initDatabase() async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final path = join(directory.path, AppConfig.dbName);

      AppLogger.info('Initializing encrypted database at: $path');

      final database = await openDatabase(
        path,
        version: AppConfig.dbVersion,
        onCreate: _onCreate,
        onUpgrade: _onUpgrade,
        password: AppConfig.dbPassword, // SQLCipher encryption
      );

      AppLogger.info('Database initialized successfully');
      return database;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to initialize database', e, stackTrace);
      rethrow;
    }
  }

  /// Create tables
  static Future<void> _onCreate(Database db, int version) async {
    AppLogger.info('Creating database tables...');

    // Appointments table
    await db.execute('''
      CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER,
        doctor_name TEXT,
        scheduled_at TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT NOT NULL,
        visit_type TEXT NOT NULL,
        reason TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        expire_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    ''');

    // Notifications table
    await db.execute('''
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TEXT NOT NULL,
        expire_at TEXT NOT NULL
      )
    ''');

    // Diagnoses table (AI results summary)
    await db.execute('''
      CREATE TABLE diagnoses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        encounter_id INTEGER,
        diagnosis_summary TEXT NOT NULL,
        tumor_type TEXT,
        confidence_score REAL,
        doctor_note TEXT,
        created_at TEXT NOT NULL,
        expire_at TEXT NOT NULL
      )
    ''');

    // User profile cache
    await db.execute('''
      CREATE TABLE user_profile (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        full_name TEXT,
        role TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    AppLogger.info('Database tables created successfully');
  }

  /// Upgrade database
  static Future<void> _onUpgrade(
    Database db,
    int oldVersion,
    int newVersion,
  ) async {
    AppLogger.info('Upgrading database from v$oldVersion to v$newVersion');
    // Add migration logic here
  }

  /// Delete expired data (90-day policy)
  static Future<int> deleteExpiredData() async {
    try {
      final db = await database;
      final now = DateTime.now().toIso8601String();

      AppLogger.info('Deleting expired data...');

      int totalDeleted = 0;

      // Delete expired appointments
      final appointmentsDeleted = await db.delete(
        'appointments',
        where: 'expire_at < ?',
        whereArgs: [now],
      );
      totalDeleted += appointmentsDeleted;

      // Delete expired notifications
      final notificationsDeleted = await db.delete(
        'notifications',
        where: 'expire_at < ?',
        whereArgs: [now],
      );
      totalDeleted += notificationsDeleted;

      // Delete expired diagnoses
      final diagnosesDeleted = await db.delete(
        'diagnoses',
        where: 'expire_at < ?',
        whereArgs: [now],
      );
      totalDeleted += diagnosesDeleted;

      AppLogger.info('Deleted $totalDeleted expired records');
      return totalDeleted;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to delete expired data', e, stackTrace);
      return 0;
    }
  }

  /// Calculate expiration date
  static String calculateExpirationDate() {
    return DateTime.now()
        .add(Duration(days: AppConfig.dataExpirationDays))
        .toIso8601String();
  }

  /// Clear all data (for logout)
  static Future<void> clearAllData() async {
    try {
      final db = await database;
      await db.delete('appointments');
      await db.delete('notifications');
      await db.delete('diagnoses');
      await db.delete('user_profile');
      AppLogger.info('All local data cleared');
    } catch (e, stackTrace) {
      AppLogger.error('Failed to clear data', e, stackTrace);
    }
  }

  /// Close database
  static Future<void> close() async {
    if (_database != null) {
      await _database!.close();
      _database = null;
      AppLogger.info('Database closed');
    }
  }

  // ========== Appointment Methods ==========

  /// Insert or update appointment
  static Future<int> insertAppointment(Map<String, dynamic> appointment) async {
    try {
      final db = await database;
      return await db.insert(
        'appointments',
        appointment,
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e, stackTrace) {
      AppLogger.error('Failed to insert appointment', e, stackTrace);
      rethrow;
    }
  }

  /// Get all appointments
  static Future<List<Map<String, dynamic>>> getAppointments() async {
    try {
      final db = await database;
      return await db.query(
        'appointments',
        orderBy: 'scheduled_at DESC',
      );
    } catch (e, stackTrace) {
      AppLogger.error('Failed to get appointments', e, stackTrace);
      return [];
    }
  }

  /// Get appointment by ID
  static Future<Map<String, dynamic>?> getAppointmentById(int id) async {
    try {
      final db = await database;
      final results = await db.query(
        'appointments',
        where: 'id = ?',
        whereArgs: [id],
      );
      return results.isNotEmpty ? results.first : null;
    } catch (e, stackTrace) {
      AppLogger.error('Failed to get appointment by ID', e, stackTrace);
      return null;
    }
  }

  /// Get pending (unsynced) appointments
  static Future<List<Map<String, dynamic>>> getPendingAppointments() async {
    try {
      final db = await database;
      return await db.query(
        'appointments',
        where: 'synced = ?',
        whereArgs: [0],
      );
    } catch (e, stackTrace) {
      AppLogger.error('Failed to get pending appointments', e, stackTrace);
      return [];
    }
  }

  /// Delete appointment
  static Future<int> deleteAppointment(int id) async {
    try {
      final db = await database;
      return await db.delete(
        'appointments',
        where: 'id = ?',
        whereArgs: [id],
      );
    } catch (e, stackTrace) {
      AppLogger.error('Failed to delete appointment', e, stackTrace);
      return 0;
    }
  }
}
