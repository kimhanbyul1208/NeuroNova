/// 처방약 모델
class PrescriptionMedicationModel {
  final int? id;
  final String medicationName;
  final String? dosage;
  final String? frequency;
  final String? prescribedBy;
  final DateTime prescribedDate;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? instructions;
  final String? qrCode;
  final DateTime createdAt;

  PrescriptionMedicationModel({
    this.id,
    required this.medicationName,
    this.dosage,
    this.frequency,
    this.prescribedBy,
    required this.prescribedDate,
    this.startDate,
    this.endDate,
    this.instructions,
    this.qrCode,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Convert to Map for database storage
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'medication_name': medicationName,
      'dosage': dosage,
      'frequency': frequency,
      'prescribed_by': prescribedBy,
      'prescribed_date': prescribedDate.toIso8601String(),
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'instructions': instructions,
      'qr_code': qrCode,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Create from Map
  factory PrescriptionMedicationModel.fromMap(Map<String, dynamic> map) {
    return PrescriptionMedicationModel(
      id: map['id'],
      medicationName: map['medication_name'],
      dosage: map['dosage'],
      frequency: map['frequency'],
      prescribedBy: map['prescribed_by'],
      prescribedDate: DateTime.parse(map['prescribed_date']),
      startDate: map['start_date'] != null ? DateTime.parse(map['start_date']) : null,
      endDate: map['end_date'] != null ? DateTime.parse(map['end_date']) : null,
      instructions: map['instructions'],
      qrCode: map['qr_code'],
      createdAt: DateTime.parse(map['created_at']),
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'medicationName': medicationName,
      'dosage': dosage,
      'frequency': frequency,
      'prescribedBy': prescribedBy,
      'prescribedDate': prescribedDate.toIso8601String(),
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'instructions': instructions,
      'qrCode': qrCode,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Create from JSON
  factory PrescriptionMedicationModel.fromJson(Map<String, dynamic> json) {
    return PrescriptionMedicationModel(
      id: json['id'],
      medicationName: json['medicationName'],
      dosage: json['dosage'],
      frequency: json['frequency'],
      prescribedBy: json['prescribedBy'],
      prescribedDate: DateTime.parse(json['prescribedDate']),
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      instructions: json['instructions'],
      qrCode: json['qrCode'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  /// Copy with
  PrescriptionMedicationModel copyWith({
    int? id,
    String? medicationName,
    String? dosage,
    String? frequency,
    String? prescribedBy,
    DateTime? prescribedDate,
    DateTime? startDate,
    DateTime? endDate,
    String? instructions,
    String? qrCode,
    DateTime? createdAt,
  }) {
    return PrescriptionMedicationModel(
      id: id ?? this.id,
      medicationName: medicationName ?? this.medicationName,
      dosage: dosage ?? this.dosage,
      frequency: frequency ?? this.frequency,
      prescribedBy: prescribedBy ?? this.prescribedBy,
      prescribedDate: prescribedDate ?? this.prescribedDate,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      instructions: instructions ?? this.instructions,
      qrCode: qrCode ?? this.qrCode,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
