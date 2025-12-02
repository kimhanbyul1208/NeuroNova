# app.py
from flask import Flask, jsonify
from flask_cors import CORS

from api.routes import api_bp
from ml.model import load_model, get_model_version


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Blueprint 등록
    app.register_blueprint(api_bp)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify(
            {
                "ok": True,
                "status": "alive",
                "model_version": get_model_version(),
            }
        )

    return app


if __name__ == "__main__":
    from config import PORT

    # 시작 시 모델 한 번 로드
    try:
        load_model()
    except Exception as e:
        print(f"[WARN] 초기 모델 로드 실패: {e}")

    app = create_app()
    # 로컬 전용: Django에서만 접근 가능하도록 127.0.0.1로 바인딩
    app.run(host="127.0.0.1", port=PORT, debug=False)
