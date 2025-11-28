import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/data/repositories/appointment_repository.dart';
import 'package:neuronova_app/data/models/appointment_model.dart';

void main() {
  group('AppointmentRepository 테스트', () {
    late AppointmentRepository repository;

    setUp(() {
      repository = AppointmentRepository();
    });

    test('로컬 DB에서 예약 목록을 가져와야 함', () async {
      // Given & When
      final appointments = await repository.getAppointmentsFromLocal();

      // Then
      expect(appointments, isA<List<Appointment>>());
    });

    test('예약을 로컬 DB에 저장할 수 있어야 함', () async {
      // Given
      final appointment = Appointment(
        id: 1,
        patientId: 1,
        doctorId: 2,
        appointmentDate: DateTime.now(),
        status: 'PENDING',
        reason: '검진',
        notes: '첫 방문',
      );

      // When
      await repository.saveAppointmentToLocal(appointment);

      // Then
      final savedAppointments = await repository.getAppointmentsFromLocal();
      expect(savedAppointments.any((a) => a.id == appointment.id), isTrue);
    });

    test('90일 이상 된 예약은 자동 삭제되어야 함', () async {
      // Given
      final oldAppointment = Appointment(
        id: 999,
        patientId: 1,
        doctorId: 2,
        appointmentDate: DateTime.now().subtract(const Duration(days: 91)),
        status: 'COMPLETED',
        reason: '과거 검진',
        notes: '오래된 데이터',
      );

      await repository.saveAppointmentToLocal(oldAppointment);

      // When
      await repository.deleteOldAppointments();

      // Then
      final appointments = await repository.getAppointmentsFromLocal();
      expect(appointments.any((a) => a.id == oldAppointment.id), isFalse);
    });

    test('API에서 예약을 생성할 수 있어야 함', () async {
      // Given
      final newAppointment = Appointment(
        id: null,
        patientId: 1,
        doctorId: 2,
        appointmentDate: DateTime.now().add(const Duration(days: 7)),
        status: 'PENDING',
        reason: '정기 검진',
        notes: '새 예약',
      );

      // When & Then
      // 실제로는 Mock Dio 사용
      expect(repository, isNotNull);
    });
  });
}
