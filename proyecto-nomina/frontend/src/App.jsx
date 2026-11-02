import React,  { useState } from "react";
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
  {
    to: "/empleados",
    label: "Empleados",
    icon: "bi-people",
    roles: ["RRHH", "Administrador"]
  },
  {
    to: "/ingresos-egresos",
    label: "Ingresos / Egresos",
    icon: "bi-arrow-left-right",
    roles: ["RRHH", "Administrador"]
  },
  {
    to: "/anticipos",
    label: "Anticipos",
    icon: "bi-wallet2",
    roles: ["RRHH", "Administrador"]
  },
  {
    to: "/nomina",
    label: "Nómina",
    icon: "bi-calculator",
    roles: ["RRHH", "Administrador"]
  },
  {
    to: "/reportes",
    label: "Reportes",
    icon: "bi-bar-chart-line",
    roles: null
  },
  {
    to: "/parametros",
    label: "Parámetros",
    icon: "bi-gear",
    roles: ["Administrador"]
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: "bi-person-gear",
    roles: ["Administrador"]
  }
];


function Shell() {
  const { usuario, cerrarSesion } = useAuth();

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const visibles = links.filter(
    (l) => !l.roles || l.roles.includes(usuario?.rol)
  );

  return (
    <div className={`layout ${!sidebarVisible ? "sidebar-collapsed" : ""}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">

      {/* ENCABEZADO */}
      <div className="sidebar-brand">

        {sidebarVisible && (
          <div className="sidebar-brand-info">
            <div className="sidebar-brand-icon">
              <i className="bi bi-wallet2"></i>
            </div>

            <div>
              <h1>Sistema de Nómina</h1>
              <span>Consulting, S.A.</span>
            </div>
          </div>
        )}

        {!sidebarVisible && (
          <div className="sidebar-brand-icon">
            <i className="bi bi-wallet2"></i>
          </div>
        )}

        <button
          type="button"
          className="btn-toggle-sidebar"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title={sidebarVisible ? "Contraer menú" : "Expandir menú"}
        >
          <i className={`bi ${sidebarVisible ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
        </button>

      </div>

        {/* NAVEGACIÓN */}
        <nav className="sidebar-nav">

          {sidebarVisible && (
            <div className="sidebar-section-title">
              MENÚ PRINCIPAL
            </div>
)}

          {visibles.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              title={!sidebarVisible ? l.label : ""}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className={`bi ${l.icon}`}></i>

              {sidebarVisible && (
                <span>{l.label}</span>
              )}
            </NavLink>
          ))}

        </nav>

        {/* PARTE INFERIOR */}

          <div className="sidebar-bottom">

          {/* PERFIL */}
          <NavLink
            to="/perfil"
            title={!sidebarVisible ? "Mi perfil" : ""}
            className={({ isActive }) =>
              `sidebar-profile-link ${isActive ? "active" : ""}`
            }
          >
            <i className="bi bi-person-circle"></i>

            {sidebarVisible && (
              <>
                <span>Mi perfil</span>
                <i className="bi bi-chevron-right profile-arrow"></i>
              </>
            )}
          </NavLink>

          {/* USUARIO */}
          <div className="sidebar-user">

            <div className="sidebar-avatar">
              <i className="bi bi-person-fill"></i>
            </div>

            {sidebarVisible && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {usuario?.nombre_usuario}
                </div>

                <div className="sidebar-user-role">
                  {usuario?.rol}
                </div>
              </div>
            )}

          </div>

          {/* CERRAR SESIÓN */}
          <button
            className="btn-logout"
            onClick={cerrarSesion}
            title={!sidebarVisible ? "Cerrar sesión" : ""}
          >
            <i className="bi bi-box-arrow-right"></i>

            {sidebarVisible && (
              <span>Cerrar sesión</span>
            )}
          </button>

        </div>

      </aside>

      {/* CONTENIDO */}
      <main className="main">
          {/* BARRA SUPERIOR */}
        <div className="main-toolbar">
          <span className="toolbar-title">
            Sistema de Nómina
          </span>
        </div>

        <Routes>

          <Route
            path="/"
            element={<Navigate to="/reportes" replace />}
          />

          <Route
            path="/empleados"
            element={
              <ProtectedRoute roles={["RRHH", "Administrador"]}>
                <Empleados />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ingresos-egresos"
            element={
              <ProtectedRoute roles={["RRHH", "Administrador"]}>
                <IngresosEgresos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/anticipos"
            element={
              <ProtectedRoute roles={["RRHH", "Administrador"]}>
                <Anticipos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina"
            element={
              <ProtectedRoute roles={["RRHH", "Administrador"]}>
                <Nomina />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <Reportes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parametros"
            element={
              <ProtectedRoute roles={["Administrador"]}>
                <Parametros />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute roles={["Administrador"]}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />

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

        <Route
          path="/recuperar-password"
          element={<RecuperarPassword />}
        />

        <Route
          path="/restablecer-password"
          element={<RestablecerPassword />}
        />

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