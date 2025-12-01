# NeuroNova API Specification

**Base URL**: `/api/v1/`
**Auth**: Bearer Token (JWT)

---

## 🔐 Authentication (Auth)

### Login
- **URL**: `/api/v1/users/login/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "doctor1",
    "password": "password123"
  }
  ```
- **Response**: `access`, `refresh` tokens

### Refresh Token
- **URL**: `/api/v1/users/refresh/`
- **Method**: `POST`
- **Body**: `{"refresh": "..."}`

---

## 👤 Users & Profiles

### Register
- **URL**: `/api/v1/users/users/register/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "newuser",
    "password": "password123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "PATIENT"  // ADMIN, DOCTOR, NURSE, PATIENT
  }
  ```

### Current User Info
- **URL**: `/api/v1/users/users/me/`
- **Method**: `GET`

### Current User Profile
- **URL**: `/api/v1/users/profiles/me/`
- **Method**: `GET`

### Change Password
- **URL**: `/api/v1/users/users/change_password/`
- **Method**: `POST`
- **Body**: `{"old_password": "...", "new_password": "..."}`

---

## 🏥 EMR (Electronic Medical Records)

### Patients
- **List**: `GET /api/v1/emr/patients/` (Searchable: `first_name`, `last_name`, `pid`, `phone`)
- **Detail**: `GET /api/v1/emr/patients/{id}/`
- **Encounters**: `GET /api/v1/emr/patients/{id}/encounters/`
- **Medical History**: `GET /api/v1/emr/patients/{id}/medical_history/` (Includes encounters + AI diagnoses)

### Encounters
- **List**: `GET /api/v1/emr/encounters/`
- **Create**: `POST /api/v1/emr/encounters/`
- **Detail**: `GET /api/v1/emr/encounters/{id}/`

### Clinical Forms
- **SOAP Notes**: `/api/v1/emr/soap/`
- **Vitals**: `/api/v1/emr/vitals/`
- **Documents**: `/api/v1/emr/documents/`

---

## 🧠 Custom Features (NeuroNova Specific)

### Appointments
- **List**: `GET /api/v1/custom/appointments/`
- **Create**: `POST /api/v1/custom/appointments/`
  - Patient field is auto-filled for logged-in patients.
- **Confirm**: `POST /api/v1/custom/appointments/{id}/confirm/` (Staff/Doctor only)
- **Cancel**: `POST /api/v1/custom/appointments/{id}/cancel/`

### AI Predictions (CDSS)
- **List**: `GET /api/v1/custom/predictions/`
- **Pending Review**: `GET /api/v1/custom/predictions/pending_review/`
- **Confirm Prediction**: `POST /api/v1/custom/predictions/{id}/confirm_prediction/`
  - **Body**:
    ```json
    {
      "doctor_feedback": "Correct",
      "doctor_note": "Lesion size matches MRI"
    }
    ```

### Prescriptions
- **List/Create**: `/api/v1/custom/prescriptions/`

### Doctors
- **List**: `GET /api/v1/custom/doctors/`

---

## 🔔 Notifications

### Notification Logs
- **List**: `GET /api/v1/notifications/logs/`
- **Filter**: `is_read=false`

---

## 🖼️ Orthanc (DICOM Integration)

- **Study**: `GET /api/v1/orthanc/studies/{study_uid}/`
- **Series**: `GET /api/v1/orthanc/series/{series_uid}/`
- **Instance Preview**: `GET /api/v1/orthanc/instances/{instance_id}/preview/`
- **Upload**: `POST /api/v1/orthanc/upload/`
