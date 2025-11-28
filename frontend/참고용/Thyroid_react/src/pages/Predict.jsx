import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

export default function Predict() {
  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [currentPatient, setCurrentPatient] = useState(null); // 환자 상세 + predictions
  const [predList, setPredList] = useState([]);

  const [loading, setLoading] = useState(false);

  // 1) 스키마 + 환자목록 로드
  useEffect(() => {
    (async () => {
      // 스키마
      try {
        const s = await api.get("/schema", { params: { minimal: 1 } });
        const feats = Array.isArray(s.data) ? s.data : [];
        setFeatures(feats);
        const init = {};
        feats.forEach((f) => (init[f] = ""));
        setForm(init);
      } catch (e) {
        console.error("load schema failed:", e);
      }
      // 환자 목록
      try {
        const r = await api.get("/patients"); // 목록 (뒤 슬래시 X)
        const data = r.data.results ?? r.data;
        if (Array.isArray(data)) setPatients(data);
      } catch (e) {
        console.error("load patients failed:", e);
        setPatients([]);
      }
    })();
  }, []);

  // 2) 환자 선택 시 환자 상세(= predictions 포함) 로드
  useEffect(() => {
    if (!patientId) {
      setCurrentPatient(null);
      setPredList([]);
      return;
    }
    loadPatientDetail(patientId);
  }, [patientId]);

  // ===== 환자 상세 로드: GET /api/patients/:id  (predictions 포함) =====
  async function loadPatientDetail(pid) {
    try {
      const r = await api.get(`/patients/${pid}`); // detail (뒤 슬래시 X)
      const p = r.data;
      setCurrentPatient(p);

      const preds = Array.isArray(p?.predictions) ? p.predictions : [];
      // predicted_at DESC 정렬
      const sorted = [...preds].sort((a, b) =>
        (b.predicted_at || "").localeCompare(a.predicted_at || "")
      );
      setPredList(sorted);
    } catch (e) {
      console.error("load patient detail failed:", e);
      setCurrentPatient(null);
      setPredList([]);
    }
  }

  const order = useMemo(() => features, [features]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 예측 실행
  async function onPredict(e) {
    e.preventDefault();
    if (features.length === 0) return;

    const values = order.map((f) => {
      const v = form[f];
      if (v === "" || v == null) return v;
      const num = Number(v);
      return Number.isFinite(num) ? num : v;
    });

    const payload = { values, order };
    if (patientId) payload.patient_id = Number(patientId);

    setLoading(true);
    setResult(null);
    try {
      const r = await api.post(`/predict`, payload, { params: { minimal: 0 } });
      setResult(r.data || null);

      // 예측 성공 직후: 환자 상세 재조회 → predictions 최신 반영
      if (patientId) {
        await loadPatientDetail(patientId);
      }
    } catch (e) {
      console.error("predict failed:", e);
      alert("예측 실패");
    } finally {
      setLoading(false);
    }
  }

  // 예측 삭제
  async function deletePrediction(id) {
    if (!confirm(`예측 #${id} 를 삭제할까요?`)) return;
    try {
      await api.delete(`/patients/predictions/${id}`); // 뒤 슬래시 없음
      // 삭제 직후: 환자 상세 재조회 → 리스트 갱신
      if (patientId) {
        await loadPatientDetail(patientId);
      }
    } catch (e) {
      console.error("delete prediction failed:", e);
      alert("삭제 실패");
    }
  }

  function resetForm() {
    const cleared = {};
    features.forEach((f) => (cleared[f] = ""));
    setForm(cleared);
    setResult(null);
  }

  return (
    <div style={{ padding: 20, display: "grid", gap: 16 }}>
      <h2>Thyroid Predict</h2>

      {/* 환자 선택 */}
      <section style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label><b>환자 선택:</b></label>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">(선택 안 함 — 단발성 예측)</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} {p.name} {p.birth_date ? `(${p.birth_date})` : ""} {p.sex ? `/${p.sex}` : ""}
            </option>
          ))}
        </select>
        {patientId ? <span style={{ color: "#0a7" }}>저장 모드(의사/관리자)</span> : <span>미저장 모드</span>}
      </section>

      {/* 선택 환자 정보 간단 표시 */}
      {currentPatient && (
        <section style={{ background: "#fbfbfb", padding: 12, borderRadius: 8 }}>
          <b>선택 환자:</b>{" "}
          #{currentPatient.id} {currentPatient.name}{" "}
          {currentPatient.birth_date ? `(${currentPatient.birth_date})` : ""}{" "}
          {currentPatient.sex ? `/${currentPatient.sex}` : ""}
        </section>
      )}

      {/* 입력 폼 */}
      <form onSubmit={onPredict} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {features.map((f) => (
            <div key={f} style={{ display: "grid", gap: 4 }}>
              <label htmlFor={`feat-${f}`} style={{ fontSize: 12, color: "#555" }}>{f}</label>
              <input
                id={`feat-${f}`}
                placeholder={f}
                value={form[f] ?? ""}
                onChange={(e) => updateField(f, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? "예측 중..." : "Predict"}</button>
          <button type="button" onClick={resetForm}>입력 초기화</button>
        </div>
      </form>

      {/* 단발성 결과 요약 */}
      {result && (
        <section>
          <h3>최근 예측 결과</h3>
          <div style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 12, borderRadius: 6 }}>
            <p><b>pred:</b> {Array.isArray(result.pred) ? result.pred.join(", ") : String(result.pred)}</p>
            {"proba" in result && (
              <p><b>proba:</b> {Array.isArray(result.proba)
                ? result.proba.map((x) => (x != null ? Number(x).toFixed?.(4) ?? x : "-")).join(", ")
                : (result.proba ?? "-")}
              </p>
            )}
            {result.model_version && <p><b>model_version:</b> {result.model_version}</p>}
          </div>
        </section>
      )}

      {/* 예측 이력 (선택 환자) */}
      {patientId && (
        <section>
          <h3>예측 이력 (환자 #{patientId})</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th>ID</th>
                <th>pred</th>
                <th>proba</th>
                <th>model</th>
                <th>predicted_at</th>
                <th>actions</th>
              </tr>
            </thead>
            <tbody>
              {predList.length > 0 ? (
                predList.map((item) => {
                  const pred = Array.isArray(item.result?.pred)
                    ? item.result.pred.join(", ")
                    : String(item.result?.pred ?? "-");
                  const proba = Array.isArray(item.result?.proba)
                    ? item.result.proba.map((x) => (x != null ? Number(x).toFixed?.(4) ?? x : "-")).join(", ")
                    : (item.result?.proba ?? "-");
                  const mv = item.result?.model_version ?? "-";
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{pred}</td>
                      <td>{proba}</td>
                      <td>{mv}</td>
                      <td>{item.predicted_at || "-"}</td>
                      <td>
                        <button onClick={() => deletePrediction(item.id)}>삭제</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6}>예측 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
