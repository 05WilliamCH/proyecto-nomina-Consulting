const express = require("express");
const pool = require("../config/db");
const { permitirPermiso } = require("../middleware/auth");
const { esAnioValido, esMesValido } = require("../utils/validacion");

const router = express.Router();
const num = (v) => Number(v ?? 0);

// ============================================================
// GET /api/dashboard[?anio=2026&mes=9]
// Devuelve, en una sola llamada, todo lo que necesita la pantalla del
// Dashboard: KPIs, evolucion de los ultimos 6 meses, costo por departamento,
// descuentos por tipo y plantilla por departamento. Sin parametros usa el
// ultimo periodo que ya tenga nomina calculada.
// Lo ven los tres roles (permiso reportes.ver): son datos agregados.
// ============================================================
router.get("/", permitirPermiso("reportes.ver"), async (req, res, next) => {
  try {
    // Periodos con nomina calculada (para el selector del frontend).
    const { rows: periodos } = await pool.query(
      `SELECT p.anio, p.mes, fn_nombre_mes(p.mes) AS nombre_mes
       FROM periodo_nomina p
       WHERE p.tipo = 'Fin de Mes'
         AND EXISTS (SELECT 1 FROM nomina_resultado nr WHERE nr.id_periodo = p.id_periodo)
       ORDER BY p.anio DESC, p.mes DESC
       LIMIT 24`
    );

    let anio, mes;
    if (req.query.anio !== undefined || req.query.mes !== undefined) {
      if (!esAnioValido(req.query.anio)) return res.status(400).json({ error: "anio invalido" });
      if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
      anio = Number(req.query.anio); mes = Number(req.query.mes);
    } else if (periodos.length) {
      anio = periodos[0].anio; mes = periodos[0].mes;
    }

    // Plantilla por departamento: no depende del periodo.
    const { rows: plantilla } = await pool.query(
      `SELECT d.nombre AS departamento,
              COUNT(e.id_empleado) FILTER (WHERE e.estado = 'Activo')            AS empleados,
              COALESCE(AVG(e.salario_base) FILTER (WHERE e.estado = 'Activo'),0) AS salario_promedio
       FROM departamento d
       LEFT JOIN empleado e ON e.id_departamento = d.id_departamento
       GROUP BY d.nombre ORDER BY d.nombre`
    );
    const empleadosActivos = plantilla.reduce((a, r) => a + num(r.empleados), 0);

    const base = {
      periodos: periodos.map((p) => ({ anio: p.anio, mes: p.mes, nombreMes: p.nombre_mes })),
      periodo: null,
      kpis: { empleadosActivos, empleadosConNomina: 0, totalIngresos: 0, totalEgresos: 0, neto: 0, anticipos: 0 },
      evolucion: [], porDepartamento: [], descuentosPorTipo: [],
      plantilla: plantilla.map((r) => ({
        departamento: r.departamento, empleados: num(r.empleados), salarioPromedio: num(r.salario_promedio),
      })),
    };
    if (anio === undefined) return res.json(base); // aun no hay ninguna nomina

    const filtro = "p.anio = $1 AND p.mes = $2 AND p.tipo = 'Fin de Mes'";

    const [{ rows: [mesRow] }, { rows: [kpi] }, { rows: evo }, { rows: dep }, { rows: desc }] = await Promise.all([
      pool.query("SELECT fn_nombre_mes($1) AS nombre", [mes]),
      pool.query(
        `SELECT COUNT(*) AS n,
                COALESCE(SUM(nr.total_ingresos),0) AS ingresos,
                COALESCE(SUM(nr.total_egresos),0)  AS egresos,
                COALESCE(SUM(nr.anticipo_descontado),0) AS anticipos
         FROM nomina_resultado nr JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
         WHERE ${filtro}`, [anio, mes]),
      pool.query(
        `SELECT p.anio, p.mes, fn_nombre_mes(p.mes) AS nombre_mes,
                SUM(nr.total_ingresos) AS ingresos, SUM(nr.total_egresos) AS egresos
         FROM nomina_resultado nr JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
         WHERE p.tipo = 'Fin de Mes'
           AND (p.anio * 12 + p.mes) BETWEEN ($1::int * 12 + $2::int - 5) AND ($1::int * 12 + $2::int)
         GROUP BY p.anio, p.mes ORDER BY p.anio, p.mes`, [anio, mes]),
      pool.query(
        `SELECT d.nombre AS departamento, COUNT(*) AS empleados,
                SUM(nr.total_ingresos) AS ingresos,
                SUM(nr.total_ingresos - nr.total_egresos) AS neto
         FROM nomina_resultado nr
         JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
         JOIN empleado e ON e.id_empleado = nr.id_empleado
         JOIN departamento d ON d.id_departamento = e.id_departamento
         WHERE ${filtro}
         GROUP BY d.nombre ORDER BY ingresos DESC`, [anio, mes]),
      pool.query(
        `SELECT te.nombre AS tipo, SUM(de.monto) AS total
         FROM detalle_egreso_nomina de
         JOIN tipo_egreso te ON te.id_tipo_egreso = de.id_tipo_egreso
         JOIN periodo_nomina p ON p.id_periodo = de.id_periodo
         WHERE ${filtro}
         GROUP BY te.nombre ORDER BY total DESC`, [anio, mes]),
    ]);

    const ingresos = num(kpi.ingresos), egresos = num(kpi.egresos);
    res.json({
      ...base,
      periodo: { anio, mes, nombreMes: mesRow.nombre },
      kpis: {
        empleadosActivos, empleadosConNomina: num(kpi.n),
        totalIngresos: ingresos, totalEgresos: egresos,
        neto: Number((ingresos - egresos).toFixed(2)), anticipos: num(kpi.anticipos),
      },
      evolucion: evo.map((r) => ({
        anio: r.anio, mes: r.mes, nombreMes: r.nombre_mes,
        ingresos: num(r.ingresos), egresos: num(r.egresos),
        neto: Number((num(r.ingresos) - num(r.egresos)).toFixed(2)),
      })),
      porDepartamento: dep.map((r) => ({
        departamento: r.departamento, empleados: num(r.empleados), ingresos: num(r.ingresos), neto: num(r.neto),
      })),
      descuentosPorTipo: desc.map((r) => ({ tipo: r.tipo, total: num(r.total) })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
