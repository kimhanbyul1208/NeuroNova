# api/routes.py
import random
import pickle
from functools import lru_cache
from pathlib import Path

from flask import Blueprint, request, jsonify

from bioseq.translate import translate_to_protein
from ml.model import get_detector, load_model, get_model_version
from structures.uniprot_af import find_protein_with_3d
from utils.auth import check_api_key

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ./data/test_data.pkl (프로젝트 루트 기준)
PROJECT_ROOT = Path(__file__).resolve().parents[1]
TEST_DATA_PATH = PROJECT_ROOT / "data" / "test_data.pkl"

# 사람별 항원(label) 균등 분포용
ANTIGEN_LABELS = ["Cold", "Flu", "COVID", "Normal"]  # 감기 / 독감 / 코로나 / 정상

# 아미노산 → DNA codon (간단 역번역; 예제용이라 하나씩만 매핑)
AA_TO_CODON = {
    "A": "GCT",
    "R": "CGT",
    "N": "AAT",
    "D": "GAT",
    "C": "TGT",
    "Q": "CAA",
    "E": "GAA",
    "G": "GGT",
    "H": "CAT",
    "I": "ATT",
    "L": "CTG",
    "K": "AAA",
    "M": "ATG",
    "F": "TTT",
    "P": "CCT",
    "S": "TCT",
    "T": "ACT",
    "W": "TGG",
    "Y": "TAT",
    "V": "GTT",
    "B": "AAT",  # N or D -> N 기준
    "Z": "CAA",  # Q or E -> Q 기준
    "X": "NNN",  # unknown
    "*": "TAA",  # stop
}


@lru_cache(maxsize=1)
def _load_test_data():
    """./data/test_data.pkl 로드 (캐시)"""
    if not TEST_DATA_PATH.exists():
        raise FileNotFoundError(f"test_data.pkl not found: {TEST_DATA_PATH}")
    with open(TEST_DATA_PATH, "rb") as f:
        data = pickle.load(f)
    if not isinstance(data, list):
        raise ValueError("test_data.pkl 형식이 예상과 다릅니다. (list가 아님)")
    return data


def _back_translate_protein_to_dna(protein_seq: str) -> str:
    """단백질 서열을 단순 DNA 서열로 역번역 (예제용)"""
    dna_codons = []
    for aa in protein_seq:
        aa = aa.upper()
        codon = AA_TO_CODON.get(aa, "NNN")
        dna_codons.append(codon)
    return "".join(dna_codons)


ALLOWED_PROTEIN_TYPES = [
    "Host_Protein",
    "Nucleocapsid",
    "Hemagglutinin",
    "Neuraminidase",
]


