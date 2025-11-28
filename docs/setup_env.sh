#!/bin/bash
# NeuroNova Environment Setup Script (Linux/Mac)
# .env.example 파일들을 .env로 자동 복사

echo "========================================"
echo "NeuroNova Environment Setup"
echo "========================================"
echo ""

# 프로젝트 루트로 이동 (docs 폴더에서 한 단계 위로)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "[1/2] Setting up Backend Django .env file..."
if [ -f "backend/django_main/.env.example" ]; then
    if [ -f "backend/django_main/.env" ]; then
        echo "    - .env already exists, skipping..."
    else
        cp "backend/django_main/.env.example" "backend/django_main/.env"
        echo "    - Created backend/django_main/.env"
    fi
else
    echo "    - WARNING: .env.example not found!"
fi

echo ""
echo "[2/2] Setting up Frontend React .env file..."
if [ -f "frontend/react_web/.env.example" ]; then
    if [ -f "frontend/react_web/.env" ]; then
        echo "    - .env already exists, skipping..."
    else
        cp "frontend/react_web/.env.example" "frontend/react_web/.env"
        echo "    - Created frontend/react_web/.env"
    fi
else
    echo "    - WARNING: .env.example not found!"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Review and edit .env files if needed"
echo "2. Backend: cd backend/django_main && python manage.py runserver"
echo "3. Frontend: cd frontend/react_web && npm run dev"
echo ""
