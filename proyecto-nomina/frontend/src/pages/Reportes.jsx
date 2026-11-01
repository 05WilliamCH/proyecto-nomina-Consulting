import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const REPORTES = [
  { id: "cumpleaneros", label: "Cumpleañeros por mes", necesitaAnio: false },
  { id: "igss", label: "Descuentos de IGSS", necesitaAnio: true },
  { id: "isr", label: "Descuentos de ISR", necesitaAnio: true },
  { id: "poliza-contable", label: "Póliza de Contabilidad", necesitaAnio: true },
  { id: "libro-salarios", label: "Libro de Salarios", necesitaAnio: true },
];

export default function Reportes() {
  const [tipo, setTipo] = useState("cumpleaneros");
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const config = REPORTES.find((r) => r.id === tipo);

  async function generar() {
    setError(""); setCargando(true); setData(null);
    try {
      const qs = config.necesitaAnio ? `?anio=${anio}&mes=${mes}` : `?mes=${mes}`;
      const r = await api.get(`/reportes/${tipo}${qs}`);
      setData(r);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }

  return (
    <div>
      <h2 className="page-title">Reportes</h2>
      <p className="page-subtitle">Los cinco listados y reportes solicitados por Consulting, S.A. (RF-08 a RF-12).</p>

      <div className="panel">
        <div className="form-row">
          <div className="field"><label>Reporte</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {REPORTES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          {config.necesitaAnio && (
            <div className="field"><label>Año</label><input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></div>
          )}
          <div className="field"><label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={generar} disabled={cargando}>
            {cargando ? "Generando..." : "Generar reporte"}
          </button>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {data && tipo === "cumpleaneros" && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Cumpleañeros de {data.mes}</h3>
          <table>
            <thead><tr><th>Empleado</th><th>Departamento</th><th>Fecha de nacimiento</th></tr></thead>
            <tbody>
              {data.empleados.map((e) => (
                <tr key={e.id_empleado}><td>{e.nombres} {e.apellidos}</td><td>{e.departamento}</td><td>{new Date(e.fecha_nacimiento).toLocaleDateString("es-GT", { timeZone: "UTC" })}</td></tr>
              ))}
              {!data.empleados.length && <tr><td colSpan={3} className="muted">No hay cumpleañeros ese mes.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {data && (tipo === "igss" || tipo === "isr") && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Descuentos de {tipo.toUpperCase()} — {data.nombreMes} {data.anio}</h3>
          <table>
            <thead><tr><th>Empleado</th><th>Departamento</th><th>Monto</th></tr></thead>
            <tbody>
              {data.detalle.map((d, i) => (
                <tr key={i}><td>{d.nombres} {d.apellidos}</td><td>{d.departamento}</td><td>Q {Number(d.monto).toFixed(2)}</td></tr>
              ))}
              <tr className="total-row"><td colSpan={2}>Total</td><td>Q {data.total.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {data && tipo === "poliza-contable" && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Póliza Contable — {data.nombreMes} {data.anio}</h3>
          <table>
            <thead><tr><th>Cuenta</th><th>Departamento</th><th>Monto</th></tr></thead>
            <tbody>
              {data.renglones.map((r, i) => (
                <tr key={i}><td>{r.codigo} — {r.cuenta_contable}</td><td>{r.departamento}</td><td>Q {Number(r.monto).toFixed(2)}</td></tr>
              ))}
              <tr className="total-row"><td colSpan={2}>Total póliza</td><td>Q {data.total.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {data && tipo === "libro-salarios" && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Libro de Salarios — {data.nombreMes} {data.anio}</h3>
          <table>
            <thead><tr><th>Departamento</th><th>Empleado</th><th>Sueldo base</th><th>Días</th><th>Ingresos</th><th>Egresos</th><th>Líquido</th></tr></thead>
            <tbody>
              {data.renglones.map((r, i) => (
                <tr key={i}>
                  <td>{r.departamento}</td><td>{r.nombres} {r.apellidos}</td>
                  <td>Q {Number(r.salario_base).toFixed(2)}</td><td>{r.dias_laborados}</td>
                  <td>Q {Number(r.total_ingresos).toFixed(2)}</td><td>Q {Number(r.total_egresos).toFixed(2)}</td>
                  <td>Q {Number(r.liquido_a_pagar).toFixed(2)}</td>
                </tr>
              ))}
              {!data.renglones.length && <tr><td colSpan={7} className="muted">No hay nómina calculada para este periodo.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