def _generate_example_cases(
    num_people: int,
    samples_per_person: int,
    disease_ratio: float = 0.9,
):
    """
    example_data용 샘플 생성

    - 데이터 출처: ./data/test_data.pkl
    - protein_type == "Other" 는 절대 사용하지 않음
    - 사용 타입: Host_Protein / Nucleocapsid / Hemagglutinin / Neuraminidase
    - seq_type: 항상 "protein"
    - disease_ratio: 질병군(병원체) 비율 (0.9 → 90%가 질병군)
    - 개수: 항상 num_people * samples_per_person 개수 정확히 맞춤
            (random.choice 사용으로 중복 허용)
    """

    data = _load_test_data()  # 기존에 사용하던 로더 그대로 사용한다고 가정

    # 1) Other 제외 + 필요한 타입만 필터링
    filtered = [
        item
        for item in data
        if item.get("protein_type") in ALLOWED_PROTEIN_TYPES
        and isinstance(item.get("sequence"), str)
        and item.get("sequence")
    ]

    if not filtered:
        raise ValueError(
            "test_data.pkl에서 Host_Protein / Nucleocapsid / Hemagglutinin / Neuraminidase 를 찾지 못했습니다."
        )

    # 2) 질병군 / 정상군 나누기
    disease_items = [  # 병원체 계열
        it
        for it in filtered
        if it.get("protein_type") in ("Nucleocapsid", "Hemagglutinin", "Neuraminidase")
    ]
    normal_items = [  # Host_Protein
        it for it in filtered if it.get("protein_type") == "Host_Protein"
    ]

    if not disease_items:
        raise ValueError("질병군(Nucleocapsid/Hemagglutinin/Neuraminidase) 데이터가 없습니다.")

    # 정상군이 하나도 없으면 disease_ratio 의미 없지만, 개수는 맞출 수 있게 진행
    if not normal_items:
        normal_items = []

    people = []

    for i in range(num_people):
        person_id = f"P{i+1:03d}"

        # 3) 이 사람이 질병군인지 정상군인지 결정 (질병 90% 기본)
        if normal_items:
            is_disease_person = (random.random() < disease_ratio)
        else:
            # 정상 데이터가 없으면 무조건 질병군
            is_disease_person = True

        person_samples = []

        for j in range(samples_per_person):
            # 4) 샘플 하나 선택 (중복 허용 → 개수 항상 맞출 수 있음)
            if is_disease_person:
                base = random.choice(disease_items)
            else:
                base = random.choice(normal_items)

            prot_seq = base.get("sequence")
            ptype = base.get("protein_type")
            pid = base.get("protein_id")

            person_samples.append(
                {
                    "sample_index": j,
                    "seq_type": "protein",        # ✅ 항상 protein
                    "sequence": prot_seq,         # ✅ 실제 test_data 단백질 서열
                    "protein_type": ptype,        # 디버깅/검증용
                    "protein_id": pid,
                }
            )

        # 5) 사람 레벨 antigen 라벨 (그냥 protein_type 기반으로 그룹 이름)
        if is_disease_person:
            # 이 사람의 대표 antigen을 샘플 중 첫 번째 protein_type으로 잡기
            rep_type = person_samples[0]["protein_type"]
            if rep_type in ("Hemagglutinin", "Neuraminidase"):
                antigen = "Flu"
            elif rep_type == "Nucleocapsid":
                antigen = "Pathogen"
            else:
                antigen = "Pathogen"
        else:
            antigen = "Normal"

        people.append(
            {
                "person_id": person_id,
                "antigen": antigen,
                "num_samples": samples_per_person,
                "samples": person_samples,
            }
        )

    return {
        "num_people": num_people,
        "samples_per_person": samples_per_person,
        "disease_ratio_target": disease_ratio,
        "allowed_protein_types": ALLOWED_PROTEIN_TYPES,
        "items": people,
    }



# ---------------------------------------------------------------------------
# 0. health (api prefix 안 쓰고 /health 로 나가고 싶으면 main.py 쪽에서 별도 등록 필요)
#    여기서는 /api/health 로 둠
# ---------------------------------------------------------------------------
@api_bp.route("/health", methods=["GET"])
def health():
    """
    간단 헬스 체크:
    - Flask 앱 살아있는지
    - 모델 버전은 뭔지
    """
    try:
        version = get_model_version()
        return jsonify(
            {
                "ok": True,
                "status": "alive",
                "model_version": version,
            }
        )
    except Exception as e:
        # 모델 로딩이 아직 안 됐거나 실패해도 서버는 살아있으니 ok는 True로 보고,
        # 모델 쪽 상태만 별도 표시
        return jsonify(
            {
                "ok": True,
                "status": "alive",
                "model_version": None,
                "model_error": str(e),
            }
        )


# ---------------------------------------------------------------------------
# 1. 간단 schema: 실제 예시 입력 JSON만 리턴
# ---------------------------------------------------------------------------
@api_bp.route("/schema", methods=["GET"])
def get_schema():
    """
    React/Postman에서 그대로 참고할 실제 예시 입력 JSON만 반환.
    설명/스키마 없이, 최종 요청 포맷 예제만 내려준다.
    """
    example = {
        "items": [
            {
                "id": "sample1",
                "sequence": "AUGGCU...",
                "seq_type": "rna",
            },
            {
                "id": "sample2",
                "sequence": "MFVFLVLLPL...",
                "seq_type": "protein",
            },
        ],
        "frame": 0,
        "stop_at_stop": False,
        "task3_threshold": 0.5,
        "organism_hint": "Influenza A virus",
    }

    return jsonify(example)


