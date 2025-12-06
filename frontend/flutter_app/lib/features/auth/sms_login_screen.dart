import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../data/repositories/auth_repository.dart';
import '../../core/utils/logger.dart';

/// SMS 로그인 화면
/// 전화번호 입력 → 인증 코드 요청 → 코드 입력 → 로그인
class SmsLoginScreen extends StatefulWidget {
  const SmsLoginScreen({super.key});

  @override
  State<SmsLoginScreen> createState() => _SmsLoginScreenState();
}

class _SmsLoginScreenState extends State<SmsLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();

  bool _isLoading = false;
  bool _codeSent = false;
  String? _errorMessage;
  int _remainingSeconds = 0;
  Timer? _timer;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  /// 전화번호 정규화 (하이픈 제거)
  String _normalizePhone(String phone) {
    return phone.replaceAll(RegExp(r'[^0-9]'), '');
  }

  /// 전화번호 포맷팅 (010-1234-5678)
  String _formatPhone(String phone) {
    final normalized = _normalizePhone(phone);
    if (normalized.length == 11) {
      return '${normalized.substring(0, 3)}-${normalized.substring(3, 7)}-${normalized.substring(7)}';
    } else if (normalized.length == 10) {
      return '${normalized.substring(0, 3)}-${normalized.substring(3, 6)}-${normalized.substring(6)}';
    }
    return normalized;
  }

  /// SMS 인증 코드 요청
  Future<void> _requestSmsCode() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authRepo = AuthRepository();
      final phone = _formatPhone(_phoneController.text.trim());
      final expiresIn = await authRepo.requestSmsCode(phone);

      if (mounted) {
        setState(() {
          _codeSent = true;
          _remainingSeconds = expiresIn;
        });
        _startTimer();
        AppLogger.info('SMS code requested: $phone');
      }
    } catch (e) {
      AppLogger.error('SMS request failed: $e');
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  /// 타이머 시작
  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        setState(() {
          _codeSent = false;
        });
      }
    });
  }

  /// SMS 인증 및 로그인
  Future<void> _verifySmsAndLogin() async {
    if (_codeController.text.trim().length != 6) {
      setState(() {
        _errorMessage = '인증 코드 6자리를 입력하세요';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authRepo = AuthRepository();
      final phone = _formatPhone(_phoneController.text.trim());
      final code = _codeController.text.trim();

      final result = await authRepo.verifySmsAndLogin(phone, code);

      if (mounted) {
        final isFirstLogin = result['is_first_login'] ?? false;

        if (isFirstLogin) {
          // 첫 로그인 - 비밀번호 변경 화면으로
          Navigator.of(context).pushReplacementNamed(
            '/change-password',
            arguments: {'forceChange': true},
          );
        } else {
          // 홈 화면으로
          Navigator.of(context).pushReplacementNamed('/home');
        }
      }
    } catch (e) {
      AppLogger.error('SMS login failed: $e');
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  /// 남은 시간 포맷 (mm:ss)
  String get _timerDisplay {
    final minutes = _remainingSeconds ~/ 60;
    final seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('SMS 로그인'),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Theme.of(context).primaryColor),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 아이콘
                  Icon(
                    Icons.sms,
                    size: 80,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(height: 16),

                  // 제목
                  Text(
                    'SMS 인증 로그인',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).primaryColor,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '병원에서 등록한 전화번호로 로그인하세요',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),

                  // 에러 메시지
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red[300]!),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: Colors.red[700]),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: TextStyle(color: Colors.red[700]),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // 전화번호 입력
                  TextFormField(
                    controller: _phoneController,
                    decoration: InputDecoration(
                      labelText: '전화번호',
                      hintText: '010-1234-5678',
                      prefixIcon: const Icon(Icons.phone),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9-]')),
                      LengthLimitingTextInputFormatter(13),
                    ],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return '전화번호를 입력하세요';
                      }
                      final normalized = _normalizePhone(value);
                      if (normalized.length < 10 || normalized.length > 11) {
                        return '올바른 전화번호를 입력하세요';
                      }
                      return null;
                    },
                    enabled: !_isLoading && !_codeSent,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _codeSent ? null : _requestSmsCode(),
                  ),
                  const SizedBox(height: 16),

                  // 인증 코드 요청 버튼
                  if (!_codeSent)
                    ElevatedButton(
                      onPressed: _isLoading ? null : _requestSmsCode,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              '인증 코드 요청',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),

                  // 인증 코드 입력 및 로그인
                  if (_codeSent) ...[
                    // 타이머
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.timer,
                            color: Theme.of(context).primaryColor,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '남은 시간: $_timerDisplay',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 인증 코드 입력
                    TextFormField(
                      controller: _codeController,
                      decoration: InputDecoration(
                        labelText: '인증 코드',
                        hintText: '6자리 숫자',
                        prefixIcon: const Icon(Icons.pin),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: Colors.grey[50],
                      ),
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(6),
                      ],
                      enabled: !_isLoading,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _verifySmsAndLogin(),
                      autofocus: true,
                    ),
                    const SizedBox(height: 16),

                    // 로그인 버튼
                    ElevatedButton(
                      onPressed: _isLoading ? null : _verifySmsAndLogin,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              '로그인',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                    const SizedBox(height: 16),

                    // 재요청 버튼
                    TextButton(
                      onPressed: _isLoading
                          ? null
                          : () {
                              setState(() {
                                _codeSent = false;
                                _codeController.clear();
                                _timer?.cancel();
                              });
                            },
                      child: const Text('다시 요청하기'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
