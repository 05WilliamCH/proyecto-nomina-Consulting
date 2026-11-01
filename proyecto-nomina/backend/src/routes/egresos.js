const express = require("express");
const pool = require("../config/db");
const { obtenerOCrearPeriodo } = require("../services/nominaService");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();

// RF-03: registrar los egresos de un empleado por periodo (IGSS, ISR,
// Asociacion Solidarista, descuentos de tienda).
router.get("/", async (req, res, next) => {
  try {
    const { id_empleado, anio, mes } = req.query;
    const params = [];
    let sql = `SELECT de.*, te.nombre AS tipo_egreso, p.anio, p.mes
               FROM detalle_egreso_nomina de
               JOIN tipo_egreso te ON te.id_tipo_egreso = de.id_tipo_egreso
               JOIN periodo_nomina p ON p.id_periodo = de.id_periodo
               WHERE 1=1`;
    if (id_empleado) { params.push(id_empleado); sql += ` AND de.id_empleado = $${params.length}`; }
    if (anio) { params.push(anio); sql += ` AND p.anio = $${params.length}`; }
    if (mes) { params.push(mes); sql += ` AND p.mes = $${params.length}`; }
    sql += ` ORDER BY de.id_detalle DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id_empleado, id_tipo_egreso, anio, mes, monto } = req.body;
    await client.query("BEGIN");
    const idPeriodo = await obtenerOCrearPeriodo(client, anio, mes, "Fin de Mes");
    const { rows } = await client.query(
      `INSERT INTO detalle_egreso_nomina (id_empleado, id_tipo_egreso, id_periodo, monto)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id_empleado, id_tipo_egreso, idPeriodo, monto]
    );
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.delete("/:id", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM detalle_egreso_nomina WHERE id_detalle=$1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Registro no encontrado" });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