# ---------------------------------------------------------------------------
# 2. 모델 리로드
# ---------------------------------------------------------------------------
@api_bp.route("/reload_model", methods=["GET"])
def reload_model_api():
    auth_error = check_api_key(request)
    if auth_error is not None:
        return auth_error

    try:
        load_model()
        return jsonify(
            {
                "ok": True,
                "message": "Model reloaded",
                "model_version": get_model_version(),
            }
        )
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# 3. 단일 item 추론 로직
# ---------------------------------------------------------------------------
def _infer_single_item(payload: dict, default_params: dict, index: int):
    """
    단일 item에 대해:
    1) DNA/RNA/Protein → 단백질 서열 변환
    2) 모델 추론
    3) Task3 Top-1 → UniProt/AlphaFold 3D 조회
    """
    sequence = payload.get("sequence", "")
    if not sequence:
        return {
            "ok": False,
            "index": index,
            "id": payload.get("id"),
            "error": "sequence 필드는 필수입니다.",
        }

    # item 개별 설정이 있으면 우선, 없으면 공통 기본값 사용
    seq_type = payload.get("seq_type", default_params.get("seq_type", "auto"))
    frame = int(payload.get("frame", default_params.get("frame", 0)))
    stop_at_stop = bool(
        payload.get("stop_at_stop", default_params.get("stop_at_stop", False))
    )
    task3_threshold = float(
        payload.get("task3_threshold", default_params.get("task3_threshold", 0.5))
    )
    organism_hint = payload.get("organism_hint", default_params.get("organism_hint"))

    # 1) DNA/RNA → Protein 변환
    try:
        protein_seq, trans_info = translate_to_protein(
            raw_sequence=sequence,
            seq_type=seq_type,
            frame=frame,
            stop_at_stop=stop_at_stop,
        )
    except Exception as e:
        return {
            "ok": False,
            "index": index,
            "id": payload.get("id"),
            "error": f"서열 변환 실패: {e}",
        }

    if not protein_seq:
        return {
            "ok": False,
            "index": index,
            "id": payload.get("id"),
            "error": "단백질 서열로 변환된 결과가 비어 있습니다.",
            "translation_info": trans_info,
        }

    # 2) 모델 추론
    try:
        detector = get_detector()
        pred = detector.predict(protein_seq, task3_threshold=task3_threshold)
    except Exception as e:
        return {
            "ok": False,
            "index": index,
            "id": payload.get("id"),
            "error": f"모델 추론 실패: {e}",
        }

    # 3) Task3 Top-1 protein → UniProt/AlphaFold 3D
    task3 = pred.get("task3", {})
    top_preds = task3.get("top_predictions", [])
    structure_info = None
    top1_name = None
    top1_prob = None

    if top_preds:
        # top_predictions가 [(label, prob), ...] 형태라고 가정
        top1_name, top1_prob = top_preds[0]
        if top1_name and str(top1_name).lower() != "other":
            try:
                hits = find_protein_with_3d(
                    protein_name=str(top1_name),
                    organism=organism_hint,
                    max_results=3,
                    reviewed=True,
                )
            except Exception as e:
                print(f"[WARN] find_protein_with_3d 실패: {e}")
                hits = []

            preferred = hits[0].get("preferred_3d") if hits else None
            structure_info = {
                "protein_name": top1_name,
                "top1_probability": top1_prob,
                "uniprot_hits": hits,
                "preferred_3d": preferred,
            }
        else:
            # Other → 빈 자료
            structure_info = {
                "protein_name": top1_name,
                "top1_probability": top1_prob,
                "uniprot_hits": [],
                "preferred_3d": None,
            }

    return {
        "ok": True,
        "index": index,
        "id": payload.get("id"),
        "translation": {
            "protein_sequence": protein_seq,
            "info": trans_info,
        },
        "prediction": pred,
        "task3_structure": structure_info,
    }


