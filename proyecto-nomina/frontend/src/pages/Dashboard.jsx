
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { api } from "../api/client.js";
import {
  fmtQ,
  evolucionChart,
  costoPorDeptoChart,
  descuentosChart,
  salarioPromedioChart,
} from "./dashboardCharts.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

function Kpi({ titulo, valor, detalle, color, icono }) {
  return (
    <div className="col">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="text-secondary small">{titulo}</span>
            <span
              className="rounded-3 p-2"
              style={{
                backgroundColor: `${color}18`,
                color: color,
              }}
            >
              <i className={`bi ${icono} fs-5`}></i>
            </span>
          </div>

          <h4 className="fw-bold mb-1" style={{ color: color }}>
            {valor}
          </h4>

          <small className="text-muted">{detalle}</small>
        </div>
      </div>
    </div>
  );
}

function Panel({ titulo, subtitulo, children, vacio }) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white border-bottom py-3">
        <h6 className="fw-bold mb-1" style={{ color: "var(--navy)" }}>
          {titulo}
        </h6>
        {subtitulo && (
          <small className="text-muted">{subtitulo}</small>
        )}
      </div>

      <div className="card-body">
        {vacio ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-bar-chart-line fs-1 d-block mb-2"></i>
            <span>{vacio}</span>
          </div>
        ) : (
          <div style={{ height: 290, position: "relative" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sel, setSel] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);

    api
      .get(
        sel
          ? `/dashboard?anio=${sel.anio}&mes=${sel.mes}`
          : "/dashboard"
      )
      .then((d) => {
        if (!cancelado) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [sel]);

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill"></i>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted py-4">
        <div className="spinner-border spinner-border-sm"></div>
        Cargando dashboard...
      </div>
    );
  }

  const {
    periodo,
    kpis,
    evolucion,
    porDepartamento,
    descuentosPorTipo,
    plantilla,
    periodos,
  } = data;

  const pctDesc = kpis.totalIngresos
    ? ((kpis.totalEgresos / kpis.totalIngresos) * 100).toFixed(1)
    : "0.0";

  const etiquetaPeriodo = periodo
    ? `${periodo.nombreMes} ${periodo.anio}`
    : "sin nómina";

  const evo = evolucionChart(evolucion);
  const dep = costoPorDeptoChart(porDepartamento);
  const desc = descuentosChart(descuentosPorTipo);
  const sal = salarioPromedioChart(plantilla);

  return (
    <div
      className="container-fluid px-0"
      style={{
        opacity: cargando ? 0.6 : 1,
        transition: "opacity .15s",
      }}
    >
      {/* ENCABEZADO */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "var(--navy)" }}>
            <i className="bi bi-speedometer2 me-2"></i>
            Dashboard
          </h2>
          <p className="text-muted mb-0">
            Resumen de la nómina de {etiquetaPeriodo}.
          </p>
        </div>

        {periodos.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <label
              className="form-label mb-0 text-muted"
              htmlFor="sel-periodo"
            >
              <i className="bi bi-calendar3 me-1"></i>
              Periodo
            </label>

            <select
              id="sel-periodo"
              className="form-select form-select-sm"
              style={{ width: 180 }}
              value={
                periodo
                  ? `${periodo.anio}-${periodo.mes}`
                  : ""
              }
              onChange={(e) => {
                const [anio, mes] = e.target.value
                  .split("-")
                  .map(Number);

                setSel({ anio, mes });
              }}
            >
              {periodos.map((p) => (
                <option
                  key={`${p.anio}-${p.mes}`}
                  value={`${p.anio}-${p.mes}`}
                >
                  {p.nombreMes} {p.anio}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MENSAJE SIN NÓMINA */}
      {!periodo && (
        <div className="alert alert-info border-0 shadow-sm d-flex gap-3">
          <i className="bi bi-info-circle-fill fs-4"></i>
          <div>
            <strong>Aún no hay ninguna nómina calculada.</strong>
            <p className="mb-0 mt-1">
              Calcúlela desde la pantalla <strong>Nómina</strong>,
              o cargue datos de demostración con{" "}
              <code>npm run db:demo</code> en la carpeta del backend.
              Mientras tanto se muestra la plantilla actual.
            </p>
          </div>
        </div>
      )}

      {/* INDICADORES */}
      {periodo && (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-5 g-3 mb-4">
          <Kpi
            titulo="Empleados activos"
            valor={kpis.empleadosActivos}
            detalle={`${kpis.empleadosConNomina} con nómina en ${periodo.nombreMes}`}
            color="#1f3a5f"
            icono="bi-people"
          />

          <Kpi
            titulo="Total devengado"
            valor={fmtQ(kpis.totalIngresos)}
            detalle="Ingresos del periodo"
            color="#2563eb"
            icono="bi-cash-stack"
          />

          <Kpi
            titulo="Descuentos"
            valor={fmtQ(kpis.totalEgresos)}
            detalle={`${pctDesc}% del devengado`}
            color="#c76b2e"
            icono="bi-receipt"
          />

          <Kpi
            titulo="Anticipos (día 15)"
            valor={fmtQ(kpis.anticipos)}
            detalle="Entregados a mitad de mes"
            color="#b58500"
            icono="bi-wallet2"
          />

          <Kpi
            titulo="Neto pagado"
            valor={fmtQ(kpis.neto)}
            detalle="Devengado − descuentos"
            color="#2e7d4f"
            icono="bi-check-circle"
          />
        </div>
      )}

      {/* GRÁFICOS */}
      <div className="row g-3">
        {periodo && (
          <>
            <div className="col-12 col-xl-8">
              <Panel
                titulo="Evolución mensual"
                subtitulo="Ingresos, egresos y neto — últimos 6 meses"
                vacio={!evolucion.length && "Sin datos en el rango."}
              >
                <Bar data={evo.data} options={evo.options} />
              </Panel>
            </div>

            <div className="col-12 col-xl-4">
              <Panel
                titulo="Costo por departamento"
                subtitulo={`Devengado de ${periodo.nombreMes}`}
                vacio={
                  !porDepartamento.length &&
                  "Sin datos en el periodo."
                }
              >
                <Doughnut data={dep.data} options={dep.options} />
              </Panel>
            </div>

            <div className="col-12 col-lg-6">
              <Panel
                titulo="Descuentos por tipo"
                subtitulo={`IGSS, ISR, Asociación Solidarista y tienda — ${periodo.nombreMes}`}
                vacio={
                  !descuentosPorTipo.length &&
                  "Sin descuentos en el periodo."
                }
              >
                <Bar data={desc.data} options={desc.options} />
              </Panel>
            </div>
          </>
        )}

        <div className={periodo ? "col-12 col-lg-6" : "col-12"}>
          <Panel
            titulo="Salario base promedio por departamento"
            subtitulo="Solo empleados activos"
            vacio={!plantilla.length && "Sin departamentos."}
          >
            <Bar data={sal.data} options={sal.options} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
