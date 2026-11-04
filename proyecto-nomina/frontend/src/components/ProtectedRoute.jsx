import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Envuelve una pantalla: si no hay sesión, redirige a /login. Si se pasa
// "roles", además exige que el usuario tenga uno de esos roles (si no,
// lo manda a una pantalla a la que sí tiene acceso).
export default function ProtectedRoute({ roles, children }) {
  const { token, usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <div style={{ padding: 24 }}>Cargando…</div>;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
