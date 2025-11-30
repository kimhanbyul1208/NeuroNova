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
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.userInfo?['first_name'] ?? '');
    _lastNameController = TextEditingController(text: widget.userInfo?['last_name'] ?? '');
    _phoneController = TextEditingController(text: widget.userInfo?['phone_number'] ?? '');
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
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
        'phone_number': _phoneController.text,
      };

      await _authRepository.updateProfile(updatedData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('프로필이 업데이트되었습니다.')),
        );
        Navigator.pop(context, true); // Return true to indicate update
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
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(labelText: '성'),
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
                decoration: const InputDecoration(labelText: '이름'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '이름을 입력해주세요.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: '전화번호'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isSaving ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('저장'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
