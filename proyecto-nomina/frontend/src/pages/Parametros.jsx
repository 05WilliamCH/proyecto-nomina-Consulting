import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

export default function Parametros() {
  const [parametros, setParametros] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [edit, setEdit] = useState({});

  async function cargar() {
    try { setParametros(await api.get("/parametros")); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);

  async function guardar(p) {
    setError(""); setOk("");
    try {
      const valor = edit[p.id_parametro] ?? p.valor;
      await api.put(`/parametros/${p.id_parametro}`, {
        nombre: p.nombre, valor: Number(valor), vigente_desde: p.vigente_desde, vigente_hasta: p.vigente_hasta,
      });
      setOk(`Parámetro "${p.nombre}" actualizado.`);
      cargar();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h2 className="page-title">Parámetros Legales</h2>
      <p className="page-subtitle">
        IGSS, ISR y bonificación decreto configurables sin tocar el código (RF-13), ya que la legislación
        guatemalteca cambia periódicamente (ej. Decreto 13-2026).
      </p>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="panel">
        <table>
          <thead><tr><th>Parámetro</th><th>Valor vigente</th><th>Vigente desde</th><th></th></tr></thead>
          <tbody>
            {parametros.map((p) => (
              <tr key={p.id_parametro}>
                <td>{p.nombre}</td>
                <td>
                  <input
                    type="number" step="0.0001" style={{ width: 120 }}
                    defaultValue={p.valor}
                    onChange={(e) => setEdit({ ...edit, [p.id_parametro]: e.target.value })}
                  />
                </td>
                <td>{new Date(p.vigente_desde).toLocaleDateString("es-GT", { timeZone: "UTC" })}</td>
                <td><button className="btn btn-secondary" onClick={() => guardar(p)}>Guardar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
