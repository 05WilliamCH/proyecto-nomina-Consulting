import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/Alert.jsx";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/restablecer-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password_nueva: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo restablecer la contraseña");
      setOk(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <h1 className="login-title">Restablecer contraseña</h1>
        <p className="login-subtitle">Sistema de Nómina — Consulting, S.A.</p>

        <Alert type="error">{error}</Alert>
        {ok && <Alert type="success">Contraseña actualizada. Redirigiendo al inicio de sesión…</Alert>}

        {!ok && (
          <>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Token de recuperación</label>
              <input value={token} onChange={(e) => setToken(e.target.value)} required style={{ width: "100%" }} />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Nueva contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ width: "100%" }} />
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Confirmar contraseña</label>
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required minLength={8} style={{ width: "100%" }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={cargando} style={{ width: "100%" }}>
              {cargando ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/login" style={{ fontSize: 13, color: "var(--text-muted)" }}>← Volver a iniciar sesión</Link>
        </div>
      </form>
    </div>
  );
}
