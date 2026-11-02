import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

const EMPTY = {
  nombres:"", apellidos:"", fecha_nacimiento:"", fecha_ingreso:"",
  id_departamento:"", id_puesto:"", dpi:"", nit:"",
  banco: "", tipo_cuenta_banco: "", numero_cuenta_banco: "",
  salario_base:"", dias_laborados:30, estado:"Activo",
};

export default function Empleados() {
  const [empleados,     setEmpleados]     = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos,       setPuestos]       = useState([]);
  const [form,          setForm]          = useState(EMPTY);
  const [editId,        setEditId]        = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [guardando,     setGuardando]     = useState(false);
  const [toast,         setToast]         = useState(null);
  const [filtro,        setFiltro]        = useState("Activo");

  //filtros de busqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const modalFormRef   = useRef(null);
  const modalDeleteRef = useRef(null);

  const bsModal = (ref) => window.bootstrap?.Modal.getOrCreateInstance(ref.current);
  const openModal  = (ref) => bsModal(ref)?.show();
  const closeModal = (ref) => bsModal(ref)?.hide();

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function cargar() {
    try {
      const [emps, deps, psts] = await Promise.all([
        api.get(`/empleados${filtro !== "Todos" ? `?estado=${filtro}` : ""}`),
        api.get("/departamentos"),
        api.get("/puestos"),
      ]);
      setEmpleados(emps); setDepartamentos(deps); setPuestos(psts);
    } catch (e) { showToast("danger", e.message); }
  }

  useEffect(() => { cargar(); }, [filtro]);

  function abrirCrear() {
    setEditId(null); setForm(EMPTY); openModal(modalFormRef);
  }

  function abrirEditar(emp) {
    setEditId(emp.id_empleado);
    setForm({
      nombres:         emp.nombres,
      apellidos:       emp.apellidos,
      fecha_nacimiento: emp.fecha_nacimiento?.split("T")[0] ?? "",
      fecha_ingreso:   emp.fecha_ingreso?.split("T")[0] ?? "",
      id_departamento: emp.id_departamento,
      id_puesto:       emp.id_puesto ?? "",
      dpi:             emp.dpi ?? "",
      nit:             emp.nit ?? "",
      banco:               emp.banco ?? "",
      tipo_cuenta_banco:   emp.tipo_cuenta_banco ?? "",
      numero_cuenta_banco: emp.numero_cuenta_banco ?? "",
      salario_base:    emp.salario_base,
      dias_laborados:  emp.dias_laborados,
      estado:          emp.estado,
    });
    openModal(modalFormRef);
  }

  function abrirEliminar(emp) {
    setDeleteTarget(emp); openModal(modalDeleteRef);
  }

  async function guardar(e) {
    e.preventDefault(); setGuardando(true);
    try {
      const payload = {
        ...form,
        id_departamento: Number(form.id_departamento),
        id_puesto:       form.id_puesto ? Number(form.id_puesto) : null,
        salario_base:    Number(form.salario_base),
        dpi:             form.dpi.trim() || null,
        nit:             form.nit.trim() || null,
        banco:               form.banco.trim() || null,
        tipo_cuenta_banco:   form.tipo_cuenta_banco || null,
        numero_cuenta_banco: form.numero_cuenta_banco.trim() || null,
      };
      if (editId) {
        await api.put(`/empleados/${editId}`, payload);
        showToast("success", "Empleado actualizado correctamente.");
      } else {
        await api.post("/empleados", payload);
        showToast("success", "Empleado registrado correctamente.");
      }
      closeModal(modalFormRef); cargar();
    } catch (e) { showToast("danger", e.message); }
    finally { setGuardando(false); }
  }

  async function confirmarEliminar() {
    try {
      await api.del(`/empleados/${deleteTarget.id_empleado}`);
      showToast("warning", `${deleteTarget.nombres} ${deleteTarget.apellidos} fue inactivado.`);
      closeModal(modalDeleteRef); cargar();
    } catch (e) { showToast("danger", e.message); }
  }

  const f = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // ── FILTRADO Y PAGINACIÓN ─────────────────────────────────────
  const empleadosFiltrados = empleados.filter((emp) => {
  const texto = busqueda.toLowerCase().trim();

  const coincideBusqueda =
    !texto ||
    [
      emp.nombres,
      emp.apellidos,
      emp.dpi,
      emp.nit,
      emp.email,
    ].some((valor) =>
      String(valor || "").toLowerCase().includes(texto)
    );

  const coincideDepartamento =
    !filtroDepartamento ||
    String(emp.id_departamento) === filtroDepartamento;

  const coincidePuesto =
    !filtroPuesto ||
    String(emp.id_puesto) === filtroPuesto;

  return (
    coincideBusqueda &&
    coincideDepartamento &&
    coincidePuesto
  );
});

