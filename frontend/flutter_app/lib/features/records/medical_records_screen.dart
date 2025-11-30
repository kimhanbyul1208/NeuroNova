import 'package:flutter/material.dart';
import '../../core/utils/logger.dart';

/// 진료 내역 화면
/// 환자의 MRI 시리즈 목록 및 AI 분석 결과 요약 표시
class MedicalRecordsScreen extends StatefulWidget {
  const MedicalRecordsScreen({super.key});

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  // 더미 데이터: MRI 시리즈 목록
  final List<Map<String, dynamic>> _records = [
    {
      'id': '1',
      'date': '2025-11-28',
      'modality': 'MRI',
      'description': 'Brain Tumor Protocol',
      'seriesCount': 4,
      'aiStatus': 'COMPLETED',
      'aiResult': 'High Probability (98.5%)',
      'thumbnail': 'assets/images/mri_thumb_1.png', // Placeholder
    },
    {
      'id': '2',
      'date': '2025-10-15',
      'modality': 'MRI',
      'description': 'Routine Brain Checkup',
      'seriesCount': 3,
      'aiStatus': 'COMPLETED',
      'aiResult': 'Normal',
      'thumbnail': 'assets/images/mri_thumb_2.png', // Placeholder
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('진료 내역'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _records.length,
        itemBuilder: (context, index) {
          final record = _records[index];
          return _buildRecordCard(record);
        },
      ),
    );
  }

  Widget _buildRecordCard(Map<String, dynamic> record) {
    final isHighRisk = record['aiResult'].toString().contains('High');
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to detail screen
          Navigator.pushNamed(
            context, 
            '/record-detail',
            arguments: record['id'],
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 썸네일 (Placeholder)
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.image, color: Colors.grey),
                  ),
                  const SizedBox(width: 16),
                  
                  // 정보
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          record['description'],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${record['date']} • ${record['modality']}',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Series: ${record['seriesCount']}',
                            style: const TextStyle(
                              color: Colors.blue,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              
              // AI 분석 결과 요약
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'AI 분석 결과',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isHighRisk ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isHighRisk ? Icons.warning : Icons.check_circle,
                          size: 16,
                          color: isHighRisk ? Colors.red : Colors.green,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          record['aiResult'],
                          style: TextStyle(
                            color: isHighRisk ? Colors.red : Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