# ---------------------------------------------------------------------------
# 4. 추론 API (단일 + 배치)
# ---------------------------------------------------------------------------
@api_bp.route("/predict", methods=["POST"])
def infer():
    """
    - 단일 모드:
        { "sequence": "...", ... }

    - 배치 모드:
        {
          "items": [ {...}, {...}, ... ],
          "frame": 0, "task3_threshold": 0.5, ... (공통 기본값)
        }
    """
    auth_error = check_api_key(request)
    if auth_error is not None:
        return auth_error

    data = request.get_json(silent=True) or {}
    items = data.get("items")

    # 공통 기본값 (배치 시 각 item에서 override 가능)
    default_params = {
        "seq_type": data.get("seq_type", "auto"),
        "frame": int(data.get("frame", 0)),
        "stop_at_stop": bool(data.get("stop_at_stop", False)),
        "task3_threshold": float(data.get("task3_threshold", 0.5)),
        "organism_hint": data.get("organism_hint"),
    }

    # === 배치 모드 ===
    if isinstance(items, list):
        results = []
        for idx, item in enumerate(items):
            res = _infer_single_item(item or {}, default_params, index=idx)
            results.append(res)

        return jsonify(
            {
                "ok": True,
                "batch": True,
                "model_version": get_model_version(),
                "results": results,
            }
        )

    # === 단일 모드 ===
    res = _infer_single_item(data, default_params, index=0)

    if not res.get("ok"):
        err = res.get("error", "")
        status = 400 if ("서열 변환 실패" in err or "sequence 필드" in err) else 500
        body = {"ok": False, "error": err}
        if "translation_info" in res:
            body["translation_info"] = res["translation_info"]
        return jsonify(body), status

    return jsonify(
        {
            "ok": True,
            "model_version": get_model_version(),
            "translation": res["translation"],
            "prediction": res["prediction"],
            "task3_structure": res["task3_structure"],
        }
    )


# ---------------------------------------------------------------------------
# 5. 추론 예제 생성 API
# ---------------------------------------------------------------------------
@api_bp.route("/example_data", methods=["GET"])
def example_data():
    """
    추론 예제를 리턴하는 API

    query:
      - num_people: 사람 수 (기본 4)
      - samples_per_person: 사람당 데이터 수 (기본 3)
      - disease_ratio: 질병군 비율 (기본 0.9)

    특징:
      - protein_type == "Other" 는 절대 사용하지 않음
      - seq_type 은 항상 "protein"
      - 총 개수 = num_people * samples_per_person 정확히 보장
    """
    auth_error = check_api_key(request)
    if auth_error is not None:
        return auth_error

    try:
        num_people = int(request.args.get("num_people", "4"))
        samples_per_person = int(request.args.get("samples_per_person", "3"))
    except ValueError:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "num_people, samples_per_person는 정수여야 합니다.",
                }
            ),
            400,
        )

    if num_people <= 0 or samples_per_person <= 0:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "num_people, samples_per_person는 1 이상이어야 합니다.",
                }
            ),
            400,
        )

    try:
        disease_ratio = float(request.args.get("disease_ratio", "0.9"))
    except ValueError:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "disease_ratio는 0.0 ~ 1.0 사이의 실수여야 합니다.",
                }
            ),
            400,
        )

    if not (0.0 <= disease_ratio <= 1.0):
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "disease_ratio는 0.0 ~ 1.0 사이여야 합니다.",
                }
            ),
            400,
        )

    try:
        data = _generate_example_cases(
            num_people=num_people,
            samples_per_person=samples_per_person,
            disease_ratio=disease_ratio,
        )
    except Exception as e:
        return jsonify({"ok": False, "error": f"예제 생성 실패: {e}"}), 500

    return jsonify({"ok": True, **data})
