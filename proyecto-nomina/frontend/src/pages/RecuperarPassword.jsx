import React, { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/Alert.jsx";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function RecuperarPassword() {
  const [nombre_usuario, setNombreUsuario] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setResultado(null); setCargando(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/olvide-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo procesar la solicitud");
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <h1 className="login-title">Recuperar contraseña</h1>
        <p className="login-subtitle">Sistema de Nómina — Consulting, S.A.</p>

        <Alert type="error">{error}</Alert>

        {resultado ? (
          <>
            <Alert type="success">{resultado.mensaje}</Alert>
            {resultado.modoDesarrollo && (
              <div className="alert" style={{ background: "#fff8e6", border: "1px solid #f0dca0", color: "#7a5c00" }}>
                <strong>Modo desarrollo</strong> — no hay servidor de correo configurado,
                así que el enlace se muestra aquí directamente (en producción se enviaría
                por email y no aparecería en pantalla).
                <br /><br />
                Válido por {resultado.expiraEn}.
                <br />
                <Link to={`/restablecer-password?token=${resultado.resetToken}`}>
                  Ir a restablecer contraseña →
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Usuario</label>
              <input
                autoFocus
                value={nombre_usuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={cargando} style={{ width: "100%" }}>
              {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
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
