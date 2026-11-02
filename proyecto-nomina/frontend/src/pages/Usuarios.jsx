import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY = {
  nombre_usuario: "",
  password: "",
  rol: "RRHH",
  id_empleado: ""
};

const fmtFecha = (f) =>
  f
    ? new Date(f).toLocaleDateString("es-GT", { timeZone: "UTC" })
    : "—";

export default function Usuarios() {
  const { usuario: yo } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [target, setTarget] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [toast, setToast] = useState(null);
  const [errorForm, setErrorForm] = useState("");

  const modalFormRef = useRef(null);
  const modalEstadoRef = useRef(null);

  const bsModal = (ref) =>
    window.bootstrap?.Modal.getOrCreateInstance(ref.current);

  function showToast(type, msg) {
    setToast({ type, msg });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function cargar() {
    try {
      const [us, emps] = await Promise.all([
        api.get("/usuarios"),
        api.get("/empleados?estado=Activo")
      ]);

      setUsuarios(us);
      setEmpleados(emps);
    } catch (e) {
      showToast("danger", e.message || "No fue posible cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirCrear() {
    setForm(EMPTY);
    setErrorForm("");
    bsModal(modalFormRef)?.show();
  }

  async function crear(e) {
    e.preventDefault();

    setErrorForm("");

    const nombreUsuario = form.nombre_usuario.trim();

    if (nombreUsuario.length < 3) {
      setErrorForm("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (form.password.length < 8) {
      setErrorForm("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setGuardando(true);

    try {
      await api.post("/usuarios", {
        nombre_usuario: nombreUsuario,
        password: form.password,
        rol: form.rol,
        id_empleado: form.id_empleado
          ? Number(form.id_empleado)
          : null
      });

      bsModal(modalFormRef)?.hide();

      showToast(
        "success",
        `Usuario "${nombreUsuario}" creado correctamente.`
      );

      await cargar();
      setForm(EMPTY);
    } catch (err) {
      setErrorForm(err.message || "No fue posible crear el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  function pedirCambioEstado(u) {
    setTarget(u);
    bsModal(modalEstadoRef)?.show();
  }

  async function confirmarEstado() {
    if (!target) return;

    const nuevo = target.estado === "Activo" ? "Inactivo" : "Activo";

    setCambiandoEstado(true);

    try {
      await api.put(`/usuarios/${target.id_usuario}/estado`, {
        estado: nuevo
      });

      bsModal(modalEstadoRef)?.hide();

      showToast(
        nuevo === "Activo" ? "success" : "warning",
        `${target.nombre_usuario} ahora está ${nuevo.toLowerCase()}.`
      );

      setTarget(null);
      await cargar();
    } catch (err) {
      bsModal(modalEstadoRef)?.hide();
      showToast("danger", err.message || "No fue posible cambiar el estado.");
    } finally {
      setCambiandoEstado(false);
    }
  }

  const f = (campo) => (e) =>
    setForm((actual) => ({
      ...actual,
      [campo]: e.target.value
    }));

  const rolColor = {
    Administrador: "text-bg-dark",
    RRHH: "text-bg-primary",
    Contabilidad: "text-bg-success"
  };

  const activos = usuarios.filter((u) => u.estado === "Activo").length;
  const inactivos = usuarios.filter((u) => u.estado === "Inactivo").length;

  return (
    <div className="modulo-usuarios">
      {toast && (
        <div
          className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
          style={{ zIndex: 9999, minWidth: 280, maxWidth: 380 }}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                toast.type === "success"
                  ? "bi-check-circle-fill"
                  : toast.type === "warning"
                    ? "bi-exclamation-triangle-fill"
                    : "bi-exclamation-circle-fill"
              }`}
            ></i>
            <span>{toast.msg}</span>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={() => setToast(null)}
          ></button>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="page-title mb-1">
            <i className="bi bi-people me-2"></i>
            Usuarios del sistema
          </h2>

          <p className="page-subtitle mb-0">
            Administración de cuentas, roles y estados de acceso al sistema.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirCrear}
        >
          <i className="bi bi-person-plus me-2"></i>
          Nuevo usuario
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card usuarios-resumen h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="usuarios-resumen-icon total">
                <i className="bi bi-people-fill"></i>
              </div>
              <div>
                <div className="text-muted small">Total de usuarios</div>
                <h4 className="fw-bold mb-0">{usuarios.length}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card usuarios-resumen h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="usuarios-resumen-icon activos">
                <i className="bi bi-person-check-fill"></i>
              </div>
              <div>
                <div className="text-muted small">Usuarios activos</div>
                <h4 className="fw-bold mb-0">{activos}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card usuarios-resumen h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="usuarios-resumen-icon inactivos">
                <i className="bi bi-person-x-fill"></i>
              </div>
              <div>
                <div className="text-muted small">Usuarios inactivos</div>
                <h4 className="fw-bold mb-0">{inactivos}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card usuarios-tabla-card">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-semibold mb-1">
                <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                Listado de usuarios
              </h5>
              <span className="text-muted small">
                Consulta y administra las cuentas registradas.
              </span>
            </div>

            <span className="badge bg-light text-dark border px-3 py-2">
              {usuarios.length} registro(s)
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3"></div>
              <p className="text-muted mb-0">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Empleado vinculado</th>
                    <th>Fecha de creación</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map((u, index) => {
                      const esYo = u.id_usuario === yo?.id_usuario;

                      return (
                        <tr key={u.id_usuario}>
                          <td className="text-muted">{index + 1}</td>

                          <td>
                            <div className="fw-semibold font-monospace">
                              {u.nombre_usuario}
                            </div>

                            {esYo && (
                              <span className="badge bg-light text-primary border mt-1">
                                <i className="bi bi-person-check me-1"></i>
                                Mi cuenta
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                rolColor[u.rol] || "text-bg-secondary"
                              }`}
                            >
                              {u.rol}
                            </span>
                          </td>

                          <td>
                            {u.empleado || (
                              <span className="text-muted">Sin vincular</span>
                            )}
                          </td>

                          <td>{fmtFecha(u.fecha_creacion)}</td>

                          <td>
                            <span
                              className={`badge rounded-pill ${
                                u.estado === "Activo"
                                  ? "badge-activo"
                                  : "badge-inactivo"
                              }`}
                            >
                              <i
                                className={`bi ${
                                  u.estado === "Activo"
                                    ? "bi-check-circle-fill"
                                    : "bi-x-circle-fill"
                                } me-1`}
                              ></i>
                              {u.estado}
                            </span>
                          </td>

                          <td className="text-center">
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                u.estado === "Activo"
                                  ? "btn-outline-danger"
                                  : "btn-outline-success"
                              }`}
                              disabled={esYo}
                              title={
                                esYo
                                  ? "No puede cambiar el estado de su propia cuenta"
                                  : u.estado === "Activo"
                                    ? "Inactivar usuario"
                                    : "Activar usuario"
                              }
                              onClick={() => pedirCambioEstado(u)}
                            >
                              <i
                                className={`bi ${
                                  u.estado === "Activo"
                                    ? "bi-person-x"
                                    : "bi-person-check"
                                } me-1`}
                              ></i>
                              {u.estado === "Activo" ? "Inactivar" : "Activar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <i className="bi bi-people usuarios-vacio-icon"></i>
                        <div className="fw-semibold mt-2">
                          No hay usuarios registrados
                        </div>
                        <div className="text-muted small">
                          Puedes crear una nueva cuenta con el botón superior.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: crear usuario */}
      <div
        className="modal fade"
        ref={modalFormRef}
        tabIndex={-1}
        data-bs-backdrop="static"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content usuarios-modal">
            <div className="modal-header modal-header-navy">
              <h5 className="modal-title">
                <i className="bi bi-person-plus me-2"></i>
                Nuevo usuario
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              ></button>
            </div>

            <form onSubmit={crear}>
              <div className="modal-body p-4">
                {errorForm && (
                  <div className="alert alert-danger py-2">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {errorForm}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Nombre de usuario <span className="text-danger">*</span>
                  </label>

                  <input
                    className="form-control font-monospace"
                    required
                    minLength={3}
                    maxLength={50}
                    value={form.nombre_usuario}
                    onChange={f("nombre_usuario")}
                    autoComplete="off"
                    placeholder="Ej. usuario01"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Contraseña inicial <span className="text-danger">*</span>
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={f("password")}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                  />

                  <div className="form-text">
                    El usuario podrá cambiar su contraseña desde Mi perfil.
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">
                      Rol <span className="text-danger">*</span>
                    </label>

                    <select
                      className="form-select"
                      value={form.rol}
                      onChange={f("rol")}
                    >
                      <option value="RRHH">RRHH</option>
                      <option value="Contabilidad">Contabilidad</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  <div className="col-md-7">
                    <label className="form-label fw-semibold">
                      Empleado vinculado
                    </label>

                    <select
                      className="form-select"
                      value={form.id_empleado}
                      onChange={f("id_empleado")}
                    >
                      <option value="">Ninguno</option>

                      {empleados.map((e) => (
                        <option
                          key={e.id_empleado}
                          value={e.id_empleado}
                        >
                          {e.nombres} {e.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      Crear usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: confirmar cambio de estado */}
      <div
        className="modal fade"
        ref={modalEstadoRef}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content usuarios-modal">
            <div className="modal-header">
              <h5 className="modal-title fw-semibold">
                <i className="bi bi-shield-exclamation me-2 text-primary"></i>
                Confirmar cambio de estado
              </h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              ></button>
            </div>

            <div className="modal-body p-4">
              {target && (
                <>
                  <div className="text-center mb-3">
                    <div
                      className={`usuarios-confirmacion-icon ${
                        target.estado === "Activo" ? "inactivar" : "activar"
                      }`}
                    >
                      <i
                        className={`bi ${
                          target.estado === "Activo"
                            ? "bi-person-x"
                            : "bi-person-check"
                        }`}
                      ></i>
                    </div>
                  </div>

                  <p className="text-center mb-2">
                    ¿Desea{" "}
                    <strong>
                      {target.estado === "Activo" ? "inactivar" : "activar"}
                    </strong>{" "}
                    la cuenta?
                  </p>

                  <div className="text-center fw-semibold font-monospace mb-3">
                    {target.nombre_usuario}
                  </div>

                  {target.estado === "Activo" && (
                    <div className="alert alert-warning small mb-0">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      El usuario no podrá iniciar sesión hasta que su cuenta
                      vuelva a ser activada.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                disabled={cambiandoEstado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmarEstado}
                disabled={cambiandoEstado}
              >
                {cambiandoEstado ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Procesando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}