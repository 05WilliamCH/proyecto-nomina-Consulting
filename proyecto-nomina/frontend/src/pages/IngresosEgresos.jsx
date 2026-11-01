import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

const hoy = new Date();

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

  const [formIngreso, setFormIngreso] = useState({ id_empleado: "", id_tipo_ingreso: "", monto: "" });
  const [formEgreso, setFormEgreso] = useState({ id_empleado: "", id_tipo_egreso: "", monto: "" });

  async function cargarCatalogos() {
    const [emps, ti, te] = await Promise.all([
      api.get("/empleados?estado=Activo"), api.get("/tipos-ingreso"), api.get("/tipos-egreso"),
    ]);
    setEmpleados(emps); setTiposIngreso(ti); setTiposEgreso(te);
  }

  async function cargarDetalle() {
    const [ing, egr] = await Promise.all([
      api.get(`/ingresos?anio=${anio}&mes=${mes}`), api.get(`/egresos?anio=${anio}&mes=${mes}`),
    ]);
    setIngresos(ing); setEgresos(egr);
  }

  useEffect(() => { cargarCatalogos(); }, []);
  useEffect(() => { cargarDetalle(); }, [anio, mes]);

  async function registrarIngreso(e) {
    e.preventDefault();
    setError(""); setOk("");
    try {
      await api.post("/ingresos", { ...formIngreso, anio, mes, monto: Number(formIngreso.monto), id_empleado: Number(formIngreso.id_empleado), id_tipo_ingreso: Number(formIngreso.id_tipo_ingreso) });
      setFormIngreso({ id_empleado: "", id_tipo_ingreso: "", monto: "" });
      setOk("Ingreso registrado."); cargarDetalle();
    } catch (e) { setError(e.message); }
  }

  async function registrarEgreso(e) {
    e.preventDefault();
    setError(""); setOk("");
    try {
      await api.post("/egresos", { ...formEgreso, anio, mes, monto: Number(formEgreso.monto), id_empleado: Number(formEgreso.id_empleado), id_tipo_egreso: Number(formEgreso.id_tipo_egreso) });
      setFormEgreso({ id_empleado: "", id_tipo_egreso: "", monto: "" });
      setOk("Egreso registrado."); cargarDetalle();
    } catch (e) { setError(e.message); }
  }

  function nombreEmpleado(id) {
    const e = empleados.find((x) => x.id_empleado === id);
    return e ? `${e.nombres} ${e.apellidos}` : `#${id}`;
  }

  return (
    <div>
      <h2 className="page-title">Ingresos y Egresos</h2>
      <p className="page-subtitle">Captura de los renglones de nómina por periodo (RF-02 / RF-03).</p>

      <div className="panel">
        <div className="form-row">
          <div className="field"><label>Año</label><input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} /></div>
          <div className="field"><label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Registrar ingreso</h3>
        <form onSubmit={registrarIngreso}>
          <div className="form-row">
            <div className="field"><label>Empleado</label>
              <select required value={formIngreso.id_empleado} onChange={(e) => setFormIngreso({ ...formIngreso, id_empleado: e.target.value })}>
                <option value="">Seleccione...</option>
                {empleados.map((e) => <option key={e.id_empleado} value={e.id_empleado}>{e.nombres} {e.apellidos}</option>)}
              </select>
            </div>
            <div className="field"><label>Tipo de ingreso</label>
              <select required value={formIngreso.id_tipo_ingreso} onChange={(e) => setFormIngreso({ ...formIngreso, id_tipo_ingreso: e.target.value })}>
                <option value="">Seleccione...</option>
                {tiposIngreso.map((t) => <option key={t.id_tipo_ingreso} value={t.id_tipo_ingreso}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Monto (Q)</label>
              <input type="number" step="0.01" required value={formIngreso.monto} onChange={(e) => setFormIngreso({ ...formIngreso, monto: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Agregar ingreso</button>
          </div>
        </form>
        <table>
          <thead><tr><th>Empleado</th><th>Tipo</th><th>Monto</th></tr></thead>
          <tbody>
            {ingresos.map((i) => (
              <tr key={i.id_detalle}><td>{nombreEmpleado(i.id_empleado)}</td><td>{i.tipo_ingreso}</td><td>Q {Number(i.monto).toFixed(2)}</td></tr>
            ))}
            {!ingresos.length && <tr><td colSpan={3} className="muted">Sin ingresos registrados en este periodo.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Registrar egreso</h3>
        <form onSubmit={registrarEgreso}>
          <div className="form-row">
            <div className="field"><label>Empleado</label>
              <select required value={formEgreso.id_empleado} onChange={(e) => setFormEgreso({ ...formEgreso, id_empleado: e.target.value })}>
                <option value="">Seleccione...</option>
                {empleados.map((e) => <option key={e.id_empleado} value={e.id_empleado}>{e.nombres} {e.apellidos}</option>)}
              </select>
            </div>
            <div className="field"><label>Tipo de egreso</label>
              <select required value={formEgreso.id_tipo_egreso} onChange={(e) => setFormEgreso({ ...formEgreso, id_tipo_egreso: e.target.value })}>
                <option value="">Seleccione...</option>
                {tiposEgreso.map((t) => <option key={t.id_tipo_egreso} value={t.id_tipo_egreso}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Monto (Q)</label>
              <input type="number" step="0.01" required value={formEgreso.monto} onChange={(e) => setFormEgreso({ ...formEgreso, monto: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Agregar egreso</button>
          </div>
        </form>
        <table>
          <thead><tr><th>Empleado</th><th>Tipo</th><th>Monto</th></tr></thead>
          <tbody>
            {egresos.map((eg) => (
              <tr key={eg.id_detalle}><td>{nombreEmpleado(eg.id_empleado)}</td><td>{eg.tipo_egreso}</td><td>Q {Number(eg.monto).toFixed(2)}</td></tr>
            ))}
            {!egresos.length && <tr><td colSpan={3} className="muted">Sin egresos registrados en este periodo.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
