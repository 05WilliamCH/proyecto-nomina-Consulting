import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function Nomina() {
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    setError("");
    setCargando(true);
    setResultado(null);

    try {
      const r = await api.post("/nomina/calcular", { anio, mes });
      setResultado(r);
    } catch (e) {
      setError(e.message || "No fue posible calcular la nómina.");
    } finally {
      setCargando(false);
    }
  }

  const resultados = resultado?.resultados || [];

  const total = resultados.reduce(
    (acc, r) => acc + Number(r.liquido_a_pagar || 0),
    0
  );

  const totalIngresos = resultados.reduce(
    (acc, r) => acc + Number(r.total_ingresos || 0),
    0
  );

  const totalEgresos = resultados.reduce(
    (acc, r) => acc + Number(r.total_egresos || 0),
    0
  );

  const totalAnticipos = resultados.reduce(
    (acc, r) => acc + Number(r.anticipo_descontado || 0),
    0
  );

  return (
    <div className="modulo-nomina">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="page-title mb-1">
            <i className="bi bi-calculator me-2"></i>
            Cálculo de Nómina
          </h2>
          <p className="page-subtitle mb-0">
            Calcula la nómina de fin de mes, considerando ingresos,
            egresos de ley y anticipos correspondientes al periodo.
          </p>
        </div>

        <span className="badge bg-primary-subtle text-primary px-3 py-2">
          <i className="bi bi-calendar-check me-1"></i>
          Nómina mensual
        </span>
      </div>

      <div className="card nomina-filtro mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-calendar3 text-primary fs-5"></i>
            <h5 className="mb-0 fw-semibold">Periodo de cálculo</h5>
          </div>

          <div className="row align-items-end g-3">
            <div className="col-12 col-md-4">
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

            <div className="col-12 col-md-4">
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

            <div className="col-12 col-md-4">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={calcular}
                disabled={cargando || anio < 2000 || anio > 2100 || mes < 1 || mes > 12}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Calculando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-calculator me-2"></i>
                    Calcular nómina
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="nomina-nota mt-3">
            <i className="bi bi-info-circle me-2"></i>
            Selecciona el periodo correspondiente antes de generar el cálculo.
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {resultado && (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h5 className="fw-bold mb-1">
                Resultados de nómina
              </h5>
              <span className="text-muted small">
                Periodo: {resultado.periodo.nombreMes} {resultado.periodo.anio}
              </span>
            </div>

            <span className="badge bg-success-subtle text-success px-3 py-2">
              <i className="bi bi-check-circle me-1"></i>
              Cálculo generado
            </span>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="card nomina-resumen h-100">
                <div className="card-body">
                  <div className="nomina-resumen-icon ingresos">
                    <i className="bi bi-arrow-down-circle"></i>
                  </div>
                  <div className="text-muted small mt-3">Total ingresos</div>
                  <h5 className="fw-bold mb-0">
                    Q {formatoMoneda(totalIngresos)}
                  </h5>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="card nomina-resumen h-100">
                <div className="card-body">
                  <div className="nomina-resumen-icon egresos">
                    <i className="bi bi-arrow-up-circle"></i>
                  </div>
                  <div className="text-muted small mt-3">Total egresos</div>
                  <h5 className="fw-bold mb-0">
                    Q {formatoMoneda(totalEgresos)}
                  </h5>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="card nomina-resumen h-100">
                <div className="card-body">
                  <div className="nomina-resumen-icon anticipos">
                    <i className="bi bi-wallet2"></i>
                  </div>
                  <div className="text-muted small mt-3">Anticipos descontados</div>
                  <h5 className="fw-bold mb-0">
                    Q {formatoMoneda(totalAnticipos)}
                  </h5>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="card nomina-resumen nomina-liquido h-100">
                <div className="card-body">
                  <div className="nomina-resumen-icon liquido">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div className="text-muted small mt-3">Líquido total a pagar</div>
                  <h5 className="fw-bold mb-0 text-success">
                    Q {formatoMoneda(total)}
                  </h5>
                </div>
              </div>
            </div>
          </div>

          <div className="card nomina-tabla-card">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-people me-2 text-primary"></i>
                  Detalle por empleado
                </h6>
                <span className="badge bg-light text-dark border">
                  {resultados.length} empleado(s)
                </span>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID empleado</th>
                      <th className="text-end">Ingresos</th>
                      <th className="text-end">Egresos</th>
                      <th className="text-end">Anticipo</th>
                      <th className="text-end">Líquido a pagar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultados.length > 0 ? (
                      resultados.map((r, index) => (
                        <tr key={r.id_resultado}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              #{r.id_empleado}
                            </span>
                          </td>
                          <td className="text-end text-success">
                            Q {formatoMoneda(r.total_ingresos)}
                          </td>
                          <td className="text-end text-danger">
                            Q {formatoMoneda(r.total_egresos)}
                          </td>
                          <td className="text-end text-muted">
                            Q {formatoMoneda(r.anticipo_descontado)}
                          </td>
                          <td className="text-end fw-bold">
                            Q {formatoMoneda(r.liquido_a_pagar)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No hay resultados para el periodo seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {resultados.length > 0 && (
                    <tfoot>
                      <tr className="table-light fw-bold">
                        <td colSpan="5" className="text-end">
                          Total nómina del periodo
                        </td>
                        <td className="text-end text-success">
                          Q {formatoMoneda(total)}
                        </td>
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