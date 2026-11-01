const express = require("express");
const pool = require("../config/db");
const { obtenerOCrearPeriodo } = require("../services/nominaService");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();

// RF-02: registrar los ingresos de un empleado por periodo (anio/mes).
// El periodo se crea automaticamente si aun no existe (tipo 'Fin de Mes').
router.get("/", async (req, res, next) => {
  try {
    const { id_empleado, anio, mes } = req.query;
    const params = [];
    let sql = `SELECT di.*, ti.nombre AS tipo_ingreso, p.anio, p.mes
               FROM detalle_ingreso_nomina di
               JOIN tipo_ingreso ti ON ti.id_tipo_ingreso = di.id_tipo_ingreso
               JOIN periodo_nomina p ON p.id_periodo = di.id_periodo
               WHERE 1=1`;
    if (id_empleado) { params.push(id_empleado); sql += ` AND di.id_empleado = $${params.length}`; }
    if (anio) { params.push(anio); sql += ` AND p.anio = $${params.length}`; }
    if (mes) { params.push(mes); sql += ` AND p.mes = $${params.length}`; }
    sql += ` ORDER BY di.id_detalle DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id_empleado, id_tipo_ingreso, anio, mes, monto } = req.body;
    await client.query("BEGIN");
    const idPeriodo = await obtenerOCrearPeriodo(client, anio, mes, "Fin de Mes");
    const { rows } = await client.query(
      `INSERT INTO detalle_ingreso_nomina (id_empleado, id_tipo_ingreso, id_periodo, monto)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id_empleado, id_tipo_ingreso, idPeriodo, monto]
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
    const { rowCount } = await pool.query(`DELETE FROM detalle_ingreso_nomina WHERE id_detalle=$1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Registro no encontrado" });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
