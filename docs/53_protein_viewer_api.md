# ProteinViewer 컴포넌트 API 문서

## 개요 (Overview)
`ProteinViewer`는 `3Dmol.js` 라이브러리를 사용하여 3D 단백질 구조를 시각화하는 React 함수형 컴포넌트입니다. RCSB PDB 데이터베이스에서 PDB 데이터를 가져와 WebGL 지원 캔버스에 렌더링합니다.

> **참고**: 이 컴포넌트는 WSL 환경에서의 호환성과 안정성을 위해 **CDN**을 통해 `3Dmol.js`를 사용합니다.

## 사용법 (Usage)

### 1. 설정 (index.html)
`index.html` 파일에 3Dmol.js 스크립트가 포함되어 있는지 확인하세요:
```html
<script src="https://3Dmol.org/build/3Dmol-min.js"></script>
```

### 2. 컴포넌트 사용 (Component Usage)
```jsx
import { ProteinViewer } from '../components';

const MyComponent = () => {
    return (
        <ProteinViewer 
            pdbId="1UBQ" 
            width="100%" 
            height="500px" 
            style={{ border: '1px solid #ccc' }}
        />
    );
};
```

## 속성 (Props)

| 속성명 (Prop Name) | 타입 (Type) | 기본값 (Default) | 설명 (Description) |
|---|---|---|---|
| `pdbId` | `string` | **필수 (Required)** | 시각화할 단백질의 4글자 PDB ID (예: '1UBQ', '4HHB'). |
| `width` | `string` | `'100%'` | 뷰어 컨테이너의 너비. 유효한 CSS 너비 값을 사용할 수 있습니다. |
| `height` | `string` | `'400px'` | 뷰어 컨테이너의 높이. 유효한 CSS 높이 값을 사용할 수 있습니다. |
| `style` | `object` | `{}` | 컨테이너 요소에 적용할 추가 CSS 스타일 객체입니다. |

## 주요 기능 (Features)

1.  **자동 로딩**: `pdbId`가 변경되면 자동으로 단백질 구조를 가져와 로드합니다.
2.  **카툰(Cartoon) 표현**: 단백질을 스펙트럼 색상의 표준 "Cartoon" 스타일로 렌더링합니다.
3.  **상호작용**: 마우스를 이용한 회전(왼쪽 클릭), 확대/축소(스크롤), 이동(오른쪽 클릭)을 지원합니다.
4.  **반응형**: 컨테이너 크기에 맞춰 조정됩니다 (`width`와 `height`를 적절히 설정해야 함).
5.  **생명주기 관리**: 메모리 누수를 방지하기 위해 WebGL 컨텍스트의 초기화 및 정리를 자동으로 처리합니다.

## 의존성 (Dependencies)

*   `react`
*   `3Dmol.js` (CDN을 통해 로드, npm 패키지 불필요)

## 구현 상세 (Implementation Details)

이 컴포넌트는 `useRef`를 사용하여 DOM 요소에 접근하고, `useEffect`를 사용하여 전역 `window.$3Dmol` 객체를 통해 `3Dmol` 뷰어 인스턴스를 관리합니다.

```javascript
// 초기화 (Initialization)
const v = window.$3Dmol.createWebGLViewer(element, config);

// 데이터 로딩 (Loading Data)
viewer.addModel(pdbData, "pdb");
viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
viewer.zoomTo();
viewer.render();
```
