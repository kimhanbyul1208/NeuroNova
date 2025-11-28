import { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  // 사용자 목록 불러오기
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch (err) {
      console.error("사용자 목록 로드 실패:", err);
      setUsers([]);
    }
  }

  async function changeRole(username, newRole) {
    try {
      await api.post("/auth/change-role", {
        username: username,
        role: newRole,
      });
      alert(`'${username}'의 등급이 '${newRole}'로 변경되었습니다.`);
      loadUsers(); // 변경 즉시 갱신
    } catch (err) {
      console.error("등급 변경 실패:", err);
      alert("변경 실패: 권한이 없거나 서버 오류");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>사용자 관리 (Admin 전용)</h2>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>현재 등급</th>
            <th>등급 변경</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email || "-"}</td>
                <td>{u.role || "general"}</td>
                <td>
                  <select
                    value={u.role || "general"}
                    onChange={(e) => changeRole(u.username, e.target.value)}
                  >
                    <option value="general">일반</option>
                    <option value="doctor">의사</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>사용자 정보가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
