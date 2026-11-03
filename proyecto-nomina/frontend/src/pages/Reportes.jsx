import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

import {
  exportarPDF,
  exportarExcel
} from "../utils/exportarReportes.js";

const hoy = new Date();

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const REPORTES = [
  {
    id: "cumpleaneros",
    label: "Cumpleañeros por mes",
    descripcion: "Consulta los cumpleaños de los empleados.",
    icono: "bi-cake2",
    color: "azul",
    necesitaAnio: false
  },
  {
    id: "igss",
    label: "Descuentos de IGSS",
    descripcion: "Consulta los descuentos de IGSS del periodo.",
    icono: "bi-shield-check",
    color: "verde",
    necesitaAnio: true
  },
  {
    id: "isr",
    label: "Descuentos de ISR",
    descripcion: "Consulta las retenciones de ISR del periodo.",
    icono: "bi-receipt",
    color: "naranja",
    necesitaAnio: true
  },
  {
    id: "poliza-contable",
    label: "Póliza de Contabilidad",
    descripcion: "Consulta los renglones de la póliza contable.",
    icono: "bi-journal-text",
    color: "morado",
    necesitaAnio: true
  },
  {
    id: "libro-salarios",
    label: "Libro de Salarios",
    descripcion: "Consulta los salarios, ingresos y egresos.",
    icono: "bi-book",
    color: "azul",
    necesitaAnio: true
  }
];

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatoFecha = (fecha) => {
  if (!fecha) return "—";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return valor.toLocaleDateString("es-GT", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export default function Reportes() {
  const [tipo, setTipo] = useState("cumpleaneros");
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const config = REPORTES.find((r) => r.id === tipo) || REPORTES[0];

  async function generar() {
    setError("");
    setCargando(true);
    setData(null);

    try {
      const qs = config.necesitaAnio
        ? `?anio=${anio}&mes=${mes}`
        : `?mes=${mes}`;

      const r = await api.get(`/reportes/${tipo}${qs}`);
      setData(r);
    } catch (e) {
      setError(e.message || "No fue posible generar el reporte.");
    } finally {
      setCargando(false);
    }
  }

  const empleados = data?.empleados || [];
  const detalle = data?.detalle || [];
  const renglones = data?.renglones || [];

  const totalRegistros =
    tipo === "cumpleaneros"
      ? empleados.length
      : tipo === "igss" || tipo === "isr"
        ? detalle.length
        : renglones.length;

  function prepararExportacion() {
  const configuracion = {
    titulo: config.label,
    periodo:
      tipo === "cumpleaneros"
        ? `Mes: ${data.mes}`
        : `Periodo: ${data.nombreMes} ${data.anio}`,
    nombreArchivo:
      tipo === "cumpleaneros"
        ? `${tipo}-${mes}`
        : `${tipo}-${anio}-${mes}`,
    total: data.total,
    mostrarTotal:
      ["igss", "isr", "poliza-contable"].includes(tipo),
    horizontal: tipo === "libro-salarios"
  };

  let columnas = [];
  let filas = [];

  if (tipo === "cumpleaneros") {
    columnas = [
      "No.",
      "Empleado",
      "Departamento",
      "Fecha de nacimiento"
    ];

    filas = empleados.map((e, i) => [
      i + 1,
      `${e.nombres} ${e.apellidos}`,
      e.departamento || "—",
      formatoFecha(e.fecha_nacimiento)
    ]);
  }

  if (tipo === "igss" || tipo === "isr") {
    columnas = [
      "No.",
      "Empleado",
      "Departamento",
      "Monto"
    ];

    filas = detalle.map((d, i) => [
      i + 1,
      `${d.nombres} ${d.apellidos}`,
      d.departamento || "—",
      Number(d.monto || 0)
    ]);
  }

  if (tipo === "poliza-contable") {
    columnas = [
      "No.",
      "Código",
      "Cuenta contable",
      "Departamento",
      "Monto"
    ];

    filas = renglones.map((r, i) => [
      i + 1,
      r.codigo,
      r.cuenta_contable,
      r.departamento || "—",
      Number(r.monto || 0)
    ]);
  }

  if (tipo === "libro-salarios") {
    columnas = [
      "No.",
      "Departamento",
      "Empleado",
      "Sueldo base",
      "Días laborados",
      "Ingresos",
      "Egresos",
      "Líquido a pagar"
    ];

    filas = renglones.map((r, i) => [
      i + 1,
      r.departamento || "—",
      `${r.nombres} ${r.apellidos}`,
      Number(r.salario_base || 0),
      Number(r.dias_laborados || 0),
      Number(r.total_ingresos || 0),
      Number(r.total_egresos || 0),
      Number(r.liquido_a_pagar || 0)
    ]);
  }

  return {
    ...configuracion,
    columnas,
    filas
  };
}

  return (
    <div className="modulo-reportes">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="page-title mb-1">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Reportes
          </h2>
          <p className="page-subtitle mb-0">
            Consulta los cinco reportes de Consulting, S.A. correspondientes
            a los requerimientos RF-08 a RF-12.
          </p>
        </div>

        <span className="badge bg-primary-subtle text-primary px-3 py-2">
          <i className="bi bi-files me-1"></i>
          Reportes del sistema
        </span>
      </div>

      <div className="row g-3 mb-4">
        {REPORTES.map((reporte) => (
          <div className="col-12 col-md-6 col-xl-4" key={reporte.id}>
            <button
              type="button"
              className={`reporte-opcion w-100 text-start ${
                tipo === reporte.id ? "seleccionado" : ""
              }`}
              onClick={() => {
                setTipo(reporte.id);
                setData(null);
                setError("");
              }}
            >
              <div className={`reporte-icono ${reporte.color}`}>
                <i className={`bi ${reporte.icono}`}></i>
              </div>

              <div className="reporte-opcion-contenido">
                <div className="fw-semibold">{reporte.label}</div>
                <div className="text-muted small mt-1">
                  {reporte.descripcion}
                </div>
              </div>

              <i
                className={`bi ${
                  tipo === reporte.id
                    ? "bi-check-circle-fill text-primary"
                    : "bi-chevron-right text-muted"
                } reporte-seleccion-icono`}
              ></i>
            </button>
          </div>
        ))}
      </div>
      
      <div className="d-flex flex-wrap align-items-center gap-2">
  <div className="reportes-conteo">
    <i className="bi bi-list-ul me-2"></i>
    {totalRegistros} registro(s)
  </div>

  <button
    className="btn btn-danger"
    onClick={() => exportarPDF(prepararExportacion())}
    disabled={totalRegistros === 0}
  >
    <i className="bi bi-file-earmark-pdf me-2"></i>
    PDF
  </button>

  <button
    className="btn btn-success"
    onClick={() => exportarExcel(prepararExportacion())}
    disabled={totalRegistros === 0}
  >
    <i className="bi bi-file-earmark-excel me-2"></i>
    Excel
  </button>
</div>

      <div className="card reportes-filtros mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-funnel text-primary fs-5"></i>
            <h5 className="mb-0 fw-semibold">Parámetros del reporte</h5>
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label fw-semibold">
                Reporte seleccionado
              </label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setData(null);
                  setError("");
                }}
              >
                {REPORTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {config.necesitaAnio && (
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Año</label>
                <input
                  type="number"
                  className="form-control"
                  min="2000"
                  max="2100"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                />
              </div>
            )}

            <div
              className={`col-12 ${
                config.necesitaAnio ? "col-md-2" : "col-md-3"
              }`}
            >
              <label className="form-label fw-semibold">Mes</label>
              <select
                className="form-select"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-2">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={generar}
                disabled={
                  cargando ||
                  mes < 1 ||
                  mes > 12 ||
                  (config.necesitaAnio && (anio < 2000 || anio > 2100))
                }
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generando
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Consultar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="reportes-ayuda mt-3">
            <i className="bi bi-info-circle me-2"></i>
            {config.descripcion}
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {cargando && (
        <div className="card reportes-estado text-center py-5 mb-4">
          <div className="spinner-border text-primary mx-auto mb-3"></div>
          <h6 className="fw-semibold">Generando reporte...</h6>
          <p className="text-muted small mb-0">
            Espera mientras se consultan los datos.
          </p>
        </div>
      )}

      {data && (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-1">
                <i className={`bi ${config.icono} me-2 text-primary`}></i>
                {config.label}
              </h5>
              <span className="text-muted small">
                {tipo === "cumpleaneros"
                  ? `Mes: ${data.mes}`
                  : `${data.nombreMes} ${data.anio}`}
              </span>
            </div>

            <div className="reportes-conteo">
              <i className="bi bi-list-ul me-2"></i>
              {totalRegistros} registro(s)
            </div>
          </div>

          {tipo === "cumpleaneros" && (
            <div className="card reportes-tabla-card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Empleado</th>
                        <th>Departamento</th>
                        <th>Fecha de nacimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleados.length > 0 ? (
                        empleados.map((e, i) => (
                          <tr key={e.id_empleado}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold">
                              {e.nombres} {e.apellidos}
                            </td>
                            <td>{e.departamento || "—"}</td>
                            <td>{formatoFecha(e.fecha_nacimiento)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-5">
                            <i className="bi bi-calendar2-x reportes-vacio-icon"></i>
                            <div className="fw-semibold mt-2">
                              No hay cumpleañeros este mes
                            </div>
                            <div className="text-muted small">
                              No se encontraron empleados para el mes consultado.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(tipo === "igss" || tipo === "isr") && (
            <div className="card reportes-tabla-card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Empleado</th>
                        <th>Departamento</th>
                        <th className="text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.length > 0 ? (
                        detalle.map((d, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            <td className="fw-semibold">
                              {d.nombres} {d.apellidos}
                            </td>
                            <td>{d.departamento || "—"}</td>
                            <td className="text-end">
                              Q {formatoMoneda(d.monto)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-5">
                            <i className="bi bi-inbox reportes-vacio-icon"></i>
                            <div className="fw-semibold mt-2">
                              Sin registros para este periodo
                            </div>
                          </td>
                        </tr>
                      )}

                      {detalle.length > 0 && (
                        <tr className="table-light fw-bold">
                          <td colSpan={3} className="text-end">
                            Total de descuentos
                          </td>
                          <td className="text-end text-primary">
                            Q {formatoMoneda(data.total)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tipo === "poliza-contable" && (
            <div className="card reportes-tabla-card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Cuenta contable</th>
                        <th>Departamento</th>
                        <th className="text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renglones.length > 0 ? (
                        renglones.map((r, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            <td>
                              <span className="text-muted me-2">
                                {r.codigo}
                              </span>
                              <span className="fw-semibold">
                                {r.cuenta_contable}
                              </span>
                            </td>
                            <td>{r.departamento || "—"}</td>
                            <td className="text-end">
                              Q {formatoMoneda(r.monto)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-5">
                            <i className="bi bi-journal-x reportes-vacio-icon"></i>
                            <div className="fw-semibold mt-2">
                              No hay renglones contables
                            </div>
                          </td>
                        </tr>
                      )}

                      {renglones.length > 0 && (
                        <tr className="table-light fw-bold">
                          <td colSpan={3} className="text-end">
                            Total de la póliza
                          </td>
                          <td className="text-end text-primary">
                            Q {formatoMoneda(data.total)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tipo === "libro-salarios" && (
            <div className="card reportes-tabla-card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Departamento</th>
                        <th>Empleado</th>
                        <th className="text-end">Sueldo base</th>
                        <th className="text-end">Días</th>
                        <th className="text-end">Ingresos</th>
                        <th className="text-end">Egresos</th>
                        <th className="text-end">Líquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renglones.length > 0 ? (
                        renglones.map((r, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            <td>{r.departamento || "—"}</td>
                            <td className="fw-semibold">
                              {r.nombres} {r.apellidos}
                            </td>
                            <td className="text-end text-nowrap">
                              Q {formatoMoneda(r.salario_base)}
                            </td>
                            <td className="text-end">{r.dias_laborados}</td>
                            <td className="text-end text-success text-nowrap">
                              Q {formatoMoneda(r.total_ingresos)}
                            </td>
                            <td className="text-end text-danger text-nowrap">
                              Q {formatoMoneda(r.total_egresos)}
                            </td>
                            <td className="text-end fw-bold text-nowrap">
                              Q {formatoMoneda(r.liquido_a_pagar)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-5">
                            <i className="bi bi-inbox reportes-vacio-icon"></i>
                            <div className="fw-semibold mt-2">
                              No hay nómina calculada
                            </div>
                            <div className="text-muted small">
                              No se encontraron resultados para este periodo.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}