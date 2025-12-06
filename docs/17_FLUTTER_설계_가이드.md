# Flutter 설계 가이드

## 목차
1. [Flutter 설계 철학](#1-flutter-설계-철학)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [위젯 설계 원칙](#3-위젯-설계-원칙)
4. [상태 관리](#4-상태-관리)
5. [로컬 데이터베이스](#5-로컬-데이터베이스)
6. [보안 설계](#6-보안-설계)
7. [성능 최적화](#7-성능-최적화)
8. [에러 처리](#8-에러-처리)
9. [테스트 전략](#9-테스트-전략)
10. [접근성](#10-접근성)

---

## 1. Flutter 설계 철학

### 1.1 Everything is a Widget
Flutter의 핵심 철학은 "모든 것이 위젯"입니다. UI 요소뿐만 아니라 레이아웃, 제스처, 애니메이션 모두 위젯으로 구성됩니다.

```dart
// ✅ 좋은 예: 위젯 조합
class PatientCard extends StatelessWidget {
  final Patient patient;

  const PatientCard({Key? key, required this.patient}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          PatientAvatar(patient: patient),
          PatientInfo(patient: patient),
          PatientActions(patient: patient),
        ],
      ),
    );
  }
}
```

### 1.2 Declarative UI
Flutter는 선언적 UI 패러다임을 사용합니다. UI는 현재 상태의 함수입니다.

```dart
// ✅ 선언적 UI
Widget build(BuildContext context) {
  return isLoading
    ? CircularProgressIndicator()
    : hasError
      ? ErrorWidget(error: error)
      : DataWidget(data: data);
}

// ❌ 명령적 UI (피해야 함)
void updateUI() {
  if (isLoading) {
    showLoader();
  } else if (hasError) {
    hideLoader();
    showError();
  } else {
    hideLoader();
    showData();
  }
}
```

### 1.3 Composition over Inheritance
상속보다 조합을 선호합니다.

```dart
// ✅ 조합 사용
class CustomButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color? backgroundColor;

  const CustomButton({
    Key? key,
    required this.child,
    this.onPressed,
    this.backgroundColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
      ),
      child: child,
    );
  }
}
```

---

## 2. 프로젝트 구조

### 2.1 NeuroNova 프로젝트 구조

```
lib/
├── main.dart                 # 애플리케이션 진입점
├── models/                   # 데이터 모델
│   ├── patient.dart
│   ├── assessment.dart
│   └── user.dart
├── services/                 # 비즈니스 로직 및 API
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── database_service.dart
│   └── encryption_service.dart
├── providers/                # 상태 관리 (Provider 패턴)
│   ├── auth_provider.dart
│   ├── patient_provider.dart
│   └── assessment_provider.dart
├── screens/                  # 화면 위젯
│   ├── login/
│   ├── dashboard/
│   ├── patient/
│   └── assessment/
├── widgets/                  # 재사용 가능한 위젯
│   ├── common/
│   ├── forms/
│   └── cards/
├── utils/                    # 유틸리티 함수
│   ├── constants.dart
│   ├── validators.dart
│   └── formatters.dart
└── theme/                    # 테마 설정
    ├── app_theme.dart
    ├── colors.dart
    └── text_styles.dart
```

### 2.2 구조 설계 원칙

#### 관심사의 분리 (Separation of Concerns)
- **models/**: 순수 데이터 클래스, 비즈니스 로직 없음
- **services/**: API 통신, 데이터베이스 작업, 외부 의존성
- **providers/**: 상태 관리 및 비즈니스 로직
- **screens/**: UI 구성 및 사용자 상호작용
- **widgets/**: 재사용 가능한 UI 컴포넌트

```dart
// ✅ 올바른 관심사 분리
// models/patient.dart
class Patient {
  final int id;
  final String name;
  final DateTime birthDate;

  Patient({required this.id, required this.name, required this.birthDate});

  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
    id: json['id'],
    name: json['name'],
    birthDate: DateTime.parse(json['birth_date']),
  );
}

// services/patient_service.dart
class PatientService {
  Future<List<Patient>> getPatients() async {
    final response = await http.get(Uri.parse('$baseUrl/patients'));
    // API 통신 로직
  }
}

// providers/patient_provider.dart
class PatientProvider extends ChangeNotifier {
  final PatientService _service;
  List<Patient> _patients = [];
  bool _isLoading = false;

  Future<void> loadPatients() async {
    _isLoading = true;
    notifyListeners();

    _patients = await _service.getPatients();

    _isLoading = false;
    notifyListeners();
  }
}

// screens/patient_list_screen.dart
class PatientListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<PatientProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return CircularProgressIndicator();
        }
        return ListView.builder(
          itemCount: provider.patients.length,
          itemBuilder: (context, index) => PatientCard(
            patient: provider.patients[index],
          ),
        );
      },
    );
  }
}
```

---

## 3. 위젯 설계 원칙

### 3.1 StatelessWidget vs StatefulWidget

#### StatelessWidget 사용 시기
- 위젯의 상태가 변하지 않을 때
- 외부에서 전달받은 데이터만 표시할 때

```dart
// ✅ StatelessWidget 사용
class PatientInfo extends StatelessWidget {
  final Patient patient;

  const PatientInfo({Key? key, required this.patient}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('이름: ${patient.name}'),
        Text('생년월일: ${patient.birthDate}'),
      ],
    );
  }
}
```

#### StatefulWidget 사용 시기
- 위젯 내부에서 상태가 변경될 때
- 애니메이션, 폼 입력 등

```dart
// ✅ StatefulWidget 사용
class AssessmentForm extends StatefulWidget {
  @override
  _AssessmentFormState createState() => _AssessmentFormState();
}

class _AssessmentFormState extends State<AssessmentForm> {
  final _formKey = GlobalKey<FormState>();
  String _score = '';

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: TextFormField(
        onChanged: (value) => setState(() => _score = value),
        validator: (value) => value?.isEmpty ?? true ? '점수를 입력하세요' : null,
      ),
    );
  }
}
```

### 3.2 위젯 분리 및 재사용

#### 작은 위젯으로 분리
```dart
// ✅ 작은 위젯으로 분리
class PatientCard extends StatelessWidget {
  final Patient patient;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          _buildHeader(),
          _buildBody(),
          _buildActions(),
        ],
      ),
    );
  }

  Widget _buildHeader() => PatientHeader(patient: patient);
  Widget _buildBody() => PatientBody(patient: patient);
  Widget _buildActions() => PatientActions(patient: patient);
}

// ❌ 너무 큰 위젯 (피해야 함)
class PatientCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          // 100줄 이상의 복잡한 위젯 트리
          Container(
            child: Row(
              children: [
                // ...
              ],
            ),
          ),
          // ...
        ],
      ),
    );
  }
}
```

#### 재사용 가능한 위젯
```dart
// ✅ 재사용 가능한 커스텀 위젯
class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? backgroundColor;
  final VoidCallback? onTap;

  const CustomCard({
    Key? key,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: backgroundColor,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: padding ?? EdgeInsets.all(16),
          child: child,
        ),
      ),
    );
  }
}
```

### 3.3 Const 생성자 활용

```dart
// ✅ const 생성자 사용 (성능 향상)
class AppTitle extends StatelessWidget {
  const AppTitle({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Text('NeuroNova CDSS');
  }
}

// ✅ const 위젯 재사용
Widget build(BuildContext context) {
  return Column(
    children: const [
      AppTitle(),
      SizedBox(height: 16),
      AppSubtitle(),
    ],
  );
}
```

---

## 4. 상태 관리

### 4.1 Provider 패턴 (NeuroNova 사용 중)

#### Provider 설정
```dart
// main.dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PatientProvider()),
        ChangeNotifierProvider(create: (_) => AssessmentProvider()),
      ],
      child: MyApp(),
    ),
  );
}
```

#### Provider 구현
```dart
// ✅ 잘 설계된 Provider
class PatientProvider extends ChangeNotifier {
  final PatientService _service;

  List<Patient> _patients = [];
  List<Patient> get patients => List.unmodifiable(_patients);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  PatientProvider(this._service);

  Future<void> loadPatients() async {
    try {
      _setLoading(true);
      _patients = await _service.getPatients();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> addPatient(Patient patient) async {
    try {
      final newPatient = await _service.createPatient(patient);
      _patients.add(newPatient);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    // 리소스 정리
    super.dispose();
  }
}
```

#### Provider 사용
```dart
// ✅ Consumer 사용
class PatientListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<PatientProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.error != null) {
          return ErrorWidget(message: provider.error!);
        }

        return ListView.builder(
          itemCount: provider.patients.length,
          itemBuilder: (context, index) => PatientCard(
            patient: provider.patients[index],
          ),
        );
      },
    );
  }
}

// ✅ Provider.of 사용 (읽기 전용)
class PatientCount extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final count = Provider.of<PatientProvider>(context, listen: false)
        .patients.length;
    return Text('환자 수: $count');
  }
}
```

### 4.2 상태 관리 베스트 프랙티스

#### 불변성 유지
```dart
// ✅ 불변 리스트 반환
class PatientProvider extends ChangeNotifier {
  List<Patient> _patients = [];
  List<Patient> get patients => List.unmodifiable(_patients);

  // ❌ 나쁜 예: 직접 수정 가능
  // List<Patient> get patients => _patients;
}
```

#### 선택적 리빌드
```dart
// ✅ Selector를 사용한 선택적 리빌드
class PatientCount extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Selector<PatientProvider, int>(
      selector: (_, provider) => provider.patients.length,
      builder: (_, count, __) => Text('환자 수: $count'),
    );
  }
}
```

---

## 5. 로컬 데이터베이스

### 5.1 SQLCipher를 사용한 암호화 데이터베이스

NeuroNova는 민감한 의료 데이터를 보호하기 위해 SQLCipher를 사용합니다.

```dart
// ✅ DatabaseService 구현
import 'package:sqflite_sqlcipher/sqflite.dart';
import 'package:path/path.dart';

class DatabaseService {
  static Database? _database;
  static const String _dbName = 'neuronova.db';
  static const String _dbPassword = 'YOUR_SECURE_PASSWORD'; // 실제로는 환경변수나 안전한 저장소 사용

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      password: _dbPassword,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        gender TEXT,
        medical_record_number TEXT UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        notes TEXT,
        assessed_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
      )
    ''');

    // 인덱스 생성 (성능 향상)
    await db.execute(
      'CREATE INDEX idx_assessments_patient_id ON assessments(patient_id)'
    );
  }
}
```

### 5.2 DAO 패턴

```dart
// ✅ DAO 패턴 구현
class PatientDao {
  final DatabaseService _dbService;

  PatientDao(this._dbService);

  Future<List<Patient>> getAllPatients() async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query('patients');
    return List.generate(maps.length, (i) => Patient.fromMap(maps[i]));
  }

  Future<Patient?> getPatientById(int id) async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'patients',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isEmpty) return null;
    return Patient.fromMap(maps.first);
  }

  Future<int> insertPatient(Patient patient) async {
    final db = await _dbService.database;
    return await db.insert(
      'patients',
      patient.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> updatePatient(Patient patient) async {
    final db = await _dbService.database;
    return await db.update(
      'patients',
      patient.toMap(),
      where: 'id = ?',
      whereArgs: [patient.id],
    );
  }

  Future<int> deletePatient(int id) async {
    final db = await _dbService.database;
    return await db.delete(
      'patients',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<List<Patient>> searchPatients(String query) async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'patients',
      where: 'name LIKE ? OR medical_record_number LIKE ?',
      whereArgs: ['%$query%', '%$query%'],
    );
    return List.generate(maps.length, (i) => Patient.fromMap(maps[i]));
  }
}
```

### 5.3 배치 작업 및 트랜잭션

```dart
// ✅ 트랜잭션 사용
Future<void> saveAssessmentWithResults(
  Assessment assessment,
  List<AssessmentResult> results,
) async {
  final db = await _dbService.database;

  await db.transaction((txn) async {
    // 평가 저장
    final assessmentId = await txn.insert('assessments', assessment.toMap());

    // 평가 결과 일괄 저장
    final batch = txn.batch();
    for (final result in results) {
      batch.insert('assessment_results', {
        ...result.toMap(),
        'assessment_id': assessmentId,
      });
    }
    await batch.commit(noResult: true);
  });
}
```

---

## 6. 보안 설계

### 6.1 데이터 암호화

#### SQLCipher 비밀번호 관리
```dart
// ✅ 환경변수 또는 Flutter Secure Storage 사용
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _storage = FlutterSecureStorage();
  static const _dbPasswordKey = 'db_password';

  Future<String> getDatabasePassword() async {
    String? password = await _storage.read(key: _dbPasswordKey);

    if (password == null) {
      // 첫 실행 시 비밀번호 생성
      password = _generateSecurePassword();
      await _storage.write(key: _dbPasswordKey, value: password);
    }

    return password;
  }

  String _generateSecurePassword() {
    // 안전한 랜덤 비밀번호 생성
    final random = Random.secure();
    final values = List<int>.generate(32, (i) => random.nextInt(256));
    return base64Url.encode(values);
  }
}
```

#### 민감 데이터 암호화
```dart
// ✅ 추가 암호화 레이어
import 'package:encrypt/encrypt.dart';

class EncryptionService {
  late final Key _key;
  late final IV _iv;
  late final Encrypter _encrypter;

  EncryptionService(String password) {
    _key = Key.fromUtf8(password.padRight(32, '0').substring(0, 32));
    _iv = IV.fromLength(16);
    _encrypter = Encrypter(AES(_key));
  }

  String encrypt(String plainText) {
    final encrypted = _encrypter.encrypt(plainText, iv: _iv);
    return encrypted.base64;
  }

  String decrypt(String encryptedText) {
    final encrypted = Encrypted.fromBase64(encryptedText);
    return _encrypter.decrypt(encrypted, iv: _iv);
  }
}
```

### 6.2 인증 및 권한 관리

```dart
// ✅ JWT 토큰 관리
class AuthService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: 'jwt_token');
  }

  Future<bool> isTokenValid() async {
    final token = await getToken();
    if (token == null) return false;

    try {
      final jwt = JWT.decode(token);
      final exp = jwt.payload['exp'] as int;
      return DateTime.now().millisecondsSinceEpoch < exp * 1000;
    } catch (e) {
      return false;
    }
  }
}
```

### 6.3 네트워크 보안

```dart
// ✅ SSL Pinning
import 'package:dio/dio.dart';
import 'package:dio/adapter.dart';

class ApiService {
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api.neuronova.com',
      connectTimeout: 5000,
      receiveTimeout: 3000,
    ));

    // SSL Pinning 설정
    (_dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate =
      (client) {
        client.badCertificateCallback =
          (X509Certificate cert, String host, int port) {
            // 인증서 핀닝 검증
            return cert.sha1.toString() == 'YOUR_CERTIFICATE_SHA1';
          };
        return client;
      };
  }
}
```

---

## 7. 성능 최적화

### 7.1 위젯 최적화

#### const 생성자 활용
```dart
// ✅ const 생성자 사용
class MyWidget extends StatelessWidget {
  const MyWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Text('제목'),
        SizedBox(height: 16),
        Text('내용'),
      ],
    );
  }
}
```

#### RepaintBoundary 사용
```dart
// ✅ 복잡한 위젯을 격리
Widget build(BuildContext context) {
  return Column(
    children: [
      RepaintBoundary(
        child: ComplexChart(data: chartData),
      ),
      SimpleList(items: items),
    ],
  );
}
```

### 7.2 리스트 최적화

#### ListView.builder 사용
```dart
// ✅ ListView.builder (지연 로딩)
ListView.builder(
  itemCount: patients.length,
  itemBuilder: (context, index) => PatientCard(
    patient: patients[index],
  ),
)

// ❌ ListView (모든 항목 한번에 생성)
ListView(
  children: patients.map((p) => PatientCard(patient: p)).toList(),
)
```

#### AutomaticKeepAliveClientMixin
```dart
// ✅ 스크롤 시 상태 유지
class PatientTab extends StatefulWidget {
  @override
  _PatientTabState createState() => _PatientTabState();
}

class _PatientTabState extends State<PatientTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // 필수!
    return PatientList();
  }
}
```

### 7.3 이미지 최적화

```dart
// ✅ 캐싱된 이미지 사용
import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: patient.profileImageUrl,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
  cacheManager: CacheManager(
    Config(
      'customCacheKey',
      stalePeriod: const Duration(days: 7),
      maxNrOfCacheObjects: 100,
    ),
  ),
)
```

### 7.4 데이터베이스 최적화

```dart
// ✅ 인덱스 생성
await db.execute(
  'CREATE INDEX idx_patients_name ON patients(name)'
);
await db.execute(
  'CREATE INDEX idx_assessments_patient_id ON assessments(patient_id)'
);

// ✅ 배치 작업
final batch = db.batch();
for (final patient in patients) {
  batch.insert('patients', patient.toMap());
}
await batch.commit(noResult: true);

// ✅ 페이지네이션
Future<List<Patient>> getPatients({int page = 0, int pageSize = 20}) async {
  final db = await database;
  final maps = await db.query(
    'patients',
    limit: pageSize,
    offset: page * pageSize,
    orderBy: 'created_at DESC',
  );
  return List.generate(maps.length, (i) => Patient.fromMap(maps[i]));
}
```

---

## 8. 에러 처리

### 8.1 전역 에러 핸들러

```dart
// ✅ main.dart에서 전역 에러 핸들링
void main() {
  // Flutter 프레임워크 에러 처리
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    // 로깅 서비스에 전송
    logError(details.exception, details.stack);
  };

  // Dart 에러 처리
  runZonedGuarded(() {
    runApp(MyApp());
  }, (error, stack) {
    logError(error, stack);
  });
}
```

### 8.2 API 에러 처리

```dart
// ✅ 구조화된 에러 처리
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiService {
  Future<T> handleRequest<T>(Future<Response> Function() request) async {
    try {
      final response = await request();

      if (response.statusCode == 200) {
        return response.data as T;
      } else if (response.statusCode == 401) {
        throw ApiException('인증이 필요합니다', 401);
      } else if (response.statusCode == 403) {
        throw ApiException('권한이 없습니다', 403);
      } else if (response.statusCode == 404) {
        throw ApiException('데이터를 찾을 수 없습니다', 404);
      } else {
        throw ApiException('서버 오류가 발생했습니다', response.statusCode);
      }
    } on DioError catch (e) {
      if (e.type == DioErrorType.connectTimeout) {
        throw ApiException('연결 시간이 초과되었습니다');
      } else if (e.type == DioErrorType.receiveTimeout) {
        throw ApiException('응답 시간이 초과되었습니다');
      } else if (e.type == DioErrorType.other) {
        throw ApiException('네트워크 연결을 확인해주세요');
      }
      rethrow;
    }
  }
}
```

### 8.3 UI 에러 처리

```dart
// ✅ ErrorWidget 커스터마이징
class CustomErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const CustomErrorWidget({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red),
          SizedBox(height: 16),
          Text(message),
          if (onRetry != null) ...[
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: Text('다시 시도'),
            ),
          ],
        ],
      ),
    );
  }
}

// ✅ Provider에서 에러 처리
class PatientProvider extends ChangeNotifier {
  Future<void> loadPatients() async {
    try {
      _setLoading(true);
      _patients = await _service.getPatients();
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = '알 수 없는 오류가 발생했습니다';
    } finally {
      _setLoading(false);
    }
  }
}
```

### 8.4 데이터베이스 에러 처리

```dart
// ✅ 데이터베이스 에러 처리
class PatientDao {
  Future<Patient?> getPatientById(int id) async {
    try {
      final db = await _dbService.database;
      final maps = await db.query(
        'patients',
        where: 'id = ?',
        whereArgs: [id],
      );

      if (maps.isEmpty) return null;
      return Patient.fromMap(maps.first);
    } on DatabaseException catch (e) {
      print('Database error: $e');
      rethrow;
    }
  }
}
```

---

## 9. 테스트 전략

### 9.1 단위 테스트 (Unit Test)

```dart
// test/models/patient_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Patient Model', () {
    test('fromJson creates valid Patient', () {
      final json = {
        'id': 1,
        'name': '홍길동',
        'birth_date': '1980-01-01',
      };

      final patient = Patient.fromJson(json);

      expect(patient.id, 1);
      expect(patient.name, '홍길동');
      expect(patient.birthDate, DateTime(1980, 1, 1));
    });

    test('toMap returns correct map', () {
      final patient = Patient(
        id: 1,
        name: '홍길동',
        birthDate: DateTime(1980, 1, 1),
      );

      final map = patient.toMap();

      expect(map['id'], 1);
      expect(map['name'], '홍길동');
      expect(map['birth_date'], '1980-01-01');
    });
  });
}
```

### 9.2 위젯 테스트 (Widget Test)

```dart
// test/widgets/patient_card_test.dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('PatientCard displays patient information', (tester) async {
    final patient = Patient(
      id: 1,
      name: '홍길동',
      birthDate: DateTime(1980, 1, 1),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PatientCard(patient: patient),
        ),
      ),
    );

    expect(find.text('홍길동'), findsOneWidget);
    expect(find.text('1980-01-01'), findsOneWidget);
  });
}
```

### 9.3 통합 테스트 (Integration Test)

```dart
// integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Login flow test', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // 로그인 페이지 확인
    expect(find.text('로그인'), findsOneWidget);

    // 사용자명 입력
    await tester.enterText(
      find.byKey(Key('username_field')),
      'testuser',
    );

    // 비밀번호 입력
    await tester.enterText(
      find.byKey(Key('password_field')),
      'password123',
    );

    // 로그인 버튼 클릭
    await tester.tap(find.byKey(Key('login_button')));
    await tester.pumpAndSettle();

    // 대시보드로 이동 확인
    expect(find.text('대시보드'), findsOneWidget);
  });
}
```

### 9.4 Mock 사용

```dart
// test/services/patient_service_test.dart
import 'package:mockito/mockito.dart';
import 'package:flutter_test/flutter_test.dart';

class MockHttpClient extends Mock implements HttpClient {}

void main() {
  group('PatientService', () {
    late PatientService service;
    late MockHttpClient mockClient;

    setUp(() {
      mockClient = MockHttpClient();
      service = PatientService(mockClient);
    });

    test('getPatients returns list of patients', () async {
      when(mockClient.get(any)).thenAnswer(
        (_) async => Response(
          data: [
            {'id': 1, 'name': '홍길동'},
            {'id': 2, 'name': '김철수'},
          ],
          statusCode: 200,
        ),
      );

      final patients = await service.getPatients();

      expect(patients.length, 2);
      expect(patients[0].name, '홍길동');
    });
  });
}
```

---

## 10. 접근성

### 10.1 Semantics 위젯

```dart
// ✅ Semantics 추가
Semantics(
  label: '환자 목록',
  child: ListView.builder(
    itemCount: patients.length,
    itemBuilder: (context, index) => Semantics(
      label: '환자: ${patients[index].name}',
      button: true,
      onTap: () => _onPatientTap(patients[index]),
      child: PatientCard(patient: patients[index]),
    ),
  ),
)
```

### 10.2 색상 대비

```dart
// ✅ WCAG 기준 준수
class AppColors {
  // 4.5:1 이상의 대비율
  static const primaryText = Color(0xFF212121);
  static const backgroundColor = Color(0xFFFFFFFF);

  // 3:1 이상의 대비율 (큰 텍스트)
  static const secondaryText = Color(0xFF757575);
}
```

### 10.3 포커스 관리

```dart
// ✅ 포커스 순서 관리
class LoginForm extends StatelessWidget {
  final FocusNode _usernameFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          focusNode: _usernameFocus,
          onSubmitted: (_) => _passwordFocus.requestFocus(),
        ),
        TextField(
          focusNode: _passwordFocus,
          onSubmitted: (_) => _handleLogin(),
        ),
      ],
    );
  }
}
```

### 10.4 스크린 리더 지원

```dart
// ✅ ExcludeSemantics로 장식 요소 제외
Row(
  children: [
    ExcludeSemantics(
      child: Icon(Icons.person), // 장식용 아이콘
    ),
    Text('홍길동'), // 실제 의미있는 텍스트
  ],
)
```

---

## 결론

이 가이드는 NeuroNova Flutter 애플리케이션의 설계 원칙과 베스트 프랙티스를 정리한 문서입니다.

### 핵심 원칙 요약

1. **위젯 조합**: 작은 위젯으로 분리하고 조합
2. **선언적 UI**: 상태의 함수로 UI 표현
3. **관심사 분리**: Models, Services, Providers, Screens 명확히 구분
4. **성능 최적화**: const 생성자, ListView.builder, RepaintBoundary 활용
5. **보안**: SQLCipher, SSL Pinning, Secure Storage 사용
6. **에러 처리**: 구조화된 에러 처리 및 사용자 피드백
7. **테스트**: 단위, 위젯, 통합 테스트 작성
8. **접근성**: Semantics, 색상 대비, 스크린 리더 지원

### 지속적 개선

- 새로운 Flutter 버전 업데이트 모니터링
- 성능 프로파일링 정기 실시
- 사용자 피드백 반영
- 코드 리뷰 및 리팩토링
- 보안 취약점 점검

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-06
**작성자**: NeuroNova Development Team
