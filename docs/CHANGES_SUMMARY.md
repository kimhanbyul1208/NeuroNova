# Frontend Changes Summary

This document summarizes the changes made to `frontend/react_web` and `frontend/flutter_app` based on the reference implementations in `frontend/참고용`.

## React Web Application Changes

### 1. [src/main.jsx](frontend/react_web/src/main.jsx)
**Changed:**
- Added `BrowserRouter` wrapper around the App component
- Added `AuthProvider` wrapper to provide authentication context throughout the app
- Imported required components from react-router-dom and AuthContext

**Rationale:** Follows the reference pattern from `Thyroid_react` for proper routing and authentication setup.

### 2. [src/App.jsx](frontend/react_web/src/App.jsx)
**Changed:**
- Removed `Router` component (now in main.jsx)
- Added `ProtectedRoute` component for role-based access control
- Wrapped all routes (except login) with `ProtectedRoute`
- Added role restrictions for doctor/admin-only pages (patients, diagnosis, DICOM, SOAP, prescriptions)
- Uses `useAuth` hook to check authentication and user roles

**Rationale:** Implements role-based access control similar to the reference app, ensuring only authorized users can access specific routes.

### 3. [src/auth/AuthContext.jsx](frontend/react_web/src/auth/AuthContext.jsx)
**Changed:**
- Updated token storage keys from `access_token`/`refresh_token` to `access`/`refresh`
- Modified login to fetch user details from `/api/auth/me` endpoint after authentication
- Updated checkAuth to be async and fetch user profile on mount
- Aligned token handling with Django backend conventions

**Rationale:** Matches the backend API structure and ensures consistent token naming throughout the application.

### 4. [src/api/axios.js](frontend/react_web/src/api/axios.js)
**Changed:**
- Updated token retrieval to use `access`/`refresh` keys instead of `access_token`/`refresh_token`
- Modified refresh token endpoint from `/api/v1/users/refresh/` to `/api/auth/token/refresh/`
- Updated token storage to use consistent naming

**Rationale:** Aligns with Django REST Framework's token naming conventions and backend API structure.

## Flutter Application Changes

### 1. [lib/main.dart](frontend/flutter_app/lib/main.dart)
**Changed:**
- Added `flutter_localizations` import for Korean/English localization
- Imported and implemented `AuthService` for authentication
- Added `_getInitialRoute()` function to determine initial route based on user role
- Modified `MyApp` to accept `initialRoute` parameter
- Added role-based routes: `/adminMain`, `/doctorMain`, `/patientMain`, `/staffMain`
- Added localization delegates and supported locales (Korean, English)

**Rationale:** Implements auto-login and role-based routing similar to the mesothelium_flutter reference app.

### 2. [lib/core/services/auth_service.dart](frontend/flutter_app/lib/core/services/auth_service.dart) - **NEW FILE**
**Created:**
- Singleton AuthService class for authentication management
- `login()` method for username/password authentication
- `fetchUserProfile()` to retrieve user data from `/api/auth/me`
- `tryAutoLogin()` for automatic authentication on app start
- Token storage using SharedPreferences
- `logout()` method to clear tokens and user data
- Uses `http` package for API calls

**Rationale:** Provides centralized authentication management similar to the reference Flutter app's AuthService.

### 3. [lib/core/config/app_config.dart](frontend/flutter_app/lib/core/config/app_config.dart)
**Changed:**
- Removed `apiVersion` constant (not needed for Django auth endpoints)
- Updated API endpoints to match Django backend:
  - `loginEndpoint`: `/api/auth/token/`
  - `refreshTokenEndpoint`: `/api/auth/token/refresh/`
  - Added `registerEndpoint`, `meEndpoint`, `updateProfileEndpoint`
  - Added patient endpoints: `patientsEndpoint`, `patientsMineEndpoint`
  - Added ML endpoints: `mlPredictEndpoint`, `mlSchemaEndpoint`
  - Added `medicalRecordsEndpoint`

**Rationale:** Aligns Flutter app API endpoints with Django backend structure.

### 4. [pubspec.yaml](frontend/flutter_app/pubspec.yaml)
**Changed:**
- Added `flutter_localizations` SDK dependency

**Rationale:** Required for Korean/English localization support used in main.dart.

## Key Improvements

### Authentication Flow
1. **React Web:**
   - Token-based authentication with JWT
   - Automatic token refresh on 401 errors
   - Role-based route protection
   - Persistent login state

2. **Flutter App:**
   - Auto-login on app start
   - Role-based routing to different home screens
   - Secure token storage with SharedPreferences
   - Korean/English localization support

### Security Enhancements
- Consistent token naming across frontend and backend
- Automatic token refresh handling
- Protected routes requiring authentication
- Role-based access control for sensitive pages

### User Experience
- Automatic navigation to role-appropriate screens
- Persistent authentication across sessions
- Proper error handling and fallbacks
- Localized UI (Korean/English support in Flutter)

## Backend API Integration

Both applications now properly integrate with the Django backend using these endpoints:
- `/api/auth/token/` - Login
- `/api/auth/token/refresh/` - Token refresh
- `/api/auth/me/` - User profile
- `/api/patients/` - Patient management
- `/api/appointments/` - Appointment management
- `/api/ml/predict/` - ML predictions (via Django proxy)

## Next Steps

To complete the integration:
1. Ensure backend Django endpoints match these API paths
2. Test authentication flow in both React and Flutter apps
3. Verify role-based access control works correctly
4. Test auto-login functionality
5. Validate token refresh mechanism
