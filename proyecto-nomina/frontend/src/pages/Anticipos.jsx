import React, { useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function Anticipos() {
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function calcular() {
    setError(""); setCargando(true); setResultado(null);
    try {
      const r = await api.post("/anticipos/calcular", { anio, mes });
      setResultado(r);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }

  return (
    <div>
      <h2 className="page-title">Anticipo Quincenal</h2>
      <p className="page-subtitle">Calcula el 50% del salario base para todos los empleados activos (RF-04). Se otorga el día 15 de cada mes.</p>

      <div className="panel">
        <div className="form-row">
          <div className="field"><label>Año</label><input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></div>
          <div className="field"><label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={calcular} disabled={cargando}>
            {cargando ? "Calculando..." : "Calcular anticipo"}
          </button>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {resultado && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Anticipos de {MESES[mes - 1]} {anio}</h3>
          <table>
            <thead><tr><th>ID Empleado</th><th>Monto del anticipo</th></tr></thead>
            <tbody>
              {resultado.anticipos.map((a) => (
                <tr key={a.id_anticipo}><td>#{a.id_empleado}</td><td>Q {Number(a.monto).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
