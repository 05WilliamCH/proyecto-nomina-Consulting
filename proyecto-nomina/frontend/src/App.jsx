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

import Dashboard from "./pages/Dashboard.jsx";

// Cada link declara que roles pueden verlo. "null" = cualquier usuario
// autenticado (RRHH, Contabilidad o Administrador).

const links = [

  { to: "/dashboard", 
    label: "Dashboard", 
    icon: "bi-speedometer2",
    roles: null },
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); //Version mobil sidebar

  const visibles = links.filter(
    (l) => !l.roles || l.roles.includes(usuario?.rol)
  );

  return (
    <div className={`layout ${!sidebarVisible ? "sidebar-collapsed" : ""}
                            ${mobileMenuOpen ? "mobile-menu-open" : ""} `}>

      {/* SIDEBAR */}
      <aside className="sidebar">

      {/* ENCABEZADO */}
      <div className="sidebar-brand">

        {sidebarVisible && (
          <div className="sidebar-brand-info">
            <div className="sidebar-brand-icon">
              <i className="bi bi-wallet2"></i>
            </div>

            <div className="main-toolbar">
               <span className="toolbar-title">
                <h1>Sistema de Nomina</h1>
                Consulting S.A.
               </span>
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
        {/* Botón para cerrar en teléfono */}
        <button
          type="button"
          className="btn-close-mobile d-md-none"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <i className="bi bi-x-lg"></i>
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
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <i className={`bi ${l.icon}`}></i>

              {(sidebarVisible || mobileMenuOpen) && (
                <span>{l.label}</span>
              )}
            </NavLink>
          ))}

        </nav>

        {/* PARTE INFERIOR */}
        <div className="sidebar-bottom">

          {/* PERFIL Y USUARIO */}
          <NavLink
            to="/perfil"
            title={!sidebarVisible ? usuario?.nombre_usuario || "Mi perfil" : ""}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `sidebar-profile-link ${isActive ? "active" : ""}`
            }
          >
            <div className="sidebar-avatar">
              <i className="bi bi-person-circle"></i>
            </div>

            {sidebarVisible && (
              <>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">
                    {usuario?.nombre_usuario}
                  </div>

                  <div className="sidebar-user-role">
                    {usuario?.rol}
                  </div>
                </div>

                <i className="bi bi-chevron-right profile-arrow"></i>
              </>
            )}
          </NavLink>

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

      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
)}

      {/* CONTENIDO */}
      <main className="main">
          {/* BARRA SUPERIOR */}
        <div className="main-toolbar">
          <button
            type="button"
            className="btn btn-outline-primary d-md-none me-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <i className="bi bi-list fs-4"></i>
          </button>
          <span className="toolbar-title">
            Sistema de Nómina
          </span>
        </div>

        <Routes>


          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>} />

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