const totalPaginas = Math.ceil(
  empleadosFiltrados.length / registrosPorPagina
);

const inicio = (paginaActual - 1) * registrosPorPagina;

const empleadosPaginados = empleadosFiltrados.slice(
  inicio,
  inicio + registrosPorPagina
);

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3`}
          style={{ zIndex:9999, minWidth:280 }} role="alert">
          {toast.msg}
          <button type="button" className="btn-close" onClick={() => setToast(null)} />
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-1">
        <div>
          <h2 className="page-title mb-0">Empleados</h2>
          <p className="page-subtitle mb-0">Alta, consulta, edición e inactivación de personal (RF-01).</p>
        </div>
        <button className="btn btn-sm text-white" style={{ background:"var(--accent)" }} onClick={abrirCrear}>
          <i className="bi bi-person-plus me-2"></i>
          Nuevo empleado
        </button>
      </div>

      <div className="d-flex gap-2 mb-3 mt-3">
        {["Activo","Inactivo","Todos"].map((op) => (
          <button key={op}
            className={`btn btn-sm ${filtro===op ? "btn-primary" : "btn-outline-secondary"}`}
            style={filtro===op ? { background:"var(--navy)", border:"none" } : {}}
            onClick={() => setFiltro(op)}>
            {op}
          </button>
        ))}
      </div>

      <div className="row g-2 mb-3">
  <div className="col-md-4">
    <input
      type="text"
      className="form-control"
      placeholder="Buscar por nombre, DPI o NIT..."
      value={busqueda}
      onChange={(e) => {
        setBusqueda(e.target.value);
        setPaginaActual(1);
      }}
    />
  </div>

  <div className="col-md-3">
    <select
      className="form-select"
      value={filtroDepartamento}
      onChange={(e) => {
        setFiltroDepartamento(e.target.value);
        setPaginaActual(1);
      }}
    >
      <option value="">Todos los departamentos</option>
      {departamentos.map((d) => (
        <option key={d.id_departamento} value={d.id_departamento}>
          {d.nombre}
        </option>
      ))}
    </select>
  </div>

  <div className="col-md-3">
    <select
      className="form-select"
      value={filtroPuesto}
      onChange={(e) => {
        setFiltroPuesto(e.target.value);
        setPaginaActual(1);
      }}
    >
      <option value="">Todos los puestos</option>
      {puestos.map((p) => (
        <option key={p.id_puesto} value={p.id_puesto}>
          {p.nombre}
        </option>
      ))}
    </select>
  </div>

  <div className="col-md-2">
    <select
      className="form-select"
      value={registrosPorPagina}
      onChange={(e) => {
        setRegistrosPorPagina(Number(e.target.value));
        setPaginaActual(1);
      }}
    >
      <option value={10}>10 registros</option>
      <option value={15}>15 registros</option>
      <option value={25}>25 registros</option>
    </select>
  </div>
</div>

      <div className="table-responsive rounded shadow-sm">
        <table className="table table-hover table-striped table-bordered mb-0 align-middle" style={{ fontSize:13.5 }}>
          <thead style={{ background:"var(--navy)", color:"white" }}>
            <tr>
              <th>#</th><th>Nombre completo</th><th>DPI</th><th>NIT</th>
              <th>No. Cuenta</th>
              <th>Departamento</th><th>Puesto</th><th>Salario base</th>
              <th>Estado</th><th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosPaginados.map((emp, index) => (
              <tr key={emp.id_empleado}>
                <td className="text-muted">{inicio + index + 1}</td>
                <td><strong>{emp.nombres} {emp.apellidos}</strong></td>
                <td className="font-monospace" style={{ fontSize:12.5 }}>{emp.dpi ?? <span className="text-muted">—</span>}</td>
                <td className="font-monospace" style={{ fontSize:12.5 }}>{emp.nit ?? <span className="text-muted">—</span>}</td>
                <td className="font-monospace" style={{fontSize:12}}>{emp.banco
                ? <><span className="text-muted" style={{fontSize:11}}>{emp.banco}</span><br/>{emp.numero_cuenta_banco}</>: 
                <span className="text-muted">—</span>}</td>
                <td>{emp.departamento}</td>
                <td>{emp.puesto ?? <span className="text-muted">—</span>}</td>
                <td>Q {Number(emp.salario_base).toLocaleString("es-GT",{minimumFractionDigits:2})}</td>
                <td>
                  <span className={`badge rounded-pill ${emp.estado==="Activo" ? "badge-activo" : "badge-inactivo"}`}>
                    {emp.estado}
                  </span>
                </td>
                <td className="text-center" style={{ whiteSpace:"nowrap" }}>
                  <button className="btn btn-sm btn-outline-primary me-1" title="Editar" onClick={() => abrirEditar(emp)}>
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  {emp.estado==="Activo" && (
                    <button className="btn btn-sm btn-outline-danger" title="Inactivar" onClick={() => abrirEliminar(emp)}>
                      <i className="bi bi-person-dash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!empleadosPaginados.length && (
              <tr><td colSpan={10} className="text-center text-muted py-4">No hay empleados que mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
  <small className="text-muted">
    Mostrando{" "}
    {empleadosFiltrados.length === 0 ? 0 : inicio + 1}
    {" - "}
    {Math.min(inicio + registrosPorPagina, empleadosFiltrados.length)}
    {" de "}
    {empleadosFiltrados.length} empleados
  </small>

  <div className="d-flex gap-2 align-items-center">
    <button
      className="btn btn-outline-secondary btn-sm"
      disabled={paginaActual <= 1}
      onClick={() => setPaginaActual((p) => p - 1)}
    >
      <i className="bi bi-chevron-left"></i>
    </button>

    <span className="small">
      Página {totalPaginas === 0 ? 0 : paginaActual} de {totalPaginas}
    </span>

    <button
      className="btn btn-outline-secondary btn-sm"
      disabled={paginaActual >= totalPaginas}
      onClick={() => setPaginaActual((p) => p + 1)}
    >
      <i className="bi bi-chevron-right"></i>
    </button>
  </div>
</div>

      {/* ── MODAL: Crear / Editar ─────────────────────────────── */}
      <div className="modal fade" ref={modalFormRef} tabIndex={-1} data-bs-backdrop="static">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header modal-header-navy">
            <h5 className="modal-title">
              <i className={`bi ${editId ? "bi-pencil-square" : "bi-person-plus"} me-2`}></i>
              {editId ? "Editar empleado" : "Nuevo empleado"}
            </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={guardar}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nombres <span className="text-danger">*</span></label>
                    <input className="form-control" required value={form.nombres} onChange={f("nombres")} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Apellidos <span className="text-danger">*</span></label>
                    <input className="form-control" required value={form.apellidos} onChange={f("apellidos")} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">DPI</label>
                    <input className="form-control font-monospace" maxLength={13}
                      placeholder="1234567890101"
                      value={form.dpi} onChange={f("dpi")}
                      pattern="\d{0,13}" title="Solo dígitos, máximo 13" />
                    <div className="field-hint">Documento Personal de Identificación — 13 dígitos numéricos</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">NIT</label>
                    <input className="form-control font-monospace"
                      placeholder="1234567-8"
                      value={form.nit} onChange={f("nit")} />
                    <div className="field-hint">Número de Identificación Tributaria (SAT Guatemala)</div>
                  </div>

                  {/* Sección bancaria */}
                  <div className="col-12">
                    <hr className="my-1"/>
                    <p className="fw-semibold text-muted mb-2" style={{fontSize:13}}>
                      Datos bancarios para pago de salario
                    </p>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Banco</label>
                    <select className="form-select" value={form.banco} onChange={f("banco")}>
                      <option value="">Sin asignar</option>
                      <option>Banco Industrial</option>
                      <option>Banrural</option>
                      <option>G&amp;T Continental</option>
                      <option>Agromercantil</option>
                      <option>BAC Credomatic</option>
                      <option>Banco Promerica</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Tipo de cuenta</label>
                    <select className="form-select" value={form.tipo_cuenta_banco} onChange={f("tipo_cuenta_banco")}>
                      <option value="">Seleccione...</option>
                      <option value="Monetaria">Monetaria</option>
                      <option value="Ahorro">Ahorro</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Número de cuenta</label>
                    <input
                      className="form-control font-monospace"
                      placeholder="042-000001-01"
                      value={form.numero_cuenta_banco}
                      onChange={f("numero_cuenta_banco")}
                    />
                    <div className="field-hint">Formato según el banco</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Fecha de nacimiento <span className="text-danger">*</span></label>
                    <input className="form-control" type="date" required value={form.fecha_nacimiento} onChange={f("fecha_nacimiento")} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Fecha de ingreso</label>
                    <input className="form-control" type="date" value={form.fecha_ingreso} onChange={f("fecha_ingreso")} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Departamento <span className="text-danger">*</span></label>
                    <select className="form-select" required value={form.id_departamento} onChange={f("id_departamento")}>
                      <option value="">Seleccione...</option>
                      {departamentos.map((d) => (
                        <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Puesto</label>
                    <select className="form-select" value={form.id_puesto} onChange={f("id_puesto")}>
                      <option value="">Sin asignar</option>
                      {puestos.map((p) => (
                        <option key={p.id_puesto} value={p.id_puesto}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Salario base (Q) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text">Q</span>
                      <input className="form-control" type="number" step="0.01" min="0" required
                        value={form.salario_base} onChange={f("salario_base")} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Días laborados</label>
                    <input className="form-control" type="number" min="1" max="31"
                      value={form.dias_laborados} onChange={f("dias_laborados")} />
                  </div>
                  {editId && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Estado</label>
                      <select className="form-select" value={form.estado} onChange={f("estado")}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" className="btn text-white" style={{ background:"var(--navy)" }} disabled={guardando}>
                  {guardando
                    ? <><span className="spinner-border spinner-border-sm me-1"/>Guardando...</>
                    : editId ? "Guardar cambios" : "Registrar empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── MODAL: Confirmar inactivar ──────────────────────────── */}
      <div className="modal fade" ref={modalDeleteRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ background:"#f3e4e2" }}>
              <h5 className="modal-title" style={{ color:"#a3372f" }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Confirmar inactivación
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              {deleteTarget && (
                <p className="mb-0">
                  ¿Desea inactivar a{" "}
                  <strong>{deleteTarget.nombres} {deleteTarget.apellidos}</strong>?
                  <br/>
                  <span className="text-muted" style={{ fontSize:13 }}>
                    El empleado pasará a estado <em>Inactivo</em> y no será incluido en futuros
                    cálculos. El historial y datos históricos se conservan intactos.
                  </span>
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarEliminar}>Sí, inactivar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
