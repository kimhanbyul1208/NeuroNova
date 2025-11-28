import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(form.username, form.password);
      nav("/");
    } catch (e) {
      setErr("로그인 실패");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, width: 300 }}>
        <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}/>
        <input type="password" placeholder="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button type="submit">로그인</button>
      </form>
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}
    </div>
  );
}
