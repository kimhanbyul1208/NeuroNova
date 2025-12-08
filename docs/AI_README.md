# Brain Tumor CDSS (Clinical Decision Support System)

뇌종양 진단 및 치료 의사결정을 지원하는 AI 기반 임상 의사결정 지원 시스템

## 주요 기능

| 기능 | 설명 | 모듈 |
|------|------|------|
| **종양 등급 분류** | WHO Grade II/III/IV 예측 | `models/multimodal_fusion.py` |
| **분자 마커 예측** | IDH, MGMT 상태 예측 | `models/multimodal_fusion.py` |
| **생존 예후 분석** | 생존 기간 예측 | `train_survival.py` |
| **Radiomics** | 35개 영상 특징 추출 | `utils/advanced_features.py` |
| **치료 반응 예측** | TMZ/RT 반응 예측 | `utils/advanced_features.py` |
| **RANO 평가** | 종양 반응 표준 평가 | `utils/advanced_features.py` |
| **XAI (설명가능 AI)** | GradCAM, 불확실성 정량화 | `utils/clinical_utils.py` |
| **임상 리포트** | 한/영 PDF 리포트 생성 | `utils/advanced_features.py` |

## 빠른 시작

```bash
# 1. 환경 설정
pip install -r requirements.txt

# 2. 데모 실행
python demo_cdss.py

# 3. 모델 학습
python train_ucsf_pdgm.py
```

## 학습 결과

```
Dataset: UCSF-PDGM (85 patients)
Model: MultimodalFusionModel (5.75M params)
Best Val AUC: 1.0000
Training Time: ~15분 (RTX 2060)
```

## 프로젝트 구조

```
brain_tumor_cdss/
├── models/
│   ├── multimodal_fusion.py    # 멀티모달 퓨전 모델
│   ├── segmentation.py         # 종양 세그멘테이션
│   └── treatment_response.py   # 치료 반응 모델
├── preprocessing/
│   ├── mri_preprocessing.py    # MRI 전처리
│   └── dataset.py              # 데이터셋 클래스
├── utils/
│   ├── clinical_utils.py       # 임상 유틸리티 (XAI, NCCN)
│   ├── advanced_features.py    # 고급 기능 (Radiomics, RANO)
│   └── visualization.py        # 시각화
├── immunotherapy/
│   └── immunotherapy_advisor.py # 면역치료 조언
├── data/
│   ├── raw/                    # 원본 데이터
│   └── processed/              # 전처리된 데이터
├── checkpoints/                # 학습된 모델
├── reports/                    # 생성된 리포트
├── train_ucsf_pdgm.py         # 학습 스크립트
├── demo_cdss.py               # 통합 데모
└── app.py                     # Streamlit 웹앱
```

## 핵심 기능 상세

### 1. 종양 등급 분류
```python
from models.multimodal_fusion import MultimodalFusionModel

model = MultimodalFusionModel(
    in_channels=4,      # T1, T1c, T2, FLAIR
    num_classes=4,      # Grade II, III, IV, Unknown
    clinical_dim=10
)
```

### 2. Radiomics 특징 추출
```python
from utils.advanced_features import RadiomicsExtractor

extractor = RadiomicsExtractor()
features = extractor.extract_features(mri_volume, tumor_mask)

# 35개 특징: 강도(15) + 형태(13) + 텍스처(7)
print(f"Volume: {features.shape_features['volume_cm3']:.2f} cm³")
```

### 3. 치료 반응 예측
```python
from utils.advanced_features import TreatmentResponsePredictor

predictor = TreatmentResponsePredictor()
response = predictor.predict_response(
    grade="IV",
    idh_status="Wildtype",
    mgmt_status="Methylated",
    tumor_volume=35.0
)
print(f"TMZ 반응: {response.tmz_response_category}")
# TMZ 반응: Likely Responder (70%)
```

### 4. RANO 평가
```python
from utils.advanced_features import RANOEvaluator

evaluator = RANOEvaluator()
assessment = evaluator.evaluate(
    baseline_mask=pre_treatment_mask,
    current_mask=post_treatment_mask
)
print(f"반응: {assessment.response_category}")
# 반응: PR (Partial Response)
```

### 5. 임상 리포트 생성
```python
from utils.advanced_features import PDFReportGenerator

generator = PDFReportGenerator(language="ko")  # 한국어
html = generator.generate_html_report(prediction, patient_id, study_date)
```

## 데이터셋

### UCSF-PDGM (현재 사용)

