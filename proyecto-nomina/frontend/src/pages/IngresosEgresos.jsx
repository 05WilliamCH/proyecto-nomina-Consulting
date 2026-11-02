
import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const FORM_INGRESO = {
  id_empleado: "",
  id_tipo_ingreso: "",
  monto: ""
};

const FORM_EGRESO = {
  id_empleado: "",
  id_tipo_egreso: "",
  monto: ""
};

export default function IngresosEgresos() {
  const [empleados, setEmpleados] = useState([]);
  const [tiposIngreso, setTiposIngreso] = useState([]);
  const [tiposEgreso, setTiposEgreso] = useState([]);

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [guardandoIngreso, setGuardandoIngreso] = useState(false);
  const [guardandoEgreso, setGuardandoEgreso] = useState(false);

  const [formIngreso, setFormIngreso] = useState(FORM_INGRESO);
  const [formEgreso, setFormEgreso] = useState(FORM_EGRESO);

  const [busquedaIngreso, setBusquedaIngreso] = useState("");
  const [busquedaEgreso, setBusquedaEgreso] = useState("");
  const [filtroTipoIngreso, setFiltroTipoIngreso] = useState("");
  const [filtroTipoEgreso, setFiltroTipoEgreso] = useState("");

  async function cargarCatalogos() {
    try {
      const [emps, ti, te] = await Promise.all([
        api.get("/empleados?estado=Activo"),
        api.get("/tipos-ingreso"),
        api.get("/tipos-egreso")
      ]);

      setEmpleados(emps);
      setTiposIngreso(ti);
      setTiposEgreso(te);
    } catch (e) {
      setError(e.message || "No fue posible cargar los catálogos.");
    }
  }

  async function cargarDetalle() {
    try {
      const [ing, egr] = await Promise.all([
        api.get(`/ingresos?anio=${anio}&mes=${mes}`),
        api.get(`/egresos?anio=${anio}&mes=${mes}`)
      ]);

      setIngresos(ing);
      setEgresos(egr);
    } catch (e) {
      setError(e.message || "No fue posible cargar los registros.");
    }
  }

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarDetalle();
  }, [anio, mes]);

  function nombreEmpleado(id) {
    const empleado = empleados.find(
      (x) => Number(x.id_empleado) === Number(id)
    );

    return empleado
      ? `${empleado.nombres} ${empleado.apellidos}`
      : `Empleado #${id}`;
  }

  function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  async function registrarIngreso(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (Number(formIngreso.monto) <= 0) {
      setError("El monto del ingreso debe ser mayor que cero.");
      return;
    }

    setGuardandoIngreso(true);

    try {
      await api.post("/ingresos", {
        ...formIngreso,
        anio,
        mes,
        monto: Number(formIngreso.monto),
        id_empleado: Number(formIngreso.id_empleado),
        id_tipo_ingreso: Number(formIngreso.id_tipo_ingreso)
      });

      setFormIngreso({ ...FORM_INGRESO });
      setOk("Ingreso registrado correctamente.");
      await cargarDetalle();
    } catch (e) {
      setError(e.message || "No fue posible registrar el ingreso.");
    } finally {
      setGuardandoIngreso(false);
    }
  }

  async function registrarEgreso(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (Number(formEgreso.monto) <= 0) {
      setError("El monto del egreso debe ser mayor que cero.");
      return;
    }

    setGuardandoEgreso(true);

    try {
      await api.post("/egresos", {
        ...formEgreso,
        anio,
        mes,
        monto: Number(formEgreso.monto),
        id_empleado: Number(formEgreso.id_empleado),
        id_tipo_egreso: Number(formEgreso.id_tipo_egreso)
      });

      setFormEgreso({ ...FORM_EGRESO });
      setOk("Egreso registrado correctamente.");
      await cargarDetalle();
    } catch (e) {
      setError(e.message || "No fue posible registrar el egreso.");
    } finally {
      setGuardandoEgreso(false);
    }
  }

  const ingresosFiltrados = ingresos.filter((item) => {
    const texto = busquedaIngreso.toLowerCase().trim();

    const coincideBusqueda =
      !texto ||
      nombreEmpleado(item.id_empleado).toLowerCase().includes(texto) ||
      String(item.tipo_ingreso || "").toLowerCase().includes(texto);

    const coincideTipo =
      !filtroTipoIngreso ||
      String(item.tipo_ingreso) === filtroTipoIngreso;

    return coincideBusqueda && coincideTipo;
  });

  const egresosFiltrados = egresos.filter((item) => {
    const texto = busquedaEgreso.toLowerCase().trim();

    const coincideBusqueda =
      !texto ||
      nombreEmpleado(item.id_empleado).toLowerCase().includes(texto) ||
      String(item.tipo_egreso || "").toLowerCase().includes(texto);

    const coincideTipo =
      !filtroTipoEgreso ||
      String(item.tipo_egreso) === filtroTipoEgreso;

    return coincideBusqueda && coincideTipo;
  });

  const totalIngresos = ingresos.reduce(
    (total, item) => total + Number(item.monto || 0), 0
  );

  const totalEgresos = egresos.reduce(
    (total, item) => total + Number(item.monto || 0), 0
  );

  return (
    <div className="ingresos-egresos">

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h2 className="page-title mb-1">Ingresos y Egresos</h2>
          <p className="page-subtitle mb-0">
            Administración de los movimientos de nómina por periodo.
          </p>
        </div>

        <div className="periodo-selector">
          <div>
            <label className="form-label">Año</label>
            <input
              type="number"
              className="form-control"
              min="2000"
              max="2100"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="form-label">Mes</label>
            <select
              className="form-select"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {MESES.map((nombre, index) => (
                <option key={index} value={index + 1}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card resumen-card resumen-ingreso">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <span className="resumen-label">Total de ingresos</span>
                <h3>Q {formatoMoneda(totalIngresos)}</h3>
                <small>{ingresos.length} registros</small>
              </div>
              <div className="resumen-icon">
                <i className="bi bi-cash-stack"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card resumen-card resumen-egreso">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <span className="resumen-label">Total de egresos</span>
                <h3>Q {formatoMoneda(totalEgresos)}</h3>
                <small>{egresos.length} registros</small>
              </div>
              <div className="resumen-icon">
                <i className="bi bi-wallet2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">

        {/* FORMULARIO DE INGRESOS */}
        <div className="col-12">
          <div className="card movimiento-card">
            <div className="card-header encabezado-ingreso">
              <div>
                <h5 className="mb-1">
                  <i className="bi bi-plus-circle me-2"></i>
                  Registrar ingreso
                </h5>
                <small>Agregar ingresos correspondientes al empleado.</small>
              </div>
            </div>

            <div className="card-body">
              <form onSubmit={registrarIngreso}>
                <div className="row g-3 align-items-end">

                  <div className="col-md-4">
                    <label className="form-label">Empleado</label>
                    <select
                      className="form-select"
                      required
                      value={formIngreso.id_empleado}
                      onChange={(e) =>
                        setFormIngreso({
                          ...formIngreso,
                          id_empleado: e.target.value
                        })
                      }
                    >
                      <option value="">Seleccione un empleado...</option>
                      {empleados.map((emp) => (
                        <option key={emp.id_empleado} value={emp.id_empleado}>
                          {emp.nombres} {emp.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Tipo de ingreso</label>
                    <select
                      className="form-select"
                      required
                      value={formIngreso.id_tipo_ingreso}
                      onChange={(e) =>
                        setFormIngreso({
                          ...formIngreso,
                          id_tipo_ingreso: e.target.value
                        })
                      }
                    >
                      <option value="">Seleccione...</option>
                      {tiposIngreso.map((tipo) => (
                        <option key={tipo.id_tipo_ingreso} value={tipo.id_tipo_ingreso}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Monto (Q)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formIngreso.monto}
                      onChange={(e) =>
                        setFormIngreso({
                          ...formIngreso,
                          monto: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <button
                      className="btn btn-ingreso w-100"
                      type="submit"
                      disabled={guardandoIngreso}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      {guardandoIngreso ? "Guardando..." : "Agregar"}
                    </button>
                  </div>
                </div>
              </form>

              <hr className="my-4" />

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h6 className="mb-0">Detalle de ingresos</h6>
                <span className="badge text-bg-success">
                  {ingresosFiltrados.length} registros
                </span>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      className="form-control"
                      placeholder="Buscar empleado o tipo de ingreso..."
                      value={busquedaIngreso}
                      onChange={(e) => setBusquedaIngreso(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filtroTipoIngreso}
                    onChange={(e) => setFiltroTipoIngreso(e.target.value)}
                  >
                    <option value="">Todos los tipos de ingreso</option>
                    {[...new Set(ingresos.map((i) => i.tipo_ingreso).filter(Boolean))].map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-striped table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Empleado</th>
                      <th>Tipo de ingreso</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosFiltrados.map((item, index) => (
                      <tr key={item.id_detalle}>
                        <td>{index + 1}</td>
                        <td>{nombreEmpleado(item.id_empleado)}</td>
                        <td>{item.tipo_ingreso}</td>
                        <td className="text-end fw-semibold">
                          Q {formatoMoneda(item.monto)}
                        </td>
                      </tr>
                    ))}

                    {!ingresosFiltrados.length && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No hay ingresos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-end mt-3">
                <strong>Total mostrado: Q {formatoMoneda(
                  ingresosFiltrados.reduce((s, i) => s + Number(i.monto || 0), 0)
                )}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO DE EGRESOS */}
        <div className="col-12">
          <div className="card movimiento-card">
            <div className="card-header encabezado-egreso">
              <div>
                <h5 className="mb-1">
                  <i className="bi bi-dash-circle me-2"></i>
                  Registrar egreso
                </h5>
                <small>Agregar descuentos y otros egresos del empleado.</small>
              </div>
            </div>

            <div className="card-body">
              <form onSubmit={registrarEgreso}>
                <div className="row g-3 align-items-end">

                  <div className="col-md-4">
                    <label className="form-label">Empleado</label>
                    <select
                      className="form-select"
                      required
                      value={formEgreso.id_empleado}
                      onChange={(e) =>
                        setFormEgreso({
                          ...formEgreso,
                          id_empleado: e.target.value
                        })
                      }
                    >
                      <option value="">Seleccione un empleado...</option>
                      {empleados.map((emp) => (
                        <option key={emp.id_empleado} value={emp.id_empleado}>
                          {emp.nombres} {emp.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Tipo de egreso</label>
                    <select
                      className="form-select"
                      required
                      value={formEgreso.id_tipo_egreso}
                      onChange={(e) =>
                        setFormEgreso({
                          ...formEgreso,
                          id_tipo_egreso: e.target.value
                        })
                      }
                    >
                      <option value="">Seleccione...</option>
                      {tiposEgreso.map((tipo) => (
                        <option key={tipo.id_tipo_egreso} value={tipo.id_tipo_egreso}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Monto (Q)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formEgreso.monto}
                      onChange={(e) =>
                        setFormEgreso({
                          ...formEgreso,
                          monto: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <button
                      className="btn btn-egreso w-100"
                      type="submit"
                      disabled={guardandoEgreso}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      {guardandoEgreso ? "Guardando..." : "Agregar"}
                    </button>
                  </div>
                </div>
              </form>

              <hr className="my-4" />

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h6 className="mb-0">Detalle de egresos</h6>
                <span className="badge text-bg-danger">
                  {egresosFiltrados.length} registros
                </span>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      className="form-control"
                      placeholder="Buscar empleado o tipo de egreso..."
                      value={busquedaEgreso}
                      onChange={(e) => setBusquedaEgreso(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={filtroTipoEgreso}
                    onChange={(e) => setFiltroTipoEgreso(e.target.value)}
                  >
                    <option value="">Todos los tipos de egreso</option>
                    {[...new Set(egresos.map((i) => i.tipo_egreso).filter(Boolean))].map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-striped table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Empleado</th>
                      <th>Tipo de egreso</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {egresosFiltrados.map((item, index) => (
                      <tr key={item.id_detalle}>
                        <td>{index + 1}</td>
                        <td>{nombreEmpleado(item.id_empleado)}</td>
                        <td>{item.tipo_egreso}</td>
                        <td className="text-end fw-semibold">
                          Q {formatoMoneda(item.monto)}
                        </td>
                      </tr>
                    ))}

                    {!egresosFiltrados.length && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          No hay egresos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-end mt-3">
                <strong>Total mostrado: Q {formatoMoneda(
                  egresosFiltrados.reduce((s, i) => s + Number(i.monto || 0), 0)
                )}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
