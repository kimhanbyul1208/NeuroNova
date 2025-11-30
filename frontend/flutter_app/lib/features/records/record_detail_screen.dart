import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../core/services/bluetooth_service.dart';

/// 진료 내역 상세 화면
/// MRI 영상 뷰어 및 AI 분석 상세 결과 표시
class RecordDetailScreen extends StatefulWidget {
  final String recordId;

  const RecordDetailScreen({
    super.key,
    required this.recordId,
  });

  @override
  State<RecordDetailScreen> createState() => _RecordDetailScreenState();
}

class _RecordDetailScreenState extends State<RecordDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final BluetoothService _bluetoothService = BluetoothService();
  bool _isHospital = false;
  StreamSubscription? _bluetoothSubscription;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Bluetooth Monitoring
    _bluetoothSubscription = _bluetoothService.isHospital.listen((isHospital) {
      if (mounted) {
        setState(() {
          _isHospital = isHospital;
        });
      }
    });
    _bluetoothService.startScan();
  }

  @override
  void dispose() {
    _bluetoothService.stopScan();
    _bluetoothSubscription?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('상세 분석 결과'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '영상 뷰어', icon: Icon(Icons.image)),
            Tab(text: 'AI 분석', icon: Icon(Icons.analytics)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildViewerTab(),
          _buildAnalysisTab(),
        ],
      ),
    );
  }

  /// 탭 1: 영상 뷰어 (Center Panel 역할)
  Widget _buildViewerTab() {
    return Column(
      children: [
        // 툴바 (Zoom, Pan 등)
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          color: Colors.grey[200],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.zoom_in), tooltip: '확대'),
              IconButton(onPressed: () {}, icon: const Icon(Icons.zoom_out), tooltip: '축소'),
              IconButton(onPressed: () {}, icon: const Icon(Icons.contrast), tooltip: '대비'),
              IconButton(onPressed: () {}, icon: const Icon(Icons.layers), tooltip: 'AI 오버레이'),
            ],
          ),
        ),
        
        // 뷰어 영역 (Canvas Placeholder)
        Expanded(
          child: Container(
            color: Colors.black,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.image_not_supported, color: Colors.white54, size: 64),
                  const SizedBox(height: 16),
                  const Text(
                    'DICOM Viewer',
                    style: TextStyle(color: Colors.white54, fontSize: 20),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Record ID: ${widget.recordId}',
                    style: const TextStyle(color: Colors.white30),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        // 슬라이스 슬라이더
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[900],
          child: Row(
            children: [
              const Text('Slice', style: TextStyle(color: Colors.white)),
              Expanded(
                child: Slider(
                  value: 0.5,
                  onChanged: (v) {},
                  activeColor: Colors.blue,
                ),
              ),
              const Text('12/24', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
      ],
    );
  }

  /// 탭 2: AI 분석 결과 (Right Panel 역할)
  Widget _buildAnalysisTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. 종양 분류 결과
          _buildSectionTitle('종양 분류 (Tumor Classification)'),
          const SizedBox(height: 12),
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  const Text(
                    'Glioma (교종)',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                  const SizedBox(height: 8),
                  const Text('High Grade', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  LinearProgressIndicator(
                    value: 0.985,
                    backgroundColor: Colors.grey[200],
                    color: Colors.red,
                    minHeight: 10,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('확신도 (Confidence)'),
                      Text('98.5%', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 2. XAI 시각화 (설명)
          _buildSectionTitle('AI 분석 근거 (XAI)'),
          const SizedBox(height: 12),
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Grad-CAM Heatmap'),
                  const SizedBox(height: 12),
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(child: Text('Heatmap Image Placeholder')),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'AI는 좌측 측두엽 영역의 비정상적인 패턴을 주요 근거로 판단했습니다.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // 3. 액션 버튼 (블루투스 보안 적용)
          SizedBox(
            width: double.infinity,
            child: Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _isHospital 
                      ? () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('다운로드를 시작합니다...')),
                          );
                        } 
                      : null,
                  icon: const Icon(Icons.download),
                  label: const Text('분석 보고서 다운로드 (PDF)'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size(double.infinity, 50),
                    backgroundColor: _isHospital ? Colors.blue : Colors.grey,
                    foregroundColor: Colors.white,
                  ),
                ),
                if (!_isHospital)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      '병원 내에서만 다운로드 가능합니다.',
                      style: TextStyle(color: Colors.red[300], fontSize: 12),
                    ),
                  ),
                if (kIsWeb) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      _bluetoothService.setMockMode(true);
                      _bluetoothService.setMockHospitalPresence(!_isHospital);
                    },
                    child: Text(_isHospital ? '(개발용) 병원 위치 모의 해제' : '(개발용) 병원 위치 모의 설정'),
                  ),
                ],
                const SizedBox(height: 16),
                const Text(
                  '다운로드된 파일은 보안을 위해 90일 후 자동 삭제됩니다.',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