| 항목 | 내용 |
|------|------|
| **환자 수** | 501명 (메타데이터 기준) |
| **NIfTI 데이터** | 300명 (다운로드 완료) |
| **위치** | `data/raw/UCSF-PDGM/nifti/` |
| **메타데이터** | `UCSF-PDGM-metadata_v5.csv` |

**환자 통계:**
| 항목 | 값 |
|------|-----|
| 총 환자 | 501명 |
| 성별 | 남 299 / 여 202 |
| 평균 나이 | 56.9세 |
| 평균 생존 | 575일 (1.6년) |

**WHO Grade 분포:**
| Grade | 환자 수 |
|-------|--------|
| Grade 2 | 56명 (11.2%) |
| Grade 3 | 43명 (8.6%) |
| Grade 4 | 402명 (80.2%) |

**진단 분포:**
| 진단 | 환자 수 |
|------|--------|
| Glioblastoma, IDH-wildtype | 374명 (74.7%) |
| Astrocytoma, IDH-mutant | 90명 (18.0%) |
| Astrocytoma, IDH-wildtype | 24명 (4.8%) |
| Oligodendroglioma, IDH-mutant | 13명 (2.6%) |

**분자 마커:**
| IDH 상태 | 환자 수 |
|----------|--------|
| Wildtype | 398명 (79.4%) |
| Mutated | 103명 (20.6%) |

| MGMT 상태 | 환자 수 |
|-----------|--------|
| Positive (메틸화) | 302명 (60.3%) |
| Negative | 114명 (22.8%) |
| Unknown | 85명 (17.0%) |

**생존 상태:**
- 사망: 251명 (50.1%)
- 생존: 250명 (49.9%)

**MRI 모달리티 (환자당 24개 파일):**
```
T1, T1c, T2, FLAIR          # 기본 구조 영상
DWI, ADC                    # 확산 영상
DTI (FA, MD, L1, L2, L3)    # 확산 텐서
ASL                         # 관류 영상
SWI                         # 자화율 영상
tumor_segmentation          # 종양 세그멘테이션
brain_segmentation          # 뇌 세그멘테이션
```

**메타데이터 컬럼:**
| 변수 | 설명 | 예시 |
|------|------|------|
| ID | 환자 ID | UCSF-PDGM-004 |
| Sex | 성별 | M, F |
| Age at MRI | 나이 | 66 |
| WHO CNS Grade | 등급 | 2, 3, 4 |
| Final pathologic diagnosis | 진단명 | Glioblastoma, IDH-wildtype |
| IDH | IDH 돌연변이 | wildtype, IDH1 p.R132H |
| MGMT status | MGMT 메틸화 | positive, negative |
| 1p/19q | 염색체 공결실 | codel, non-codel |
| 1-dead 0-alive | 생존 상태 | 0, 1 |
| OS | 전체 생존 기간 (일) | 1303 |
| EOR | 절제 범위 | GTR, STR, Biopsy |
| BraTS21 ID | BraTS 2021 ID | BraTS2021_00097 |

## 임상 가이드라인

### NCCN 기반 치료 권고
- **Grade II**: 관찰 또는 방사선 치료
- **Grade III**: RT + TMZ/PCV
- **Grade IV (GBM)**: 최대 절제 + RT (60Gy) + TMZ → 유지 TMZ

### RANO 기준
| 카테고리 | 기준 |
|----------|------|
| CR | 조영증강 종양 완전 소실 |
| PR | ≥50% 감소 |
| SD | <50% 감소, <25% 증가 |
| PD | ≥25% 증가 또는 새 병변 |

## 시스템 요구사항

- Python 3.10+
- PyTorch 2.0+
- CUDA 11.8+ (GPU 사용 시)
- RAM: 16GB+
- GPU: RTX 2060+ (권장)

## 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/brain_tumor_cdss.git
cd brain_tumor_cdss

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt
```

## 웹 인터페이스

```bash
# Streamlit 앱 실행
streamlit run app.py
```

## 참고 문헌

1. WHO Classification of CNS Tumors (2021)
2. NCCN Guidelines for CNS Cancers
3. RANO Criteria for Glioma Response Assessment
4. MGMT Promoter Methylation and TMZ Response

## 면책 조항

이 시스템은 연구 및 교육 목적으로 개발되었습니다.
실제 임상 의사결정에 사용하기 전에 반드시 의료 전문가의 검토가 필요합니다.
AI 예측은 참고용이며, 최종 진단은 병리 검사 결과에 근거해야 합니다.

## 라이선스

MIT License
