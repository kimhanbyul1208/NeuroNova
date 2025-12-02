# config.py
import os
from pathlib import Path

import torch
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# .env 로드
load_dotenv(BASE_DIR / ".env")

# 모델 디렉토리 (기본 ./final_model)
MODEL_DIR = os.getenv("MODEL_DIR", str(BASE_DIR / "final_model"))

# API Key (없으면 인증 비활성화)
API_KEY = os.getenv("API_KEY")

# Flask 포트
PORT = int(os.getenv("PORT", "9000"))

# 디바이스
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
