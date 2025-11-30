import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class BluetoothService {
  // Singleton instance
  static final BluetoothService _instance = BluetoothService._internal();
  factory BluetoothService() => _instance;
  BluetoothService._internal();

  // Hospital Beacon UUID (Example UUID)
  static const String _hospitalBeaconUuid = "0000180f-0000-1000-8000-00805f9b34fb"; // Battery Service UUID for testing

  final _isHospitalController = StreamController<bool>.broadcast();
  Stream<bool> get isHospital => _isHospitalController.stream;

  bool _isMockMode = false;
  bool _mockIsHospital = false;

  // For Web/Testing: Toggle mock mode
  void setMockMode(bool enabled) {
    _isMockMode = enabled;
    if (!enabled) {
      _isHospitalController.add(false);
    }
  }

  // For Web/Testing: Toggle mock hospital presence
  void setMockHospitalPresence(bool isPresent) {
    if (_isMockMode) {
      _mockIsHospital = isPresent;
      _isHospitalController.add(isPresent);
    }
  }

  Future<void> startScan() async {
    if (kIsWeb || _isMockMode) {
      // Web doesn't support flutter_blue_plus fully or we are in mock mode
      print("BluetoothService: Running in Mock Mode (Web/Test)");
      return;
    }

    // Request permissions
    if (await Permission.bluetoothScan.request().isGranted &&
        await Permission.bluetoothConnect.request().isGranted) {
      
      // Listen to scan results
      FlutterBluePlus.scanResults.listen((results) {
        bool found = false;
        for (ScanResult r in results) {
          // Check for specific service UUID or name
          if (r.advertisementData.serviceUuids.contains(Guid(_hospitalBeaconUuid)) ||
              r.device.platformName.contains("NeuroNova Beacon")) {
            found = true;
            break;
          }
        }
        _isHospitalController.add(found);
      });

      // Start scanning
      try {
        await FlutterBluePlus.startScan(
          withServices: [Guid(_hospitalBeaconUuid)],
          timeout: const Duration(seconds: 15),
        );
      } catch (e) {
        print("Bluetooth Scan Error: $e");
      }
    } else {
      print("Bluetooth permissions denied");
    }
  }

  Future<void> stopScan() async {
    if (!kIsWeb && !_isMockMode) {
      await FlutterBluePlus.stopScan();
    }
  }
}
