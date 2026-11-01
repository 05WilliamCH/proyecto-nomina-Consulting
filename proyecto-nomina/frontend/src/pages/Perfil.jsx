import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString("es-GT", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" }) : "—";

function Dato({ etiqueta, valor, mono }) {
  return (
    <div className="mb-3">
      <div className="text-muted" style={{ fontSize: 12 }}>{etiqueta}</div>
      <div className={mono ? "font-monospace" : ""} style={{ fontWeight: 600 }}>
        {valor || <span className="text-muted fw-normal">—</span>}
      </div>
    </div>
  );
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ password_actual: "", password_nueva: "", confirmar: "" });
  const [msg, setMsg] = useState(null); // { type, text }
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get("/usuarios/me").then(setPerfil).catch((e) => setError(e.message));
  }, []);

  async function cambiarPassword(e) {
    e.preventDefault();
    setMsg(null);
    if (form.password_nueva !== form.confirmar) {
      setMsg({ type: "danger", text: "La confirmación no coincide con la nueva contraseña." });
      return;
    }
    setGuardando(true);
    try {
      await api.put("/usuarios/me/password", {
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
      });
      setForm({ password_actual: "", password_nueva: "", confirmar: "" });
      setMsg({ type: "success", text: "Contraseña actualizada correctamente." });
    } catch (err) {
      setMsg({ type: "danger", text: err.message });
    } finally {
      setGuardando(false);
    }
  }

  const f = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!perfil) return <div className="text-muted">Cargando…</div>;

  const { usuario, empleado, permisos } = perfil;

  return (
    <div>
      <h2 className="page-title">Mi perfil</h2>
      <p className="page-subtitle">Sus datos de acceso, sus permisos y la gestión de su contraseña.</p>

      <div className="row g-4">
        {/* ── Datos de la cuenta ───────────────────────────── */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header fw-bold" style={{ background: "var(--navy)", color: "white" }}>
              Cuenta de acceso
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6"><Dato etiqueta="Usuario" valor={usuario.nombre_usuario} mono /></div>
                <div className="col-6"><Dato etiqueta="Rol" valor={usuario.rol} /></div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: 12 }}>Estado</div>
                  <span className={`badge rounded-pill ${usuario.estado === "Activo" ? "badge-activo" : "badge-inactivo"}`}>
                    {usuario.estado}
                  </span>
                </div>
                <div className="col-6"><Dato etiqueta="Cuenta creada el" valor={fmtFecha(usuario.fecha_creacion)} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Datos del empleado vinculado ─────────────────── */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header fw-bold" style={{ background: "var(--navy)", color: "white" }}>
              Datos del empleado
            </div>
            <div className="card-body">
              {empleado ? (
                <div className="row">
                  <div className="col-12"><Dato etiqueta="Nombre completo" valor={`${empleado.nombres} ${empleado.apellidos}`} /></div>
                  <div className="col-6"><Dato etiqueta="DPI" valor={empleado.dpi} mono /></div>
                  <div className="col-6"><Dato etiqueta="NIT" valor={empleado.nit} mono /></div>
                  <div className="col-6"><Dato etiqueta="Departamento" valor={empleado.departamento} /></div>
                  <div className="col-6"><Dato etiqueta="Puesto" valor={empleado.puesto} /></div>
                  <div className="col-12"><Dato etiqueta="Fecha de ingreso" valor={fmtFecha(empleado.fecha_ingreso)} /></div>
                </div>
              ) : (
                <p className="text-muted mb-0">
                  Esta cuenta no está vinculada a un empleado. El Administrador puede
                  vincularla al crear el usuario.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Permisos ─────────────────────────────────────── */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header fw-bold" style={{ background: "var(--navy)", color: "white" }}>
              Mis permisos ({permisos.length})
            </div>
            <div className="card-body d-flex flex-wrap gap-2">
              {permisos.map((p) => (
                <span key={p.codigo} className="badge text-bg-light border" title={p.descripcion || ""}
                  style={{ fontSize: 12, fontWeight: 500 }}>
                  {p.codigo}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cambiar contraseña ───────────────────────────── */}
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold" style={{ background: "var(--navy)", color: "white" }}>
              Cambiar contraseña
            </div>
            <form className="card-body" onSubmit={cambiarPassword}>
              {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}
              <div className="mb-3">
                <label className="form-label fw-semibold">Contraseña actual</label>
                <input type="password" className="form-control" required autoComplete="current-password"
                  value={form.password_actual} onChange={f("password_actual")} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Nueva contraseña</label>
                <input type="password" className="form-control" required minLength={8} autoComplete="new-password"
                  value={form.password_nueva} onChange={f("password_nueva")} />
                <div className="field-hint">Mínimo 8 caracteres, distinta a la actual.</div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Confirmar nueva contraseña</label>
                <input type="password" className="form-control" required minLength={8} autoComplete="new-password"
                  value={form.confirmar} onChange={f("confirmar")} />
              </div>
              <button type="submit" className="btn text-white" style={{ background: "var(--navy)" }} disabled={guardando}>
                {guardando ? "Guardando…" : "Actualizar contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
