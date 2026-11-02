
import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Anticipos() {
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    setError("");
    setCargando(true);
    setResultado(null);

    if (!anio || anio < 2000 || anio > 2100) {
      setError("Ingrese un año válido.");
      setCargando(false);
      return;
    }

    if (mes < 1 || mes > 12) {
      setError("Seleccione un mes válido.");
      setCargando(false);
      return;
    }

    try {
      const r = await api.post("/anticipos/calcular", {
        anio,
        mes
      });

      setResultado(r);
    } catch (e) {
      setError(e.message || "No fue posible calcular los anticipos.");
    } finally {
      setCargando(false);
    }
  }

  function formatoMoneda(valor) {
    return Number(valor || 0).toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const anticipos = resultado?.anticipos || [];

  const totalAnticipos = anticipos.reduce(
    (total, item) => total + Number(item.monto || 0),
    0
  );

  return (
    <div className="modulo-anticipos">

      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 className="page-title mb-1">
            Anticipo Quincenal
          </h2>
          <p className="page-subtitle mb-0">
            Cálculo del anticipo correspondiente al 50% del salario base
            de los empleados activos.
          </p>
        </div>

        <span className="badge rounded-pill text-bg-primary px-3 py-2">
          <i className="bi bi-calendar-event me-2"></i>
          Pago día 15
        </span>
      </div>

      {/* INFORMACIÓN */}
      <div className="card anticipo-info mb-4">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="anticipo-info-icon">
            <i className="bi bi-info-circle"></i>
          </div>
          <div>
            <h6 className="mb-1">Información del anticipo</h6>
            <p className="mb-0 text-muted">
              El sistema calcula el 50% del salario base para todos los
              empleados activos del periodo seleccionado.
            </p>
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {/* SELECCIÓN DEL PERIODO */}
      <div className="card anticipo-card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-calculator me-2"></i>
            Parámetros de cálculo
          </h5>
        </div>

        <div className="card-body">
          <div className="row g-3 align-items-end">

            <div className="col-md-4">
              <label className="form-label">Año</label>
              <input
                type="number"
                className="form-control"
                min="2000"
                max="2100"
                value={anio}
                onChange={(e) => {
                  setAnio(Number(e.target.value));
                  setResultado(null);
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Mes</label>
              <select
                className="form-select"
                value={mes}
                onChange={(e) => {
                  setMes(Number(e.target.value));
                  setResultado(null);
                }}
              >
                {MESES.map((nombre, index) => (
                  <option key={index} value={index + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <button
                type="button"
                className="btn btn-calcular-anticipo w-100"
                onClick={calcular}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Calculando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-calculator me-2"></i>
                    Calcular anticipo
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RESULTADOS */}
      {resultado && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h4 className="anticipo-result-title mb-1">
                Resultado del cálculo
              </h4>
              <p className="text-muted mb-0 small">
                Periodo: {MESES[mes - 1]} {anio}
              </p>
            </div>

            <span className="badge text-bg-success px-3 py-2">
              <i className="bi bi-check-circle me-1"></i>
              Cálculo realizado
            </span>
          </div>

          {/* RESUMEN */}
          <div className="row g-3 mb-4">

            <div className="col-md-6">
              <div className="card anticipo-resumen">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <span className="resumen-label">
                      Empleados incluidos
                    </span>
                    <h3>{anticipos.length}</h3>
                    <small className="text-muted">
                      Anticipos calculados
                    </small>
                  </div>
                  <div className="anticipo-resumen-icon">
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card anticipo-resumen anticipo-total">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <span className="resumen-label">
                      Total de anticipos
                    </span>
                    <h3>Q {formatoMoneda(totalAnticipos)}</h3>
                    <small className="text-muted">
                      Monto total del periodo
                    </small>
                  </div>
                  <div className="anticipo-resumen-icon">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* TABLA */}
          <div className="card anticipo-card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Detalle de anticipos
              </h5>

              <span className="badge text-bg-primary">
                {anticipos.length} registros
              </span>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">#</th>
                      <th>ID empleado</th>
                      <th className="text-end">Monto del anticipo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {anticipos.map((item, index) => (
                      <tr key={item.id_anticipo}>
                        <td className="text-center text-muted">
                          {index + 1}
                        </td>
                        <td>
                          <span className="badge text-bg-light border">
                            #{item.id_empleado}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">
                          Q {formatoMoneda(item.monto)}
                        </td>
                      </tr>
                    ))}

                    {!anticipos.length && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          No se encontraron anticipos para este periodo.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {anticipos.length > 0 && (
                    <tfoot>
                      <tr>
                        <th colSpan={2} className="text-end">
                          Total general
                        </th>
                        <th className="text-end">
                          Q {formatoMoneda(totalAnticipos)}
                        </th>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
