@echo off
REM NeuroNova Environment Setup Script (Windows)
REM .env.example 파일들을 .env로 자동 복사

echo ========================================
echo NeuroNova Environment Setup
echo ========================================
echo.

REM 프로젝트 루트로 이동 (docs 폴더에서 한 단계 위로)
cd /d "%~dp0\.."

echo [1/2] Setting up Backend Django .env file...
if exist "backend\django_main\.env.example" (
    if exist "backend\django_main\.env" (
        echo     - .env already exists, skipping...
    ) else (
        copy "backend\django_main\.env.example" "backend\django_main\.env" >nul
        echo     - Created backend/django_main/.env
    )
) else (
    echo     - WARNING: .env.example not found!
)

echo.
echo [2/2] Setting up Frontend React .env file...
if exist "frontend\react_web\.env.example" (
    if exist "frontend\react_web\.env" (
        echo     - .env already exists, skipping...
    ) else (
        copy "frontend\react_web\.env.example" "frontend\react_web\.env" >nul
        echo     - Created frontend/react_web/.env
    )
) else (
    echo     - WARNING: .env.example not found!
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review and edit .env files if needed
echo 2. Backend: cd backend/django_main ^&^& python manage.py runserver
echo 3. Frontend: cd frontend/react_web ^&^& npm run dev
echo.
pause
