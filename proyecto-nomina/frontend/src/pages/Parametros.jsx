import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Alert from "../components/Alert.jsx";

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

export default function Parametros() {
  const [parametros, setParametros] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [edit, setEdit] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);

  async function cargar() {
    setError("");

    try {
      const respuesta = await api.get("/parametros");
      setParametros(respuesta);
    } catch (e) {
      setError(e.message || "No fue posible cargar los parámetros.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiarValor(id, valor) {
    setEdit((actual) => ({
      ...actual,
      [id]: valor
    }));
  }

  async function guardar(p) {
    setError("");
    setOk("");

    const valor = edit[p.id_parametro] ?? p.valor;
    const valorNumerico = Number(valor);

    if (valor === "" || !Number.isFinite(valorNumerico)) {
      setError(`Ingresa un valor numérico válido para "${p.nombre}".`);
      return;
    }

    setGuardando(p.id_parametro);

    try {
      await api.put(`/parametros/${p.id_parametro}`, {
        nombre: p.nombre,
        valor: valorNumerico,
        vigente_desde: p.vigente_desde,
        vigente_hasta: p.vigente_hasta
      });

      setOk(`Parámetro "${p.nombre}" actualizado correctamente.`);

      setEdit((actual) => {
        const nuevo = { ...actual };
        delete nuevo[p.id_parametro];
        return nuevo;
      });

      await cargar();
    } catch (e) {
      setError(e.message || "No fue posible actualizar el parámetro.");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="modulo-parametros">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="page-title mb-1">
            <i className="bi bi-sliders me-2"></i>
            Parámetros Legales
          </h2>

          <p className="page-subtitle mb-0">
            Configuración de valores legales utilizados en los cálculos
            de nómina de Consulting, S.A.
          </p>
        </div>

        <span className="badge bg-primary-subtle text-primary px-3 py-2">
          <i className="bi bi-gear me-1"></i>
          Configuración del sistema
        </span>
      </div>

      <div className="alert alert-info parametros-informacion">
        <i className="bi bi-info-circle-fill me-2"></i>
        Los valores de IGSS, ISR y bonificación decreto pueden actualizarse
        desde este módulo sin modificar el código del sistema.
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <div className="card parametros-card">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-semibold mb-1">
                <i className="bi bi-list-check me-2 text-primary"></i>
                Parámetros registrados
              </h5>
              <span className="text-muted small">
                Administra los valores vigentes de la empresa.
              </span>
            </div>

            <span className="badge bg-light text-dark border px-3 py-2">
              {parametros.length} parámetro(s)
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3"></div>
              <p className="text-muted mb-0">
                Cargando parámetros...
              </p>
            </div>
          ) : parametros.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Parámetro</th>
                    <th>Valor vigente</th>
                    <th>Vigente desde</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {parametros.map((p, index) => (
                    <tr key={p.id_parametro}>
                      <td className="text-muted">
                        {index + 1}
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {p.nombre}
                        </div>
                        <small className="text-muted">
                          ID: {p.id_parametro}
                        </small>
                      </td>

                      <td>
                        <div className="parametros-campo-valor">
                          <span className="text-muted">Q</span>
                          <input
                            type="number"
                            className="form-control"
                            step="0.0001"
                            value={edit[p.id_parametro] ?? p.valor}
                            onChange={(e) =>
                              cambiarValor(p.id_parametro, e.target.value)
                            }
                            disabled={guardando === p.id_parametro}
                            aria-label={`Valor de ${p.nombre}`}
                          />
                        </div>
                      </td>

                      <td>
                        <span className="text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          {formatoFecha(p.vigente_desde)}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => guardar(p)}
                          disabled={guardando !== null}
                        >
                          {guardando === p.id_parametro ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1"></span>
                              Guardando
                            </>
                          ) : (
                            <>
                              <i className="bi bi-save me-1"></i>
                              Guardar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-sliders parametros-vacio-icon"></i>
              <h6 className="fw-semibold mt-3">
                No hay parámetros registrados
              </h6>
              <p className="text-muted small mb-0">
                No se encontraron parámetros para mostrar.
              </p>
            </div>
          )}
        </div>

        <div className="card-footer bg-white py-3">
          <small className="text-muted">
            <i className="bi bi-shield-check me-1"></i>
            Los cambios se guardan individualmente para cada parámetro.
          </small>
        </div>
      </div>
    </div>
  );
}