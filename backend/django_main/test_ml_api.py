"""
Django ML API 테스트 스크립트

사용법:
    python test_ml_api.py

환경:
    Django 개발 서버가 실행 중이어야 함 (http://localhost:8000)
    Flask ML 서버가 실행 중이어야 함 (http://127.0.0.1:9000)
"""

import requests
import json
from datetime import datetime


# 색상 출력을 위한 ANSI 코드
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text):
    """헤더 출력"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


def print_success(text):
    """성공 메시지 출력"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")


def print_error(text):
    """에러 메시지 출력"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")


def print_info(text):
    """정보 메시지 출력"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


def print_warning(text):
    """경고 메시지 출력"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")


def print_json(data):
    """JSON 데이터 출력"""
    print(json.dumps(data, indent=2, ensure_ascii=False))


# Django ML API 기본 URL
BASE_URL = "http://localhost:8000/ml/v1"


def test_health_check():
    """1. 헬스 체크 테스트"""
    print_header("1. Flask ML 서버 헬스 체크")

    try:
        response = requests.get(f"{BASE_URL}/status/", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print_success(f"Flask ML 서버 상태: {data.get('status')}")
            print_info(f"모델 버전: {data.get('model_version')}")
            return True
        else:
            print_error(f"상태 확인 실패: {response.status_code}")
            print_json(response.json())
            return False

    except requests.exceptions.ConnectionError:
        print_error("Django 서버에 연결할 수 없습니다. Django 서버가 실행 중인지 확인하세요.")
        return False
    except requests.exceptions.Timeout:
        print_error("요청 시간 초과")
        return False
    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def test_model_info():
    """2. 모델 정보 조회 테스트"""
    print_header("2. 모델 정보 조회")

    try:
        response = requests.get(f"{BASE_URL}/model-info/", timeout=5)

        if response.status_code == 200:
            data = response.json()
            print_success("모델 정보 조회 성공")
            print_json(data)
            return True
        else:
            print_error(f"모델 정보 조회 실패: {response.status_code}")
            print_json(response.json())
            return False

    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def test_single_prediction():
    """3. 단일 샘플 추론 테스트"""
    print_header("3. 단일 샘플 AI 추론")

    # 테스트 데이터
    test_data = {
        "doctor_name": "테스트의사",
        "patient_name": "테스트환자",
        "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
        "seq_type": "protein",
        "task3_threshold": 0.5,
        "organism_hint": "Influenza A virus"
    }

    print_info("요청 데이터:")
    print_json(test_data)

    try:
        response = requests.post(
            f"{BASE_URL}/predict/",
            json=test_data,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_success("AI 추론 성공!")
            print_info(f"모델 버전: {data.get('model_version')}")

            # 결과 요약
            if 'prediction' in data:
                pred = data['prediction']

                print_info("\n=== 추론 결과 ===")

                if 'task1' in pred:
                    task1 = pred['task1']
                    print(f"  Task 1 (병원체 여부): {task1.get('is_pathogen')} "
                          f"(확률: {task1.get('probability', 0):.2%})")

                if 'task2' in pred:
                    task2 = pred['task2']
                    print(f"  Task 2 (단백질 타입): {task2.get('protein_type')} "
                          f"(확률: {task2.get('probability', 0):.2%})")

                if 'task3' in pred:
                    task3 = pred['task3']
                    top_preds = task3.get('top_predictions', [])
                    if top_preds:
                        print(f"  Task 3 (상세 분류):")
                        for i, (label, prob) in enumerate(top_preds[:3], 1):
                            print(f"    {i}. {label}: {prob:.2%}")

            # 3D 구조 정보
            if 'task3_structure' in data:
                structure = data['task3_structure']
                if structure and structure.get('preferred_3d'):
                    print_info(f"\n3D 구조: {structure['preferred_3d']}")

            return True

        else:
            print_error(f"AI 추론 실패: {response.status_code}")
            print_json(response.json())
            return False

    except requests.exceptions.Timeout:
        print_error("요청 시간 초과 (30초). Flask 서버가 응답하지 않습니다.")
        return False
    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def test_batch_prediction():
    """4. 배치 추론 테스트"""
    print_header("4. 배치 샘플 AI 추론")

    # 테스트 데이터 (2개 샘플)
    test_data = {
        "doctor_name": "테스트의사",
        "patient_name": "배치테스트환자",
        "items": [
            {
                "id": "sample1",
                "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
                "seq_type": "protein"
            },
            {
                "id": "sample2",
                "sequence": "ATGGCTGCAGATGGTGCAATGCCA",
                "seq_type": "dna",
                "frame": 0
            }
        ],
        "task3_threshold": 0.5
    }

    print_info(f"요청 샘플 수: {len(test_data['items'])}")

    try:
        response = requests.post(
            f"{BASE_URL}/predict/",
            json=test_data,
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()
            print_success("배치 추론 성공!")

            results = data.get('results', [])
            print_info(f"총 {len(results)}개 샘플 처리 완료")

            success_count = sum(1 for r in results if r.get('ok'))
            fail_count = len(results) - success_count

            print_info(f"성공: {success_count}, 실패: {fail_count}")

            # 각 샘플 결과 요약
            for idx, result in enumerate(results, 1):
                if result.get('ok'):
                    pred = result.get('prediction', {})
                    task2 = pred.get('task2', {})
                    protein_type = task2.get('protein_type', 'Unknown')
                    print(f"  샘플 {idx} ({result.get('id')}): {protein_type}")
                else:
                    print_error(f"  샘플 {idx} ({result.get('id')}): {result.get('error')}")

            return True

        else:
            print_error(f"배치 추론 실패: {response.status_code}")
            print_json(response.json())
            return False

    except requests.exceptions.Timeout:
        print_error("요청 시간 초과 (60초)")
        return False
    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def test_history():
    """5. 추론 이력 조회 테스트"""
    print_header("5. 추론 이력 조회")

    try:
        # 전체 이력 조회
        response = requests.get(f"{BASE_URL}/history/", timeout=5)

        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            results = data.get('results', [])

            print_success(f"총 {count}개의 추론 이력 발견")

            if results:
                print_info("\n최근 추론 이력 (최대 5개):")
                for i, log in enumerate(results[:5], 1):
                    print(f"\n  {i}. ID: {log['id']}")
                    print(f"     의사: {log['doctor_name']}")
                    print(f"     환자: {log['patient_name']}")
                    print(f"     시간: {log['created_at']}")

                    # 결과 요약
                    output = log.get('output_data', {})
                    if output.get('ok'):
                        pred = output.get('prediction', {})
                        task2 = pred.get('task2', {})
                        print(f"     결과: {task2.get('protein_type', 'N/A')}")
            else:
                print_warning("아직 추론 이력이 없습니다.")

            return True

        else:
            print_error(f"이력 조회 실패: {response.status_code}")
            return False

    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def test_history_filter():
    """6. 추론 이력 필터링 테스트"""
    print_header("6. 추론 이력 필터링 (특정 의사)")

    try:
        # 테스트의사의 이력만 조회
        params = {
            'doctor': '테스트의사'
        }
        response = requests.get(f"{BASE_URL}/history/", params=params, timeout=5)

        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)

            print_success(f"'테스트의사' 의사의 이력: {count}개")

            if count > 0:
                results = data.get('results', [])
                print_info(f"가장 최근 이력: {results[0]['created_at']}")

            return True

        else:
            print_error(f"이력 조회 실패: {response.status_code}")
            return False

    except Exception as e:
        print_error(f"예외 발생: {str(e)}")
        return False


def main():
    """전체 테스트 실행"""
    print_header("Django ML API 테스트 시작")
    print_info(f"테스트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Django 서버: {BASE_URL}")

    # 테스트 실행
    tests = [
        ("헬스 체크", test_health_check),
        ("모델 정보 조회", test_model_info),
        ("단일 샘플 추론", test_single_prediction),
        ("배치 샘플 추론", test_batch_prediction),
        ("추론 이력 조회", test_history),
        ("추론 이력 필터링", test_history_filter),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print_error(f"테스트 실행 중 예외 발생: {str(e)}")
            results.append((test_name, False))

    # 결과 요약
    print_header("테스트 결과 요약")

    passed = sum(1 for _, success in results if success)
    failed = len(results) - passed

    for test_name, success in results:
        if success:
            print_success(f"{test_name}: 성공")
        else:
            print_error(f"{test_name}: 실패")

    print(f"\n{Colors.BOLD}총 {len(results)}개 테스트{Colors.ENDC}")
    print(f"{Colors.OKGREEN}성공: {passed}{Colors.ENDC}")
    print(f"{Colors.FAIL}실패: {failed}{Colors.ENDC}")

    if failed == 0:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ 모든 테스트 통과!{Colors.ENDC}")
        return 0
    else:
        print(f"\n{Colors.FAIL}{Colors.BOLD}✗ 일부 테스트 실패{Colors.ENDC}")
        return 1


if __name__ == "__main__":
    exit(main())
