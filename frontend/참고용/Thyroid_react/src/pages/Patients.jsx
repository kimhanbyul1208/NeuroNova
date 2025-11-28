import { useEffect, useState } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";

const SEX_LABELS = { M: "남", F: "여" };
const displaySex = (p) => (p?.sex ? (SEX_LABELS[p.sex] ?? p.sex) : "-");

export default function Patients() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", sex: "M", birth_date: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", sex: "M", birth_date: "" });

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/patients/");
        const data = r.data.results ?? r.data;
        setList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("GET /patients/ failed:", err);
        setList([]);
      }
    })();
  }, [refreshKey]);

  async function createPatient(e) {
    e.preventDefault();
    try {
      await api.post("/patients/", form);
      setForm({ name: "", sex: "M", birth_date: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("POST /patients/ failed:", err);
      alert("환자 생성 실패");
    }
  }

  function startEdit(p) {
    setEditId(p.id);
    setEditForm({
      name: p.name ?? "",
      sex: p.sex ?? "M",
      birth_date: p.birth_date ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(id) {
    try {
      await api.put(`/patients/${id}`, {
        name: editForm.name,
        birth_date: editForm.birth_date,
        sex: editForm.sex,
      });
      setEditId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      try {
        await api.patch(`/patients/${id}`, {
          name: editForm.name,
          birth_date: editForm.birth_date,
          sex: editForm.sex,
        });
        setEditId(null);
        setRefreshKey((k) => k + 1);
      } catch (err2) {
        console.error(`UPDATE /patients/${id} failed:`, err2);
        alert("수정 실패");
      }
    }
  }

  // ✅ DELETE - 슬래시 제거
  async function deletePatient(id) {
    if (!confirm(`환자 #${id} 를 삭제할까요?`)) return;
    try {
      await api.delete(`/patients/${id}`); // ← 슬래시 제거됨
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(`DELETE /patients/${id} failed:`, err);
      alert("삭제 실패");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>환자 목록</h2>

      <form
        onSubmit={createPatient}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <input
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value })}
        >
          <option value="M">남</option>
          <option value="F">여</option>
        </select>
        <input
          type="date"
          value={form.birth_date}
          onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
        />
        <button type="submit">등록</button>
      </form>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>성별</th>
            <th>생년월일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => {
            const isEdit = editId === p.id;
            return (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  {isEdit ? (
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  ) : (
                    <Link to={`/patients/${p.id}`}>{p.name}</Link>
                  )}
                </td>
                <td>
                  {isEdit ? (
                    <select
                      value={editForm.sex}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sex: e.target.value })
                      }
                    >
                      <option value="M">남</option>
                      <option value="F">여</option>
                    </select>
                  ) : (
                    displaySex(p)
                  )}
                </td>
                <td>
                  {isEdit ? (
                    <input
                      type="date"
                      value={editForm.birth_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, birth_date: e.target.value })
                      }
                    />
                  ) : (
                    p.birth_date || "-"
                  )}
                </td>
                <td>
                  {isEdit ? (
                    <>
                      <button onClick={() => saveEdit(p.id)}>저장</button>
                      <button onClick={cancelEdit} style={{ marginLeft: 6 }}>
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(p)}>수정</button>
                      <button
                        onClick={() => deletePatient(p.id)}
                        style={{ marginLeft: 6 }}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={5}>등록된 환자가 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
