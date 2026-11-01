import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import RecuperarPassword from "./pages/RecuperarPassword.jsx";
import RestablecerPassword from "./pages/RestablecerPassword.jsx";
import Empleados from "./pages/Empleados.jsx";
import IngresosEgresos from "./pages/IngresosEgresos.jsx";
import Anticipos from "./pages/Anticipos.jsx";
import Nomina from "./pages/Nomina.jsx";
import Reportes from "./pages/Reportes.jsx";
import Parametros from "./pages/Parametros.jsx";
import Perfil from "./pages/Perfil.jsx";
import Usuarios from "./pages/Usuarios.jsx";

// Cada link declara que roles pueden verlo. "null" = cualquier usuario
// autenticado (RRHH, Contabilidad o Administrador).
const links = [
  { to: "/empleados", label: "Empleados", roles: ["RRHH", "Administrador"] },
  { to: "/ingresos-egresos", label: "Ingresos / Egresos", roles: ["RRHH", "Administrador"] },
  { to: "/anticipos", label: "Anticipos", roles: ["RRHH", "Administrador"] },
  { to: "/nomina", label: "Nómina", roles: ["RRHH", "Administrador"] },
  { to: "/reportes", label: "Reportes", roles: null },
  { to: "/parametros", label: "Parámetros", roles: ["Administrador"] },
  { to: "/usuarios", label: "Usuarios", roles: ["Administrador"] },
  { to: "/perfil", label: "Mi perfil", roles: null },
];

function Shell() {
  const { usuario, cerrarSesion } = useAuth();
  const visibles = links.filter((l) => !l.roles || l.roles.includes(usuario?.rol));

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Sistema de Nómina<br />Consulting, S.A.</h1>
        <nav>
          {visibles.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{usuario?.nombre_usuario}</div>
          <div className="sidebar-user-role">{usuario?.rol}</div>
          <button className="btn-logout" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/reportes" replace />} />
          <Route path="/empleados" element={<ProtectedRoute roles={["RRHH", "Administrador"]}><Empleados /></ProtectedRoute>} />
          <Route path="/ingresos-egresos" element={<ProtectedRoute roles={["RRHH", "Administrador"]}><IngresosEgresos /></ProtectedRoute>} />
          <Route path="/anticipos" element={<ProtectedRoute roles={["RRHH", "Administrador"]}><Anticipos /></ProtectedRoute>} />
          <Route path="/nomina" element={<ProtectedRoute roles={["RRHH", "Administrador"]}><Nomina /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
          <Route path="/parametros" element={<ProtectedRoute roles={["Administrador"]}><Parametros /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute roles={["Administrador"]}><Usuarios /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
