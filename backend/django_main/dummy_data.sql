-- ============================================================================
-- NeuroNova Dummy Data Generation Script
-- Created: 2025-11-29
-- Description: Complete dummy data for all tables (minimum 5 rows each)
-- ============================================================================

-- Disable foreign key checks for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. AUTH_USER (Django default user table)
-- ============================================================================
-- Role distribution: ADMIN(5), DOCTOR(5), NURSE(5), PATIENT(5) = Total 20 users

INSERT INTO auth_user (id, username, password, email, first_name, last_name, is_staff, is_active, is_superuser, date_joined, last_login) VALUES
-- ADMIN users (1-5)
(1, 'admin1', 'pbkdf2_sha256$600000$salt1$hash1', 'admin1@neuronova.com', 'Admin', 'One', 1, 1, 1, '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(2, 'admin2', 'pbkdf2_sha256$600000$salt2$hash2', 'admin2@neuronova.com', 'Admin', 'Two', 1, 1, 1, '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(3, 'admin3', 'pbkdf2_sha256$600000$salt3$hash3', 'admin3@neuronova.com', 'Admin', 'Three', 1, 1, 0, '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(4, 'admin4', 'pbkdf2_sha256$600000$salt4$hash4', 'admin4@neuronova.com', 'Admin', 'Four', 1, 1, 0, '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(5, 'admin5', 'pbkdf2_sha256$600000$salt5$hash5', 'admin5@neuronova.com', 'Admin', 'Five', 1, 1, 0, '2025-01-01 09:00:00', '2025-11-29 09:00:00'),

-- DOCTOR users (6-10)
(6, 'doctor1', 'pbkdf2_sha256$600000$salt6$hash6', 'doctor1@neuronova.com', '김', '신경', 0, 1, 0, '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(7, 'doctor2', 'pbkdf2_sha256$600000$salt7$hash7', 'doctor2@neuronova.com', '이', '뇌외', 0, 1, 0, '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(8, 'doctor3', 'pbkdf2_sha256$600000$salt8$hash8', 'doctor3@neuronova.com', '박', '영상', 0, 1, 0, '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(9, 'doctor4', 'pbkdf2_sha256$600000$salt9$hash9', 'doctor4@neuronova.com', '정', '종양', 0, 1, 0, '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(10, 'doctor5', 'pbkdf2_sha256$600000$salt10$hash10', 'doctor5@neuronova.com', '최', '재활', 0, 1, 0, '2025-01-05 09:00:00', '2025-11-29 10:00:00'),

-- NURSE users (11-15)
(11, 'nurse1', 'pbkdf2_sha256$600000$salt11$hash11', 'nurse1@neuronova.com', '강', '수진', 0, 1, 0, '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(12, 'nurse2', 'pbkdf2_sha256$600000$salt12$hash12', 'nurse2@neuronova.com', '윤', '미영', 0, 1, 0, '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(13, 'nurse3', 'pbkdf2_sha256$600000$salt13$hash13', 'nurse3@neuronova.com', '조', '은희', 0, 1, 0, '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(14, 'nurse4', 'pbkdf2_sha256$600000$salt14$hash14', 'nurse4@neuronova.com', '한', '지영', 0, 1, 0, '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(15, 'nurse5', 'pbkdf2_sha256$600000$salt15$hash15', 'nurse5@neuronova.com', '임', '소연', 0, 1, 0, '2025-01-10 09:00:00', '2025-11-29 08:00:00'),

-- PATIENT users (16-20)
(16, 'patient1', 'pbkdf2_sha256$600000$salt16$hash16', 'patient1@example.com', '환자', '일호', 0, 1, 0, '2025-02-01 10:00:00', '2025-11-29 11:00:00'),
(17, 'patient2', 'pbkdf2_sha256$600000$salt17$hash17', 'patient2@example.com', '환자', '이호', 0, 1, 0, '2025-02-05 10:00:00', '2025-11-29 11:00:00'),
(18, 'patient3', 'pbkdf2_sha256$600000$salt18$hash18', 'patient3@example.com', '환자', '삼호', 0, 1, 0, '2025-02-10 10:00:00', '2025-11-29 11:00:00'),
(19, 'patient4', 'pbkdf2_sha256$600000$salt19$hash19', 'patient4@example.com', '환자', '사호', 0, 1, 0, '2025-02-15 10:00:00', '2025-11-29 11:00:00'),
(20, 'patient5', 'pbkdf2_sha256$600000$salt20$hash20', 'patient5@example.com', '환자', '오호', 0, 1, 0, '2025-02-20 10:00:00', '2025-11-29 11:00:00');

-- ============================================================================
-- 2. USER_PROFILE (Extended user profile)
-- ============================================================================

INSERT INTO user_profile (id, user_id, role, phone_number, profile_image, fcm_token, bio, created_at, updated_at) VALUES
-- ADMIN profiles (1-5)
(1, 1, 'ADMIN', '010-1000-0001', '', 'fcm_token_admin1', '시스템 관리자', '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(2, 2, 'ADMIN', '010-1000-0002', '', 'fcm_token_admin2', '시스템 관리자', '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(3, 3, 'ADMIN', '010-1000-0003', '', 'fcm_token_admin3', '시스템 관리자', '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(4, 4, 'ADMIN', '010-1000-0004', '', 'fcm_token_admin4', '시스템 관리자', '2025-01-01 09:00:00', '2025-11-29 09:00:00'),
(5, 5, 'ADMIN', '010-1000-0005', '', 'fcm_token_admin5', '시스템 관리자', '2025-01-01 09:00:00', '2025-11-29 09:00:00'),

-- DOCTOR profiles (6-10)
(6, 6, 'DOCTOR', '010-2000-0001', '', 'fcm_token_doctor1', '신경과 전문의, 15년 경력', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(7, 7, 'DOCTOR', '010-2000-0002', '', 'fcm_token_doctor2', '뇌신경외과 전문의, 12년 경력', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(8, 8, 'DOCTOR', '010-2000-0003', '', 'fcm_token_doctor3', '영상의학과 전문의, 10년 경력', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(9, 9, 'DOCTOR', '010-2000-0004', '', 'fcm_token_doctor4', '종양내과 전문의, 8년 경력', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(10, 10, 'DOCTOR', '010-2000-0005', '', 'fcm_token_doctor5', '재활의학과 전문의, 7년 경력', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),

-- NURSE profiles (11-15)
(11, 11, 'NURSE', '010-3000-0001', '', 'fcm_token_nurse1', '신경외과 수간호사', '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(12, 12, 'NURSE', '010-3000-0002', '', 'fcm_token_nurse2', '외래 간호사', '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(13, 13, 'NURSE', '010-3000-0003', '', 'fcm_token_nurse3', '검사실 간호사', '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(14, 14, 'NURSE', '010-3000-0004', '', 'fcm_token_nurse4', '병동 간호사', '2025-01-10 09:00:00', '2025-11-29 08:00:00'),
(15, 15, 'NURSE', '010-3000-0005', '', 'fcm_token_nurse5', '응급실 간호사', '2025-01-10 09:00:00', '2025-11-29 08:00:00'),

-- PATIENT profiles (16-20)
(16, 16, 'PATIENT', '010-4000-0001', '', 'fcm_token_patient1', '', '2025-02-01 10:00:00', '2025-11-29 11:00:00'),
(17, 17, 'PATIENT', '010-4000-0002', '', 'fcm_token_patient2', '', '2025-02-05 10:00:00', '2025-11-29 11:00:00'),
(18, 18, 'PATIENT', '010-4000-0003', '', 'fcm_token_patient3', '', '2025-02-10 10:00:00', '2025-11-29 11:00:00'),
(19, 19, 'PATIENT', '010-4000-0004', '', 'fcm_token_patient4', '', '2025-02-15 10:00:00', '2025-11-29 11:00:00'),
(20, 20, 'PATIENT', '010-4000-0005', '', 'fcm_token_patient5', '', '2025-02-20 10:00:00', '2025-11-29 11:00:00');

-- ============================================================================
-- 3. CUSTOM_DOCTOR (Doctor detailed info)
-- ============================================================================

INSERT INTO custom_doctor (id, user_id, license_number, specialty, department, bio, created_at, updated_at) VALUES
(1, 6, 'DOC-2010-12345', 'Neurology', '신경과', '서울대 의대 졸업, 뇌종양 진단 전문', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(2, 7, 'DOC-2013-23456', 'Neurosurgery', '뇌신경외과', '연세대 의대 졸업, 뇌종양 수술 전문', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(3, 8, 'DOC-2015-34567', 'Radiology', '영상의학과', '가톨릭대 의대 졸업, MRI/CT 판독 전문', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(4, 9, 'DOC-2017-45678', 'Oncology', '종양내과', '고려대 의대 졸업, 항암치료 전문', '2025-01-05 09:00:00', '2025-11-29 10:00:00'),
(5, 10, 'DOC-2018-56789', 'Rehabilitation', '재활의학과', '성균관대 의대 졸업, 신경재활 전문', '2025-01-05 09:00:00', '2025-11-29 10:00:00');

-- ============================================================================
-- 4. EMR_PATIENT (Patient medical info)
-- ============================================================================

INSERT INTO emr_patient (id, user_id, pid, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_id, emergency_contact, created_at, updated_at) VALUES
(1, 16, 'PT-2025-1001', '일호', '환자', '1970-03-15', 'M', '010-4000-0001', 'patient1@example.com', '서울시 강남구 테헤란로 123', 'INS-2025-0001', '010-5000-0001', '2025-02-01 10:00:00', '2025-11-29 11:00:00'),
(2, 17, 'PT-2025-1002', '이호', '환자', '1975-07-22', 'F', '010-4000-0002', 'patient2@example.com', '서울시 서초구 서초대로 456', 'INS-2025-0002', '010-5000-0002', '2025-02-05 10:00:00', '2025-11-29 11:00:00'),
(3, 18, 'PT-2025-1003', '삼호', '환자', '1982-11-08', 'M', '010-4000-0003', 'patient3@example.com', '서울시 송파구 올림픽로 789', 'INS-2025-0003', '010-5000-0003', '2025-02-10 10:00:00', '2025-11-29 11:00:00'),
(4, 19, 'PT-2025-1004', '사호', '환자', '1988-05-30', 'F', '010-4000-0004', 'patient4@example.com', '서울시 강동구 천호대로 321', 'INS-2025-0004', '010-5000-0004', '2025-02-15 10:00:00', '2025-11-29 11:00:00'),
(5, 20, 'PT-2025-1005', '오호', '환자', '1995-12-12', 'M', '010-4000-0005', 'patient5@example.com', '서울시 광진구 능동로 654', 'INS-2025-0005', '010-5000-0005', '2025-02-20 10:00:00', '2025-11-29 11:00:00');

-- ============================================================================
-- 5. AUTH_GROUP (User groups)
-- ============================================================================

INSERT INTO auth_group (id, name) VALUES
(1, 'Administrators'),
(2, 'Doctors'),
(3, 'Nurses'),
(4, 'Patients'),
(5, 'Radiologists');

-- ============================================================================
-- 6. DJANGO_CONTENT_TYPE (Content types for permissions)
-- ============================================================================

INSERT INTO django_content_type (id, app_label, model) VALUES
(1, 'auth', 'user'),
(2, 'auth', 'group'),
(3, 'auth', 'permission'),
(4, 'users', 'userprofile'),
(5, 'custom', 'doctor'),
(6, 'emr', 'patient'),
(7, 'emr', 'encounter'),
(8, 'custom', 'appointment');

-- ============================================================================
-- 7. AUTH_PERMISSION (Permissions)
-- ============================================================================

INSERT INTO auth_permission (id, name, content_type_id, codename) VALUES
(1, 'Can add user', 1, 'add_user'),
(2, 'Can change user', 1, 'change_user'),
(3, 'Can delete user', 1, 'delete_user'),
(4, 'Can view user', 1, 'view_user'),
(5, 'Can add patient', 6, 'add_patient'),
(6, 'Can change patient', 6, 'change_patient'),
(7, 'Can delete patient', 6, 'delete_patient'),
(8, 'Can view patient', 6, 'view_patient');

-- ============================================================================
-- 8. AUTH_GROUP_PERMISSIONS (Group-Permission mapping)
-- ============================================================================

INSERT INTO auth_group_permissions (id, group_id, permission_id) VALUES
(1, 1, 1),  -- Admins can add users
(2, 1, 2),  -- Admins can change users
(3, 1, 3),  -- Admins can delete users
(4, 1, 4),  -- Admins can view users
(5, 2, 5),  -- Doctors can add patients
(6, 2, 6),  -- Doctors can change patients
(7, 2, 8);  -- Doctors can view patients

-- ============================================================================
-- 9. AUTH_USER_GROUPS (User-Group mapping)
-- ============================================================================

INSERT INTO auth_user_groups (id, user_id, group_id) VALUES
(1, 1, 1),   -- admin1 -> Administrators
(2, 2, 1),   -- admin2 -> Administrators
(3, 6, 2),   -- doctor1 -> Doctors
(4, 7, 2),   -- doctor2 -> Doctors
(5, 8, 2),   -- doctor3 -> Doctors
(6, 11, 3),  -- nurse1 -> Nurses
(7, 12, 3);  -- nurse2 -> Nurses

-- ============================================================================
-- 10. AUTH_USER_USER_PERMISSIONS (User-specific permissions)
-- ============================================================================

INSERT INTO auth_user_user_permissions (id, user_id, permission_id) VALUES
(1, 1, 1),  -- admin1 can add users
(2, 1, 2),  -- admin1 can change users
(3, 6, 5),  -- doctor1 can add patients
(4, 7, 5),  -- doctor2 can add patients
(5, 8, 8);  -- doctor3 can view patients

-- ============================================================================
-- 11. CUSTOM_PATIENT_DOCTOR (Patient-Doctor relationship mapping)
-- ============================================================================
-- 의사 1 → 환자 1,2
-- 의사 2 → 환자 2,3
-- 의사 3 → 환자 1,2,3
-- 의사 4 → 환자 4
-- 의사 5 → 환자 5

INSERT INTO custom_patient_doctor (id, patient_id, doctor_id, is_primary, assigned_date, created_at, updated_at) VALUES
(1, 1, 1, 1, '2025-02-01', '2025-02-01 10:00:00', '2025-11-29 10:00:00'),  -- Patient1 - Doctor1 (primary)
(2, 2, 1, 1, '2025-02-05', '2025-02-05 10:00:00', '2025-11-29 10:00:00'),  -- Patient2 - Doctor1 (primary)
(3, 2, 2, 0, '2025-02-06', '2025-02-06 10:00:00', '2025-11-29 10:00:00'),  -- Patient2 - Doctor2 (협진)
(4, 3, 2, 1, '2025-02-10', '2025-02-10 10:00:00', '2025-11-29 10:00:00'),  -- Patient3 - Doctor2 (primary)
(5, 1, 3, 0, '2025-02-11', '2025-02-11 10:00:00', '2025-11-29 10:00:00'),  -- Patient1 - Doctor3 (협진)
(6, 2, 3, 0, '2025-02-12', '2025-02-12 10:00:00', '2025-11-29 10:00:00'),  -- Patient2 - Doctor3 (협진)
(7, 3, 3, 0, '2025-02-13', '2025-02-13 10:00:00', '2025-11-29 10:00:00'),  -- Patient3 - Doctor3 (협진)
(8, 4, 4, 1, '2025-02-15', '2025-02-15 10:00:00', '2025-11-29 10:00:00'),  -- Patient4 - Doctor4 (primary)
(9, 5, 5, 1, '2025-02-20', '2025-02-20 10:00:00', '2025-11-29 10:00:00');  -- Patient5 - Doctor5 (primary)

-- ============================================================================
-- 12. EMR_ENCOUNTER (Encounter/진료 기록)
-- ============================================================================
-- 각 환자별 최소 1개, 총 8개 encounter 생성

INSERT INTO emr_encounter (id, patient_id, doctor_id, encounter_date, reason, facility, status, created_at, updated_at) VALUES
(1, 1, 6, '2025-03-01 10:00:00', '두통 및 어지러움 지속', '신경과 외래', 'COMPLETED', '2025-03-01 10:00:00', '2025-03-01 11:00:00'),
(2, 2, 6, '2025-03-05 14:00:00', '시야 장애 및 두통', '신경과 외래', 'COMPLETED', '2025-03-05 14:00:00', '2025-03-05 15:00:00'),
(3, 3, 7, '2025-03-10 09:00:00', 'MRI 검사 후 진단 상담', '뇌신경외과 외래', 'COMPLETED', '2025-03-10 09:00:00', '2025-03-10 10:00:00'),
(4, 4, 9, '2025-03-15 11:00:00', '종양 치료 계획 수립', '종양내과 외래', 'COMPLETED', '2025-03-15 11:00:00', '2025-03-15 12:00:00'),
(5, 5, 10, '2025-03-20 15:00:00', '수술 후 재활 평가', '재활의학과 외래', 'COMPLETED', '2025-03-20 15:00:00', '2025-03-20 16:00:00'),
(6, 1, 6, '2025-04-01 10:00:00', '추적 검사 및 경과 관찰', '신경과 외래', 'COMPLETED', '2025-04-01 10:00:00', '2025-04-01 11:00:00'),
(7, 2, 7, '2025-04-05 14:00:00', '수술 전 평가', '뇌신경외과 외래', 'IN_PROGRESS', '2025-04-05 14:00:00', '2025-04-05 14:00:00'),
(8, 3, 7, '2025-04-10 09:00:00', '수술 후 경과 확인', '뇌신경외과 외래', 'SCHEDULED', '2025-04-10 09:00:00', '2025-04-10 09:00:00');

-- ============================================================================
-- 13. CUSTOM_APPOINTMENT (Appointments)
-- ============================================================================
-- 각 encounter당 1개씩 생성 (8개)

INSERT INTO custom_appointment (id, patient_id, doctor_id, scheduled_at, duration_minutes, status, visit_type, reason, created_by, notes, created_at, updated_at) VALUES
(1, 1, 1, '2025-05-01 10:00:00', 30, 'CONFIRMED', 'FOLLOW_UP', '정기 검진', 'PATIENT_APP', '환자 상태 양호', '2025-04-25 10:00:00', '2025-04-25 10:00:00'),
(2, 2, 1, '2025-05-05 14:00:00', 30, 'CONFIRMED', 'FOLLOW_UP', 'MRI 결과 상담', 'PATIENT_APP', 'MRI 결과 검토 필요', '2025-04-28 14:00:00', '2025-04-28 14:00:00'),
(3, 3, 2, '2025-05-10 09:00:00', 45, 'CONFIRMED', 'CHECK_UP', '수술 전 검사', 'DOCTOR_WEB', '수술 계획 논의', '2025-05-01 09:00:00', '2025-05-01 09:00:00'),
(4, 4, 4, '2025-05-15 11:00:00', 30, 'PENDING', 'FOLLOW_UP', '항암 치료 계획', 'PATIENT_APP', '', '2025-05-08 11:00:00', '2025-05-08 11:00:00'),
(5, 5, 5, '2025-05-20 15:00:00', 30, 'CONFIRMED', 'FOLLOW_UP', '재활 치료 평가', 'PATIENT_APP', '재활 진행 상황 양호', '2025-05-13 15:00:00', '2025-05-13 15:00:00'),
(6, 1, 1, '2025-06-01 10:00:00', 30, 'PENDING', 'CHECK_UP', '3개월 정기 검진', 'PATIENT_APP', '', '2025-05-25 10:00:00', '2025-05-25 10:00:00'),
(7, 2, 2, '2025-06-05 14:00:00', 60, 'CONFIRMED', 'FIRST_VISIT', '수술 일정 협의', 'NURSE_STATION', '수술실 예약 완료', '2025-05-28 14:00:00', '2025-05-28 14:00:00'),
(8, 3, 2, '2025-06-10 09:00:00', 30, 'PENDING', 'FOLLOW_UP', '수술 후 1개월 검진', 'PATIENT_APP', '', '2025-06-01 09:00:00', '2025-06-01 09:00:00');

-- ============================================================================
-- 14. EMR_FORM_VITALS (Vital signs - 각 encounter당 1개)
-- ============================================================================

INSERT INTO emr_form_vitals (id, encounter_id, date, bps, bpd, weight, height, temperature, pulse, respiration, oxygen_saturation, bmi, bmi_status, created_at, updated_at) VALUES
(1, 1, '2025-03-01 10:00:00', 120, 80, 70.5, 170.0, 36.5, 72, 16, 98, 24.4, 'Normal', '2025-03-01 10:00:00', '2025-03-01 10:00:00'),
(2, 2, '2025-03-05 14:00:00', 130, 85, 65.0, 165.0, 36.8, 78, 18, 97, 23.9, 'Normal', '2025-03-05 14:00:00', '2025-03-05 14:00:00'),
(3, 3, '2025-03-10 09:00:00', 118, 75, 82.3, 175.0, 36.4, 70, 15, 99, 26.9, 'Overweight', '2025-03-10 09:00:00', '2025-03-10 09:00:00'),
(4, 4, '2025-03-15 11:00:00', 125, 82, 58.0, 160.0, 36.6, 75, 17, 98, 22.7, 'Normal', '2025-03-15 11:00:00', '2025-03-15 11:00:00'),
(5, 5, '2025-03-20 15:00:00', 115, 78, 75.0, 178.0, 36.7, 68, 14, 99, 23.7, 'Normal', '2025-03-20 15:00:00', '2025-03-20 15:00:00'),
(6, 6, '2025-04-01 10:00:00', 122, 79, 71.0, 170.0, 36.5, 73, 16, 98, 24.6, 'Normal', '2025-04-01 10:00:00', '2025-04-01 10:00:00'),
(7, 7, '2025-04-05 14:00:00', 128, 84, 64.5, 165.0, 36.9, 76, 18, 97, 23.7, 'Normal', '2025-04-05 14:00:00', '2025-04-05 14:00:00'),
(8, 8, '2025-04-10 09:00:00', 120, 76, 83.0, 175.0, 36.3, 71, 15, 99, 27.1, 'Overweight', '2025-04-10 09:00:00', '2025-04-10 09:00:00');

-- ============================================================================
-- 15. EMR_FORM_SOAP (SOAP Chart - 각 encounter당 1개)
-- ============================================================================

INSERT INTO emr_form_soap (id, encounter_id, date, subjective, objective, assessment, plan, created_at, updated_at) VALUES
(1, 1, '2025-03-01 10:00:00', '환자는 2주 전부터 지속적인 두통과 어지러움을 호소함. 아침에 특히 심하며 구토를 동반하기도 함.', '신경학적 검사상 특이소견 없음. 활력징후 안정적. 뇌MRI 촬영 권장.', 'R/O Brain tumor (의심). 추가 영상 검사 필요.', 'Brain MRI with contrast 처방. 1주일 후 결과 상담 예약.', '2025-03-01 10:30:00', '2025-03-01 10:30:00'),
(2, 2, '2025-03-05 14:00:00', '최근 2개월간 시야가 좁아지는 느낌과 두통 호소. 특히 왼쪽 시야에서 증상 심화.', 'Visual field test 결과 좌측 반맹 소견. MRI상 뇌하수체 종양 의심 소견.', 'Pituitary adenoma 의심. 신경외과 협진 필요.', '신경외과 의뢰. 호르몬 검사 추가 시행. 약물 치료 시작.', '2025-03-05 14:30:00', '2025-03-05 14:30:00'),
(3, 3, '2025-03-10 09:00:00', 'MRI 검사 결과 상담 위해 내원. 증상은 큰 변화 없음.', 'MRI 결과 좌측 전두엽에 3cm 크기의 종양성 병변 확인. Glioma 의심.', 'Glioma (교모세포종) 의심. 조직검사 및 수술적 치료 필요.', '수술 일정 논의. 조직검사 후 치료 계획 수립. 가족 상담 예정.', '2025-03-10 09:30:00', '2025-03-10 09:30:00'),
(4, 4, '2025-03-15 11:00:00', '뇌종양 진단 후 항암 치료 계획 상담 위해 내원.', '전신 상태 양호. 혈액검사 결과 정상 범위. 종양 크기 및 위치 확인.', 'Meningioma 진단. 항암 치료 및 방사선 치료 병행 필요.', 'Chemotherapy protocol 시작. 2주 후 재평가. 방사선 종양학과 협진.', '2025-03-15 11:30:00', '2025-03-15 11:30:00'),
(5, 5, '2025-03-20 15:00:00', '뇌종양 수술 후 3주 경과. 보행 및 균형 장애로 재활 치료 받고 있음.', '보행 능력 50% 회복. 근력 테스트 Grade 4. 균형 감각 개선 중.', '수술 후 회복 양호. 지속적 재활 치료 필요.', '재활 운동 프로그램 지속. 물리치료 및 작업치료 병행. 1개월 후 재평가.', '2025-03-20 15:30:00', '2025-03-20 15:30:00'),
(6, 6, '2025-04-01 10:00:00', '1개월 전 진단 후 경과 관찰 위해 내원. 두통 증상 50% 감소.', '신경학적 검사 정상. 약물 치료 반응 양호.', '약물 치료 효과 양호. 경과 관찰 지속.', '현재 약물 유지. 3개월 후 MRI 추적 검사 예약.', '2025-04-01 10:30:00', '2025-04-01 10:30:00'),
(7, 7, '2025-04-05 14:00:00', '수술 예정으로 수술 전 평가 위해 내원.', '전신마취 가능 판정. 혈액검사, 심전도 정상.', '수술 준비 완료. 수술 위험도 낮음.', '수술 일정: 2025-04-15. 수술 전 금식 및 주의사항 설명 완료.', '2025-04-05 14:30:00', '2025-04-05 14:30:00'),
(8, 8, '2025-04-10 09:00:00', '수술 후 2주 경과. 상처 부위 통증 경미함.', '수술 부위 봉합 상태 양호. 신경학적 결손 없음.', '수술 후 회복 순조로움.', '봉합사 제거 예정. 항생제 투여 종료. 2주 후 외래 추적.', '2025-04-10 09:30:00', '2025-04-10 09:30:00');

-- ============================================================================
-- 16. CUSTOM_PRESCRIPTION (Prescriptions - 각 encounter당 1개)
-- ============================================================================

INSERT INTO custom_prescription (id, encounter_id, medication_code, medication_name, dosage, frequency, duration, route, instructions, prescribed_at, created_at, updated_at) VALUES
(1, 1, 'MED-001', 'Acetaminophen 500mg', '500mg', '3 times/day', '7 days', 'Oral', '식후 30분 복용', '2025-03-01 10:30:00', '2025-03-01 10:30:00', '2025-03-01 10:30:00'),
(2, 2, 'MED-002', 'Bromocriptine 2.5mg', '2.5mg', '2 times/day', '30 days', 'Oral', '아침, 저녁 식후 복용', '2025-03-05 14:30:00', '2025-03-05 14:30:00', '2025-03-05 14:30:00'),
(3, 3, 'MED-003', 'Dexamethasone 4mg', '4mg', '3 times/day', '14 days', 'Oral', '식후 복용, 뇌부종 감소 목적', '2025-03-10 09:30:00', '2025-03-10 09:30:00', '2025-03-10 09:30:00'),
(4, 4, 'MED-004', 'Temozolomide 100mg', '100mg', '1 time/day', '28 days', 'Oral', '공복 복용, 항암제', '2025-03-15 11:30:00', '2025-03-15 11:30:00', '2025-03-15 11:30:00'),
(5, 5, 'MED-005', 'Gabapentin 300mg', '300mg', '3 times/day', '60 days', 'Oral', '신경통 완화 목적', '2025-03-20 15:30:00', '2025-03-20 15:30:00', '2025-03-20 15:30:00'),
(6, 6, 'MED-001', 'Acetaminophen 500mg', '500mg', '2 times/day', '7 days', 'Oral', '필요 시 복용', '2025-04-01 10:30:00', '2025-04-01 10:30:00', '2025-04-01 10:30:00'),
(7, 7, 'MED-006', 'Cefazolin 1g', '1g', '3 times/day', '3 days', 'IV', '수술 전후 항생제', '2025-04-05 14:30:00', '2025-04-05 14:30:00', '2025-04-05 14:30:00'),
(8, 8, 'MED-007', 'Amoxicillin 500mg', '500mg', '3 times/day', '7 days', 'Oral', '식후 복용', '2025-04-10 09:30:00', '2025-04-10 09:30:00', '2025-04-10 09:30:00');

-- ============================================================================
-- 17. CUSTOM_PREDICTION_RESULT (AI Prediction - 각 encounter당 1개)
-- ============================================================================

INSERT INTO custom_prediction_result (id, encounter_id, patient_id, doctor_id, model_name, model_version, orthanc_study_uid, orthanc_series_uid, prediction_class, confidence_score, probabilities, xai_image_path, feature_importance, doctor_feedback, doctor_note, confirmed_at, created_at, updated_at) VALUES
(1, 1, 1, 1, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025030110001', '1.2.840.10008.5.1.4.1.1.2.2025030110002', 'Glioma', 0.85, '{"Glioma": 0.85, "Meningioma": 0.10, "Pituitary": 0.03, "No Tumor": 0.02}', '/media/xai/patient1_glioma_gradcam.png', '{"frontal_lobe": 0.92, "temporal_lobe": 0.45}', 'CORRECT', 'AI 예측 정확함. Glioma 확진.', '2025-03-01 11:00:00', '2025-03-01 10:45:00', '2025-03-01 11:00:00'),
(2, 2, 2, 1, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025030514001', '1.2.840.10008.5.1.4.1.1.2.2025030514002', 'Pituitary', 0.92, '{"Pituitary": 0.92, "Meningioma": 0.05, "Glioma": 0.02, "No Tumor": 0.01}', '/media/xai/patient2_pituitary_shap.png', '{"pituitary_gland": 0.98, "optic_chiasm": 0.67}', 'CORRECT', 'Pituitary adenoma 정확히 예측.', '2025-03-05 15:00:00', '2025-03-05 14:45:00', '2025-03-05 15:00:00'),
(3, 3, 3, 2, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025031009001', '1.2.840.10008.5.1.4.1.1.2.2025031009002', 'Glioma', 0.88, '{"Glioma": 0.88, "Meningioma": 0.08, "Pituitary": 0.02, "No Tumor": 0.02}', '/media/xai/patient3_glioma_gradcam.png', '{"frontal_lobe": 0.89, "white_matter": 0.78}', 'CORRECT', 'High-grade glioma 확진.', '2025-03-10 10:00:00', '2025-03-10 09:45:00', '2025-03-10 10:00:00'),
(4, 4, 4, 4, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025031511001', '1.2.840.10008.5.1.4.1.1.2.2025031511002', 'Meningioma', 0.90, '{"Meningioma": 0.90, "Glioma": 0.06, "Pituitary": 0.03, "No Tumor": 0.01}', '/media/xai/patient4_meningioma_shap.png', '{"dura_mater": 0.95, "skull_base": 0.82}', 'CORRECT', 'Meningioma 정확히 진단됨.', '2025-03-15 12:00:00', '2025-03-15 11:45:00', '2025-03-15 12:00:00'),
(5, 5, 5, 5, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025032015001', '1.2.840.10008.5.1.4.1.1.2.2025032015002', 'No Tumor', 0.78, '{"No Tumor": 0.78, "Glioma": 0.12, "Meningioma": 0.08, "Pituitary": 0.02}', '/media/xai/patient5_notumor_gradcam.png', '{"normal_tissue": 0.88}', 'CORRECT', '수술 후 재발 없음 확인.', '2025-03-20 16:00:00', '2025-03-20 15:45:00', '2025-03-20 16:00:00'),
(6, 6, 1, 1, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025040110001', '1.2.840.10008.5.1.4.1.1.2.2025040110002', 'Glioma', 0.82, '{"Glioma": 0.82, "Meningioma": 0.12, "Pituitary": 0.04, "No Tumor": 0.02}', '/media/xai/patient1_glioma_followup.png', '{"frontal_lobe": 0.85}', 'CORRECT', '경과 관찰 중 크기 변화 없음.', '2025-04-01 11:00:00', '2025-04-01 10:45:00', '2025-04-01 11:00:00'),
(7, 7, 2, 2, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025040514001', '1.2.840.10008.5.1.4.1.1.2.2025040514002', 'Pituitary', 0.94, '{"Pituitary": 0.94, "Meningioma": 0.04, "Glioma": 0.01, "No Tumor": 0.01}', '/media/xai/patient2_pituitary_preop.png', '{"pituitary_gland": 0.96}', 'CORRECT', '수술 전 재확인.', '2025-04-05 15:00:00', '2025-04-05 14:45:00', '2025-04-05 15:00:00'),
(8, 8, 3, 2, 'NeuroNova_Brain_v2.1', 'v2.1', '1.2.840.10008.5.1.4.1.1.2.2025041009001', '1.2.840.10008.5.1.4.1.1.2.2025041009002', 'No Tumor', 0.91, '{"No Tumor": 0.91, "Glioma": 0.05, "Meningioma": 0.03, "Pituitary": 0.01}', '/media/xai/patient3_postop_notumor.png', '{"surgical_site": 0.93}', 'CORRECT', '수술 후 종양 완전 제거 확인.', '2025-04-10 10:00:00', '2025-04-10 09:45:00', '2025-04-10 10:00:00');

-- ============================================================================
-- 18. EMR_MERGED_DOCUMENT (Merged documents - 각 encounter당 1개)
-- ============================================================================

INSERT INTO emr_merged_document (id, patient_id, encounter_id, title, document_type, status, `references`, snapshot_data, signed_by_id, created_at, updated_at) VALUES
(1, 1, 1, '진료 기록 - 환자일호 (2025-03-01)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 1, "form_vitals_id": 1}, "custom": {"prescription_id": 1, "prediction_result_id": 1}}', '{"patient_name": "환자일호", "diagnosis": "Glioma", "chief_complaint": "두통 및 어지러움"}', 6, '2025-03-01 11:00:00', '2025-03-01 11:30:00'),
(2, 2, 2, '진료 기록 - 환자이호 (2025-03-05)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 2, "form_vitals_id": 2}, "custom": {"prescription_id": 2, "prediction_result_id": 2}}', '{"patient_name": "환자이호", "diagnosis": "Pituitary adenoma", "chief_complaint": "시야 장애"}', 6, '2025-03-05 15:00:00', '2025-03-05 15:30:00'),
(3, 3, 3, '진료 기록 - 환자삼호 (2025-03-10)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 3, "form_vitals_id": 3}, "custom": {"prescription_id": 3, "prediction_result_id": 3}}', '{"patient_name": "환자삼호", "diagnosis": "Glioma", "chief_complaint": "MRI 결과 상담"}', 7, '2025-03-10 10:00:00', '2025-03-10 10:30:00'),
(4, 4, 4, '진료 기록 - 환자사호 (2025-03-15)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 4, "form_vitals_id": 4}, "custom": {"prescription_id": 4, "prediction_result_id": 4}}', '{"patient_name": "환자사호", "diagnosis": "Meningioma", "chief_complaint": "항암 치료 계획"}', 9, '2025-03-15 12:00:00', '2025-03-15 12:30:00'),
(5, 5, 5, '진료 기록 - 환자오호 (2025-03-20)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 5, "form_vitals_id": 5}, "custom": {"prescription_id": 5, "prediction_result_id": 5}}', '{"patient_name": "환자오호", "diagnosis": "Post-op recovery", "chief_complaint": "재활 평가"}', 10, '2025-03-20 16:00:00', '2025-03-20 16:30:00'),
(6, 1, 6, '추적 진료 기록 - 환자일호 (2025-04-01)', 'FINAL_REPORT', 'APPROVED', '{"emr": {"form_soap_id": 6, "form_vitals_id": 6}, "custom": {"prescription_id": 6, "prediction_result_id": 6}}', '{"patient_name": "환자일호", "diagnosis": "Glioma - follow up", "chief_complaint": "경과 관찰"}', 6, '2025-04-01 11:00:00', '2025-04-01 11:30:00'),
(7, 2, 7, '수술 전 평가 - 환자이호 (2025-04-05)', 'FINAL_REPORT', 'PENDING_REVIEW', '{"emr": {"form_soap_id": 7, "form_vitals_id": 7}, "custom": {"prescription_id": 7, "prediction_result_id": 7}}', '{"patient_name": "환자이호", "diagnosis": "Pituitary adenoma", "chief_complaint": "수술 전 평가"}', 7, '2025-04-05 15:00:00', '2025-04-05 15:00:00'),
(8, 3, 8, '수술 후 경과 - 환자삼호 (2025-04-10)', 'DISCHARGE_SUMMARY', 'DRAFT', '{"emr": {"form_soap_id": 8, "form_vitals_id": 8}, "custom": {"prescription_id": 8, "prediction_result_id": 8}}', '{"patient_name": "환자삼호", "diagnosis": "Post-op status", "chief_complaint": "수술 후 경과"}', 7, '2025-04-10 10:00:00', '2025-04-10 10:00:00');

-- ============================================================================
-- 19. NOTIFICATION_LOG (Notification logs - 최소 8개)
-- ============================================================================

INSERT INTO notification_log (id, user_id, notification_type, title, message, is_read, sent_at, read_at, created_at, updated_at) VALUES
(1, 16, 'APPOINTMENT_CONFIRMED', '예약 확정', '2025-05-01 10:00 예약이 확정되었습니다.', 1, '2025-04-25 10:00:00', '2025-04-25 11:00:00', '2025-04-25 10:00:00', '2025-04-25 11:00:00'),
(2, 17, 'APPOINTMENT_CONFIRMED', '예약 확정', '2025-05-05 14:00 예약이 확정되었습니다.', 1, '2025-04-28 14:00:00', '2025-04-28 15:00:00', '2025-04-28 14:00:00', '2025-04-28 15:00:00'),
(3, 18, 'DIAGNOSIS_READY', '진단 결과 준비 완료', 'AI 진단 결과가 준비되었습니다.', 1, '2025-03-10 09:45:00', '2025-03-10 10:00:00', '2025-03-10 09:45:00', '2025-03-10 10:00:00'),
(4, 19, 'PRESCRIPTION_READY', '처방전 준비 완료', '처방전이 준비되었습니다.', 0, '2025-03-15 11:30:00', NULL, '2025-03-15 11:30:00', '2025-03-15 11:30:00'),
(5, 20, 'APPOINTMENT_REMINDER', '예약 알림', '내일 15:00 예약이 있습니다.', 1, '2025-03-19 09:00:00', '2025-03-19 10:00:00', '2025-03-19 09:00:00', '2025-03-19 10:00:00'),
(6, 16, 'DIAGNOSIS_READY', '진단 결과 준비 완료', '추적 검사 결과가 준비되었습니다.', 1, '2025-04-01 10:45:00', '2025-04-01 11:00:00', '2025-04-01 10:45:00', '2025-04-01 11:00:00'),
(7, 17, 'APPOINTMENT_REMINDER', '수술 예약 알림', '2025-04-15 수술 일정 확인 바랍니다.', 0, '2025-04-05 14:30:00', NULL, '2025-04-05 14:30:00', '2025-04-05 14:30:00'),
(8, 18, 'PRESCRIPTION_READY', '처방전 준비 완료', '수술 후 약 처방전이 준비되었습니다.', 1, '2025-04-10 09:30:00', '2025-04-10 10:00:00', '2025-04-10 09:30:00', '2025-04-10 10:00:00');

-- ============================================================================
-- 20. DJANGO_ADMIN_LOG (Admin action logs - 최소 5개)
-- ============================================================================

INSERT INTO django_admin_log (id, action_time, user_id, content_type_id, object_id, object_repr, action_flag, change_message) VALUES
(1, '2025-01-01 09:00:00', 1, 1, '1', 'admin1', 1, '[{"added": {}}]'),
(2, '2025-01-05 09:00:00', 1, 5, '1', 'Dr. 김신경', 1, '[{"added": {}}]'),
(3, '2025-02-01 10:00:00', 1, 6, '1', '환자일호 (PT-2025-1001)', 1, '[{"added": {}}]'),
(4, '2025-03-01 10:00:00', 1, 7, '1', '환자일호 - 2025-03-01', 1, '[{"added": {}}]'),
(5, '2025-03-01 11:00:00', 1, 7, '1', '환자일호 - 2025-03-01', 2, '[{"changed": {"fields": ["status"]}}]');

-- ============================================================================
-- 21. DJANGO_SESSION (Session data - 최소 5개)
-- ============================================================================

INSERT INTO django_session (session_key, session_data, expire_date) VALUES
('session_key_admin1_abc123', 'encoded_session_data_1', '2025-12-29 09:00:00'),
('session_key_doctor1_def456', 'encoded_session_data_2', '2025-12-29 10:00:00'),
('session_key_doctor2_ghi789', 'encoded_session_data_3', '2025-12-29 10:00:00'),
('session_key_patient1_jkl012', 'encoded_session_data_4', '2025-12-29 11:00:00'),
('session_key_patient2_mno345', 'encoded_session_data_5', '2025-12-29 11:00:00');

-- ============================================================================
-- Re-enable foreign key checks
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Summary:
-- ============================================================================
-- auth_user: 20 rows (ADMIN: 5, DOCTOR: 5, NURSE: 5, PATIENT: 5)
-- user_profile: 20 rows
-- custom_doctor: 5 rows
-- emr_patient: 5 rows
-- custom_patient_doctor: 9 rows (의사-환자 매핑)
-- emr_encounter: 8 rows
-- custom_appointment: 8 rows
-- emr_form_vitals: 8 rows
-- emr_form_soap: 8 rows
-- custom_prescription: 8 rows
-- custom_prediction_result: 8 rows
-- emr_merged_document: 8 rows
-- auth_group: 5 rows
-- auth_permission: 8 rows
-- auth_group_permissions: 7 rows
-- auth_user_groups: 7 rows
-- auth_user_user_permissions: 5 rows
-- notification_log: 8 rows
-- django_content_type: 8 rows
-- django_admin_log: 5 rows
-- django_session: 5 rows
-- ============================================================================
-- Total: All tables have at least 5 rows
-- Foreign key constraints are properly maintained
-- ============================================================================
