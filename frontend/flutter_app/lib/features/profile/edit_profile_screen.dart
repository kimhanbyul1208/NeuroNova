import 'package:flutter/material.dart';
import '../../data/repositories/auth_repository.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic>? userInfo;

  const EditProfileScreen({super.key, this.userInfo});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final AuthRepository _authRepository = AuthRepository();
  
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _phoneController;
  late TextEditingController _passportController; // Added
  
  bool _isSaving = false;
  bool _isForeigner = false; // Added

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.userInfo?['first_name'] ?? '');
    _lastNameController = TextEditingController(text: widget.userInfo?['last_name'] ?? '');
    _phoneController = TextEditingController(text: widget.userInfo?['phone_number'] ?? '');
    
    // Initialize Foreigner state
    _isForeigner = widget.userInfo?['is_foreigner'] ?? false;
    _passportController = TextEditingController(text: widget.userInfo?['passport_number'] ?? '');
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _passportController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final updatedData = {
        'first_name': _firstNameController.text,
        'last_name': _lastNameController.text,
        'is_foreigner': _isForeigner,
        'phone_number': _phoneController.text.isNotEmpty ? _phoneController.text : null,
        'passport_number': _passportController.text.isNotEmpty ? _passportController.text : null,
      };

      final response = await _authRepository.updateProfile(updatedData);

      if (mounted) {
        String message = '프로필이 업데이트되었습니다.';
        if (response['new_token'] != null) {
          message += '\n(새로운 ID로 로그인 상태가 갱신되었습니다)';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
        Navigator.pop(context, true); 
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('업데이트 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 수정'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
               // Foreigner Toggle
              SwitchListTile(
                title: const Text('외국인 여부 (Is Foreigner)'),
                subtitle: const Text('체크 시 여권번호를 필수로 입력해야 합니다.'),
                value: _isForeigner,
                onChanged: (bool value) {
                  setState(() {
                    _isForeigner = value;
                  });
                },
              ),
              const Divider(),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  labelText: '성 (Last Name)',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '성을 입력해주세요.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _firstNameController,
                decoration: const InputDecoration(
                  labelText: '이름 (First Name)',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '이름을 입력해주세요.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              // Conditional Fields
              if (_isForeigner) ...[
                TextFormField(
                  controller: _passportController,
                  decoration: const InputDecoration(
                    labelText: '여권번호 (Passport Number)',
                    hintText: 'M12345678',
                    border: OutlineInputBorder(),
                    helperText: '로그인 ID로 사용됩니다.',
                  ),
                  validator: (value) {
                    if (_isForeigner && (value == null || value.isEmpty)) {
                      return '외국인은 여권번호가 필수입니다.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: '전화번호 (선택)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                ),
              ] else ...[
                 TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: '전화번호',
                    hintText: '010-1234-5678',
                    border: OutlineInputBorder(),
                    helperText: '로그인 ID로 사용됩니다.',
                  ),
                  keyboardType: TextInputType.phone,
                  validator: (value) {
                    if (!_isForeigner && (value == null || value.isEmpty)) {
                      return '내국인은 전화번호가 필수입니다.';
                    }
                    return null;
                  },
                ),
              ],
              
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isSaving ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('저장하기'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
