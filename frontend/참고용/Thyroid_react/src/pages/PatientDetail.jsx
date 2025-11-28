import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [preds, setPreds] = useState([]);

  const [edit, setEdit] = useState({ name: "", gender: "M", birth_date: "" });

  async function fetchData() {
    const r = await api.get(`/patients/${id}/`);
    setPatient(r.data);
    setEdit({ name: r.data.name, gender: r.data.gender, birth_date: r.data.birth_date });

    const p = await api.get("/patients/predictions/", { params: { patient: id } });
    setPreds(p.data.results || p.data);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function savePatient(e) {
    e.preventDefault();
    await api.put(`/patients/${id}/`, edit);
    await fetchData();
  }

  async function deletePred(predId) {
    if (!confirm(`Delete prediction #${predId}?`)) return;
    await api.delete(`/patients/predictions/${predId}/`);
    await fetchData();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Patient #{id}</h2>

      {patient && (
        <form onSubmit={savePatient} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <input value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })}/>
          <select value={edit.gender} onChange={e => setEdit({ ...edit, gender: e.target.value })}>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
          <input type="date" value={edit.birth_date} onChange={e => setEdit({ ...edit, birth_date: e.target.value })}/>
          <button type="submit">수정</button>
        </form>
      )}

      <h3>Predictions</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th><th>Created</th><th>Pred</th><th>Proba</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {preds.map(pr => (
            <tr key={pr.id}>
              <td>{pr.id}</td>
              <td>{pr.created_at}</td>
              <td>{Array.isArray(pr.result?.pred) ? pr.result.pred.join(", ") : String(pr.result?.pred)}</td>
              <td>{Array.isArray(pr.result?.proba) ? pr.result.proba.join(", ") : String(pr.result?.proba)}</td>
              <td><button onClick={() => deletePred(pr.id)}>삭제</button></td>
            </tr>
          ))}
          {preds.length === 0 && (
            <tr><td colSpan={5}>No predictions</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
