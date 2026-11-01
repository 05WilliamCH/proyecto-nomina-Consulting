import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY = { nombre_usuario: "", password: "", rol: "RRHH", id_empleado: "" };

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString("es-GT", { timeZone: "UTC" }) : "—";

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [target, setTarget] = useState(null); // usuario a activar/inactivar
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorForm, setErrorForm] = useState("");

  const modalFormRef = useRef(null);
  const modalEstadoRef = useRef(null);
  const bsModal = (ref) => window.bootstrap?.Modal.getOrCreateInstance(ref.current);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function cargar() {
    try {
      const [us, emps] = await Promise.all([api.get("/usuarios"), api.get("/empleados?estado=Activo")]);
      setUsuarios(us);
      setEmpleados(emps);
    } catch (e) { showToast("danger", e.message); }
  }
  useEffect(() => { cargar(); }, []);

  function abrirCrear() {
    setForm(EMPTY); setErrorForm("");
    bsModal(modalFormRef)?.show();
  }

  async function crear(e) {
    e.preventDefault();
    setErrorForm(""); setGuardando(true);
    try {
      await api.post("/usuarios", {
        nombre_usuario: form.nombre_usuario.trim(),
        password: form.password,
        rol: form.rol,
        id_empleado: form.id_empleado ? Number(form.id_empleado) : null,
      });
      bsModal(modalFormRef)?.hide();
      showToast("success", `Usuario "${form.nombre_usuario.trim()}" creado correctamente.`);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally { setGuardando(false); }
  }

  function pedirCambioEstado(u) {
    setTarget(u);
    bsModal(modalEstadoRef)?.show();
  }

  async function confirmarEstado() {
    const nuevo = target.estado === "Activo" ? "Inactivo" : "Activo";
    try {
      await api.put(`/usuarios/${target.id_usuario}/estado`, { estado: nuevo });
      bsModal(modalEstadoRef)?.hide();
      showToast(nuevo === "Activo" ? "success" : "warning",
        `${target.nombre_usuario} ahora está ${nuevo.toLowerCase()}.`);
      cargar();
    } catch (err) {
      bsModal(modalEstadoRef)?.hide();
      showToast("danger", err.message);
    }
  }

  const f = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const rolColor = { Administrador: "text-bg-dark", RRHH: "text-bg-primary", Contabilidad: "text-bg-success" };

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3`}
          style={{ zIndex: 9999, minWidth: 280 }} role="alert">
          {toast.msg}
          <button type="button" className="btn-close" onClick={() => setToast(null)} />
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="page-title mb-0">Usuarios del sistema</h2>
          <p className="page-subtitle mb-0">Solo el Administrador puede crear y activar/inactivar cuentas.</p>
        </div>
        <button className="btn btn-sm text-white" style={{ background: "var(--accent)" }} onClick={abrirCrear}>
          + Nuevo usuario
        </button>
      </div>

      <div className="table-responsive rounded shadow-sm">
        <table className="table table-hover table-striped table-bordered mb-0 align-middle" style={{ fontSize: 13.5 }}>
          <thead style={{ background: "var(--navy)", color: "white" }}>
            <tr>
              <th>Usuario</th><th>Rol</th><th>Empleado vinculado</th>
              <th>Creado</th><th>Estado</th><th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const esYo = u.id_usuario === yo?.id_usuario;
              return (
                <tr key={u.id_usuario}>
                  <td className="font-monospace">
                    <strong>{u.nombre_usuario}</strong>
                    {esYo && <span className="badge text-bg-light border ms-2">usted</span>}
                  </td>
                  <td><span className={`badge ${rolColor[u.rol] || "text-bg-secondary"}`}>{u.rol}</span></td>
                  <td>{u.empleado ?? <span className="text-muted">—</span>}</td>
                  <td>{fmtFecha(u.fecha_creacion)}</td>
                  <td>
                    <span className={`badge rounded-pill ${u.estado === "Activo" ? "badge-activo" : "badge-inactivo"}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className={`btn btn-sm ${u.estado === "Activo" ? "btn-outline-danger" : "btn-outline-success"}`}
                      disabled={esYo}
                      title={esYo ? "No puede cambiar el estado de su propia cuenta" : ""}
                      onClick={() => pedirCambioEstado(u)}
                    >
                      {u.estado === "Activo" ? "Inactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!usuarios.length && (
              <tr><td colSpan={6} className="text-center text-muted py-4">No hay usuarios.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: nuevo usuario ───────────────────────────── */}
      <div className="modal fade" ref={modalFormRef} tabIndex={-1} data-bs-backdrop="static">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header modal-header-navy">
              <h5 className="modal-title">➕ Nuevo usuario</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={crear}>
              <div className="modal-body">
                {errorForm && <div className="alert alert-danger py-2">{errorForm}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre de usuario <span className="text-danger">*</span></label>
                  <input className="form-control font-monospace" required minLength={3} maxLength={50}
                    value={form.nombre_usuario} onChange={f("nombre_usuario")} autoComplete="off" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Contraseña inicial <span className="text-danger">*</span></label>
                  <input type="password" className="form-control" required minLength={8}
                    value={form.password} onChange={f("password")} autoComplete="new-password" />
                  <div className="field-hint">Mínimo 8 caracteres. El usuario podrá cambiarla en «Mi perfil».</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Rol <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.rol} onChange={f("rol")}>
                      <option>RRHH</option>
                      <option>Contabilidad</option>
                      <option>Administrador</option>
                    </select>
                  </div>
                  <div className="col-md-7">
                    <label className="form-label fw-semibold">Empleado vinculado</label>
                    <select className="form-select" value={form.id_empleado} onChange={f("id_empleado")}>
                      <option value="">Ninguno</option>
                      {empleados.map((e) => (
                        <option key={e.id_empleado} value={e.id_empleado}>{e.nombres} {e.apellidos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" className="btn text-white" style={{ background: "var(--navy)" }} disabled={guardando}>
                  {guardando ? "Creando…" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── MODAL: confirmar activar / inactivar ───────────── */}
      <div className="modal fade" ref={modalEstadoRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar cambio de estado</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {target && (
                <p className="mb-0">
                  ¿Desea {target.estado === "Activo" ? "inactivar" : "activar"} la cuenta{" "}
                  <strong className="font-monospace">{target.nombre_usuario}</strong>?
                  {target.estado === "Activo" && (
                    <><br /><span className="text-muted" style={{ fontSize: 13 }}>
                      El usuario ya no podrá iniciar sesión hasta que se vuelva a activar.
                    </span></>
                  )}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button className="btn btn-primary" style={{ background: "var(--navy)", border: "none" }} onClick={confirmarEstado}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
