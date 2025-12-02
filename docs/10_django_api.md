# NeuroNova Django API Documentation

**Version**: v1.1
**Last Updated**: 2025-11-30

---

## 📋 Table of Contents
1. [Implementation Overview](#implementation-overview)
2. [API Configuration](#api-configuration)
3. [Authentication API](#authentication-api)
4. [User Management API](#user-management-api)
5. [EMR API](#emr-api)
6. [Custom (NeuroNova Core) API](#custom-neuronova-core-api)
7. [Orthanc DICOM API](#orthanc-dicom-api)
8. [Notification API](#notification-api)
9. [Troubleshooting](#troubleshooting)

---

## Implementation Overview

### Key Features Implemented
✅ **Django REST API**: Full implementation of Users, EMR, and Custom apps.
✅ **Orthanc Integration**: Seamless DICOM server integration.
✅ **Push Notifications**: FCM integration for appointment and diagnosis updates.
✅ **RBAC**: Role-Based Access Control for Admin, Doctor, Nurse, and Patient.
✅ **Automated Testing**: Comprehensive test suite with ~87% coverage.

---

## API Configuration

### Base URL
```javascript
// React - src/utils/config.js
API_CONFIG.BASE_URL = 'http://localhost:8000'
API_CONFIG.API_VERSION = 'v1'
```

### Authentication Headers
All protected endpoints require a JWT token:
```
Authorization: Bearer <access_token>
```

---

## Authentication API

### 1. Login
* **Endpoint**: `POST /api/v1/users/login/`
* **Request**:
  ```json
  {
    "username": "doctor1",
    "password": "doctor123"
  }
  ```
* **Response**: Returns Access & Refresh tokens.

### 2. Token Refresh
* **Endpoint**: `POST /api/v1/users/refresh/`
* **Request**: `{"refresh": "..."}`
* **Response**: `{"access": "..."}`

### 3. Register
* **Endpoint**: `POST /api/v1/users/register/`
* **Request**:
  ```json
  {
    "username": "newdoctor",
    "password": "securepass",
    "role": "DOCTOR",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```
* **Note**: Privileged roles (DOCTOR, NURSE, ADMIN) may require admin approval (`approval_status='PENDING'`).

---

## User Management API

### 1. Current User Profile
* **Endpoint**: `GET /api/v1/users/profiles/me/`
* **Response**:
  ```json
  {
    "id": 1,
    "user": { "username": "doctor1", "email": "..." },
    "role": "DOCTOR",
    "approval_status": "APPROVED"
  }
  ```

### 2. Change Password
* **Endpoint**: `POST /api/v1/users/change_password/`
* **Request**: `{"old_password": "...", "new_password": "..."}`

---

## EMR API

### 1. Patients
* **Base URL**: `/api/v1/emr/patients/`
* **Endpoints**:
    * `GET /`: List patients
    * `POST /`: Create patient
    * `GET /{id}/`: Patient detail
    * `GET /{id}/encounters/`: List all encounters for patient
    * `GET /{id}/medical_history/`: Integrated medical history

### 2. Encounters (Medical Records)
* **Base URL**: `/api/v1/emr/encounters/`
* **Endpoints**:
    * `GET /`: List encounters
    * `POST /`: Create encounter (Doctor automatically assigned)
    * `GET /{id}/`: Detail (includes SOAP & Vitals)

### 3. SOAP Charts
* **Base URL**: `/api/v1/emr/soap/`
* **Endpoints**: `GET /`, `POST /`, `PUT /{id}/`

### 4. Vitals
* **Base URL**: `/api/v1/emr/vitals/`
* **Endpoints**: `GET /`, `POST /` (BMI automatically calculated)

---

## Custom (NeuroNova Core) API

### 1. Appointments
* **Base URL**: `/api/v1/custom/appointments/`
* **Endpoints**:
    * `GET /`: List appointments
    * `POST /`: Create appointment
    * `POST /{id}/confirm/`: Confirm appointment (triggers notification)
    * `POST /{id}/cancel/`: Cancel appointment (triggers notification)

### 2. AI Predictions
* **Base URL**: `/api/v1/custom/predictions/`
* **Endpoints**:
    * `GET /`: List predictions
    * `GET /{id}/`: Prediction detail
    * `POST /{id}/confirm_prediction/`: Doctor feedback (Human-in-the-loop)
    * `GET /pending_review/`: List predictions awaiting review

### 3. Prescriptions
* **Base URL**: `/api/v1/custom/prescriptions/`
* **Endpoints**: `GET /`, `POST /`

### 4. Doctors
* **Base URL**: `/api/v1/custom/doctors/`
* **Endpoints**: `GET /`, `POST /`

---

## Orthanc DICOM API

**Base URL**: `/api/v1/orthanc/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/studies/{study_uid}/` | Get Study metadata |
| GET | `/series/{series_uid}/` | Get Series metadata |
| GET | `/instances/{id}/preview/` | Get image preview (PNG) |
| GET | `/instances/{id}/file/` | Download DICOM file |
| GET | `/patients/{id}/studies/` | List studies for patient |
| POST | `/upload/` | Upload DICOM file |

---

## Notification API

**Base URL**: `/api/v1/notifications/`

* **Usage**:
    * Frontend (Flutter) sends FCM token to `/api/v1/users/profiles/me/` (PATCH).
    * Backend sends notifications via `NotificationService` for events:
        * `APPOINTMENT_CONFIRMED`
        * `APPOINTMENT_CANCELLED`
        * `DIAGNOSIS_READY`
        * `PRESCRIPTION_READY`

---

## Troubleshooting

### 1. 404 Not Found
* **Cause**: ViewSet not registered in `urls.py` or incorrect URL path.
* **Fix**: Check `router.register` in `apps/*/urls.py`.

### 2. 401 Unauthorized
* **Cause**: Token expired or missing.
* **Fix**: Ensure `Authorization: Bearer <token>` header is present. React `axiosClient` handles refresh automatically.

### 3. CORS Error
* **Cause**: Frontend origin not allowed.
* **Fix**: Add origin to `CORS_ALLOWED_ORIGINS` in `settings.py`.
