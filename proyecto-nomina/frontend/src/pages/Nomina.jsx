import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function Nomina() {
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    setError(""); setCargando(true); setResultado(null);
    try {
      const r = await api.post("/nomina/calcular", { anio, mes });
      setResultado(r);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }

  const total = resultado ? resultado.resultados.reduce((acc, r) => acc + Number(r.liquido_a_pagar), 0) : 0;

  return (
    <div>
      <h2 className="page-title">Cálculo de Nómina de Fin de Mes</h2>
      <p className="page-subtitle">Suma ingresos y egresos de ley, descuenta el anticipo del mes y genera el resultado por empleado (RF-05 / RF-07).</p>

      <div className="panel">
        <div className="form-row">
          <div className="field"><label>Año</label><input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></div>
          <div className="field"><label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={calcular} disabled={cargando}>
            {cargando ? "Calculando..." : "Calcular Nómina"}
          </button>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {resultado && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Nómina de {resultado.periodo.nombreMes} {resultado.periodo.anio}</h3>
          <table>
            <thead>
              <tr><th>ID Empleado</th><th>Ingresos</th><th>Egresos</th><th>Anticipo</th><th>Líquido a pagar</th></tr>
            </thead>
            <tbody>
              {resultado.resultados.map((r) => (
                <tr key={r.id_resultado}>
                  <td>#{r.id_empleado}</td>
                  <td>Q {Number(r.total_ingresos).toFixed(2)}</td>
                  <td>Q {Number(r.total_egresos).toFixed(2)}</td>
                  <td>Q {Number(r.anticipo_descontado).toFixed(2)}</td>
                  <td>Q {Number(r.liquido_a_pagar).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={4}>Total nómina del periodo</td>
                <td>Q {total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
