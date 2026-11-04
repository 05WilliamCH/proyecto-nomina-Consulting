import React, { useState } from "react";
import {
  useNavigate,
  useLocation,
  Navigate,
  Link
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import Alert from "../components/Alert.jsx";

import "../styles.css";

export default function Login() {
  const { token, iniciarSesion } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [nombre_usuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (token) {
    const destino = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={destino} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      await iniciarSesion(nombre_usuario, password);

      navigate(
        location.state?.from?.pathname || "/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setCargando(false);
    }
  }

  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <div className="login-screen">

      <div className="login-container">

        {/* PANEL DEL FORMULARIO */}
        <div className="login-form-panel">

          <div className="login-content">

            <div className="login-brand">
              <div className="login-brand-icon">
                <i className="bi bi-wallet2"></i>
              </div>

              <span>SISTEMA ADMINISTRATIVO</span>
            </div>

            <div className="login-heading">
              <h1>Bienvenido</h1>
              <p>
                Ingrese sus credenciales para acceder
                al sistema de nómina.
              </p>
            </div>

            <form onSubmit={onSubmit}>

              {error && (
                <div className="login-error">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* USUARIO */}
              <div className="login-field">

                <label htmlFor="nombre_usuario">
                  Nombre de usuario
                </label>

                <div className="login-input-wrapper">
                  <i className="bi bi-person"></i>

                  <input
                    id="nombre_usuario"
                    type="text"
                    placeholder="Ingrese su usuario"
                    autoFocus
                    autoComplete="username"
                    value={nombre_usuario}
                    onChange={(e) =>
                      setNombreUsuario(e.target.value)
                    }
                    required
                    disabled={cargando}
                  />
                </div>

              </div>

              {/* CONTRASEÑA */}
              <div className="login-field">

                <label htmlFor="password">
                  Contraseña
                </label>

                <div className="login-input-wrapper">
                  <i className="bi bi-lock"></i>

                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    disabled={cargando}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    disabled={cargando}
                    aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`bi ${mostrarPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>

              </div>

              {/* RECUPERAR CONTRASEÑA */}
              <div className="login-options">
                <Link to="/recuperar-password">
                  ¿Olvidó su contraseña?
                </Link>
              </div>

              {/* BOTÓN */}
              <button
                type="submit"
                className="login-button"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>

            </form>

            <div className="login-footer">
              <p>
                Consulting, S.A.
              </p>
              <span>
                Sistema de control de nómina
              </span>
            </div>

          </div>

        </div>

        {/* PANEL VISUAL */}
        <div className="login-visual-panel">

          <div className="visual-overlay">

            <div className="visual-content">

              <div className="visual-icon">
                <i className="bi bi-graph-up-arrow"></i>
              </div>

              <h2>
                Gestión eficiente de nómina
              </h2>

              <p>
                Administre la información de sus empleados,
                controle los ingresos y egresos y genere
                reportes de manera sencilla y organizada.
              </p>

              <div className="visual-features">

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  Control de empleados
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  Gestión de nóminas
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  Reportes administrativos
                </div>

              </div>

            </div>

            <div className="visual-bottom">
              CONSULTING, S.A. · SISTEMA ADMINISTRATIVO
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
