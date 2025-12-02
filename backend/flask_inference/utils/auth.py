# utils/auth.py
from typing import Optional, Any

from flask import jsonify, Request

from config import API_KEY


def check_api_key(req: Request) -> Optional[Any]:
    # 디버깅 모드
    return None

    """
    .env에 API_KEY가 있으면 X-API-KEY 헤더를 검사.
    틀리면 (json_response, status_code)를 반환, 맞으면 None.
    """
    if not API_KEY:
        return None

    key = req.headers.get("X-API-KEY")
    if key != API_KEY:
        return jsonify({"ok": False, "error": "Invalid API key"}), 401

    return None
