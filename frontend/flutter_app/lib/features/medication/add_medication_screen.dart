import 'package:flutter/material.dart';
import '../../core/utils/logger.dart';
import '../../data/models/prescription_medication_model.dart';

/// 처방약 기록 화면
/// 수동 입력 또는 QR 스캔으로 처방약 정보 기록
class AddMedicationScreen extends StatefulWidget {
  const AddMedicationScreen({super.key});

  @override
  State<AddMedicationScreen> createState() => _AddMedicationScreenState();
}

class _AddMedicationScreenState extends State<AddMedicationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _medicationNameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _frequencyController = TextEditingController();
  final _prescribedByController = TextEditingController();
  final _instructionsController = TextEditingController();
  
  DateTime _prescribedDate = DateTime.now();
  DateTime? _startDate;
  DateTime? _endDate;
  String? _qrCode;

  @override
  void dispose() {
    _medicationNameController.dispose();
    _dosageController.dispose();
    _frequencyController.dispose();
    _prescribedByController.dispose();
    _instructionsController.dispose();
    super.dispose();
  }

  void _showInputMethodDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('처방약 기록 방법 선택'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.blue),
              title: const Text('수동 입력'),
              subtitle: const Text('직접 정보를 입력합니다'),
              onTap: () {
                Navigator.pop(context);
                _showManualInputForm();
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.qr_code_scanner, color: Colors.green),
              title: const Text('QR 스캔'),
              subtitle: const Text('약 봉투의 QR 코드를 스캔합니다'),
              onTap: () {
                Navigator.pop(context);
                _scanQRCode();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showManualInputForm() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('처방약 수동 입력'),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 약품명
                  TextFormField(
                    controller: _medicationNameController,
                    decoration: InputDecoration(
                      labelText: '약품명 *',
                      prefixIcon: const Icon(Icons.medication),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return '약품명을 입력하세요';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // 용량
                  TextFormField(
                    controller: _dosageController,
                    decoration: InputDecoration(
                      labelText: '용량 (예: 500mg)',
                      prefixIcon: const Icon(Icons.local_pharmacy),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 복용 빈도
                  TextFormField(
                    controller: _frequencyController,
                    decoration: InputDecoration(
                      labelText: '복용 빈도 (예: 하루 3회)',
                      prefixIcon: const Icon(Icons.schedule),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 처방 의사
                  TextFormField(
                    controller: _prescribedByController,
                    decoration: InputDecoration(
                      labelText: '처방 의사',
                      prefixIcon: const Icon(Icons.person),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 처방 날짜
                  ListTile(
                    title: const Text('처방 날짜'),
                    subtitle: Text('${_prescribedDate.year}년 ${_prescribedDate.month}월 ${_prescribedDate.day}일'),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _prescribedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (date != null) {
                        setState(() {
                          _prescribedDate = date;
                        });
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 복용 시작일
                  ListTile(
                    title: const Text('복용 시작일'),
                    subtitle: Text(_startDate != null 
                      ? '${_startDate!.year}년 ${_startDate!.month}월 ${_startDate!.day}일' 
                      : '선택하세요'),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _startDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2030),
                      );
                      if (date != null) {
                        setState(() {
                          _startDate = date;
                        });
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 복용 종료일
                  ListTile(
                    title: const Text('복용 종료일'),
                    subtitle: Text(_endDate != null 
                      ? '${_endDate!.year}년 ${_endDate!.month}월 ${_endDate!.day}일' 
                      : '선택하세요'),
                    trailing: const Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _endDate ?? DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2030),
                      );
                      if (date != null) {
                        setState(() {
                          _endDate = date;
                        });
                      }
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 복용 방법
                  TextFormField(
                    controller: _instructionsController,
                    decoration: InputDecoration(
                      labelText: '복용 방법 및 주의사항',
                      prefixIcon: const Icon(Icons.info_outline),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),

                  // 저장 버튼
                  ElevatedButton(
                    onPressed: _saveMedication,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      '저장',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _scanQRCode() {
    // TODO: Implement QR scanning
    // For now, show a placeholder
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('QR 스캐너 기능은 모바일 디바이스에서만 사용 가능합니다.'),
        duration: Duration(seconds: 3),
      ),
    );
    
    // Simulate QR scan result for demo
    AppLogger.info('QR Scanner would be activated here');
  }

  void _saveMedication() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final medication = PrescriptionMedicationModel(
      medicationName: _medicationNameController.text.trim(),
      dosage: _dosageController.text.trim().isEmpty ? null : _dosageController.text.trim(),
      frequency: _frequencyController.text.trim().isEmpty ? null : _frequencyController.text.trim(),
      prescribedBy: _prescribedByController.text.trim().isEmpty ? null : _prescribedByController.text.trim(),
      prescribedDate: _prescribedDate,
      startDate: _startDate,
      endDate: _endDate,
      instructions: _instructionsController.text.trim().isEmpty ? null : _instructionsController.text.trim(),
      qrCode: _qrCode,
    );

    // TODO: Save to database
    AppLogger.info('Medication saved: ${medication.toJson()}');
    
    Navigator.of(context).pop(); // Close form
    Navigator.of(context).pop(); // Return to home

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${medication.medicationName} 기록이 저장되었습니다'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // This screen is shown as a dialog, so we call the dialog immediately
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showInputMethodDialog();
    });

    return Container(); // Empty container as dialog handles UI
  }
}
