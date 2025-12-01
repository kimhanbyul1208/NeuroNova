import React, { useEffect, useRef, useState } from "react";
import * as $3Dmol from "3dmol/build/3Dmol.js";
import View3D from "@egjs/react-view3d";

function App() {
  // =========================
  // 1. 단백질 3Dmol 뷰어 상태
  // =========================
  const viewerContainerRef = useRef(null);
  const viewerRef = useRef(null);

  const [proteins, setProteins] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedProtein =
    proteins.length > 0 && selectedIndex < proteins.length
      ? proteins[selectedIndex]
      : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [styleMode, setStyleMode] = useState("cartoon");
  const [darkBg, setDarkBg] = useState(false);

  // 1-1) 앱 시작 시 proteins.json 로드
  useEffect(() => {
    async function loadProteins() {
      try {
        const res = await fetch("/proteins.json");
        if (!res.ok) {
          throw new Error(`proteins.json 로드 실패: HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("proteins.json이 비어 있거나 배열이 아닙니다.");
        }
        setProteins(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "단백질 목록을 불러오는 중 오류가 발생했습니다."
        );
      }
    }

    loadProteins();
  }, []);

  // 1-2) 3Dmol Viewer 생성 (최초 1회)
  useEffect(() => {
    if (viewerContainerRef.current && !viewerRef.current) {
      viewerRef.current = $3Dmol.createViewer(viewerContainerRef.current, {
        backgroundColor: "white",
      });
    }
  }, []);

  // 1-3) 선택된 단백질이 바뀔 때마다 AlphaFold 구조 로딩
  useEffect(() => {
    if (!selectedProtein || !viewerRef.current) return;

    async function fetchAndLoadStructure() {
      try {
        setLoading(true);
        setError(null);

        const uniprotId = selectedProtein.uniprotId;
        const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(
              `AlphaFold DB에 UniProt ID "${uniprotId}" 구조가 없습니다.`
            );
          } else {
            throw new Error(`AlphaFold API 호출 실패: HTTP ${res.status}`);
          }
        }

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("예측 데이터 배열이 비어 있습니다.");
        }

        let prediction =
          data.find(
            (p) =>
              p.uniprotAccession &&
              p.uniprotAccession.toUpperCase() === uniprotId.toUpperCase()
          ) ||
          data.find(
            (p) =>
              p.uniprotAccession &&
              p.uniprotAccession
                .toUpperCase()
                .startsWith(uniprotId.toUpperCase())
          ) ||
          data[0];

        if (!prediction) {
          throw new Error("예측 엔트리를 찾지 못했습니다.");
        }

        const pdbUrl = prediction.pdbUrl;
        if (!pdbUrl) {
          throw new Error("선택된 예측 엔트리에 pdbUrl이 없습니다.");
        }

        const viewer = viewerRef.current;
        viewer.clear();

        $3Dmol.download(`url:${pdbUrl}`, viewer, {}, function () {
          applyCurrentStyle(viewer);
          viewer.zoomTo();
          viewer.render();
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "구조 로딩 중 알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }

    fetchAndLoadStructure();
  }, [selectedProtein]);

  // 단백질 스타일 적용
  const applyCurrentStyle = (viewer) => {
    viewer.setStyle({}, {});
    if (styleMode === "cartoon") {
      viewer.setStyle({}, { cartoon: { color: "spectrum" } });
    } else {
      viewer.setStyle({}, { stick: { radius: 0.15 } });
    }
  };

  // 단백질 툴바
  const handleResetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.zoomTo();
    viewer.render();
  };

  const handleToggleSpin = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !spinning;
    viewer.spin(next);
    setSpinning(next);
    viewer.render();
  };

  const handleToggleStyle = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const nextMode = styleMode === "cartoon" ? "stick" : "cartoon";
    setStyleMode(nextMode);
    applyCurrentStyle(viewer);
    viewer.render();
  };

  const handleToggleBackground = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !darkBg;
    setDarkBg(next);
    viewer.setBackgroundColor(next ? "black" : "white");
    viewer.render();
  };

  const handleSaveImage = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const dataUrl = viewer.pngURI();
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = selectedProtein
      ? `${selectedProtein.uniprotId}.png`
      : "structure.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectChange = (e) => {
    setSelectedIndex(parseInt(e.target.value, 10));
  };

  // =========================
  // 2. 장기 View3D 상태
  // =========================
  const [organs, setOrgans] = useState([]);
  const [selectedOrganIndex, setSelectedOrganIndex] = useState(0);

  useEffect(() => {
    async function loadOrgans() {
      try {
        const res = await fetch("/organs.json");
        if (!res.ok) {
          console.error("organs.json 로드 실패:", res.status);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.error("organs.json이 비어 있거나 배열이 아닙니다.");
          return;
        }
        setOrgans(data);
        setSelectedOrganIndex(0);
      } catch (err) {
        console.error("장기 목록 로딩 오류:", err);
      }
    }

    loadOrgans();
  }, []);

  const selectedOrgan =
    organs.length > 0 && selectedOrganIndex < organs.length
      ? organs[selectedOrganIndex]
      : null;

  const handleOrganChange = (e) => {
    setSelectedOrganIndex(parseInt(e.target.value, 10));
  };

  // =========================
  // 렌더링
  // =========================
  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      {/* ===== 단백질 3D 섹션 ===== */}
      <div style={{ marginBottom: "12px" }}>
        <label>
          단백질 선택:{" "}
          <select
            value={selectedIndex}
            onChange={handleSelectChange}
            disabled={proteins.length === 0}
          >
            {proteins.map((p, idx) => (
              <option key={p.uniprotId} value={idx}>
                {p.uniprotId} | {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "8px" }}>
        {selectedProtein ? (
          <>
            <strong>선택된 단백질:</strong>{" "}
            {selectedProtein.uniprotId} ({selectedProtein.name})
          </>
        ) : (
          <span>단백질 목록 로딩 중...</span>
        )}
      </div>
      {loading && <div>AlphaFold 구조 불러오는 중...</div>}
      {error && <div style={{ color: "red" }}>에러: {error}</div>}

      <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
        <button onClick={handleResetView} disabled={!selectedProtein}>
          뷰 리셋
        </button>
        <button onClick={handleToggleSpin} disabled={!selectedProtein}>
          회전 {spinning ? "끄기" : "켜기"}
        </button>
        <button onClick={handleToggleStyle} disabled={!selectedProtein}>
          스타일:{" "}
          {styleMode === "cartoon" ? "Cartoon → Stick" : "Stick → Cartoon"}
        </button>
        <button onClick={handleToggleBackground} disabled={!selectedProtein}>
          배경: {darkBg ? "Dark → Light" : "Light → Dark"}
        </button>
        <button onClick={handleSaveImage} disabled={!selectedProtein}>
          PNG 저장
        </button>
      </div>

      <div
        ref={viewerContainerRef}
        style={{
          width: "800px",
          height: "600px",
          border: "1px solid #ccc",
          marginTop: "4px",
          position: "relative",
        }}
      />

      <hr style={{ margin: "32px 0" }} />

      {/* ===== 장기 3D 섹션 ===== */}
      <h2>장기 3D 뷰어</h2>

      <div style={{ marginBottom: "8px" }}>
        <label>
          장기 선택:{" "}
          <select
            value={selectedOrganIndex}
            onChange={handleOrganChange}
            disabled={organs.length === 0}
          >
            {organs.map((o, idx) => (
              <option key={o.id} value={idx}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedOrgan ? (
        <>
          {/* 콤보 변경 시 강제 리마운트 */}
          <View3D
            key={selectedOrgan.id}
            src={selectedOrgan.modelPath}
            style={{
              width: "600px",
              height: "400px",
              border: "1px solid #ccc",
            }}
          />
        </>
      ) : (
        <div>장기 목록 로딩 중...</div>
      )}
    </div>
  );
}

export default App;
