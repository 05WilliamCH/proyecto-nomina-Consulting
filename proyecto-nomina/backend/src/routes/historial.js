const express = require("express");
const pool = require("../config/db");
const { permitirPermiso } = require("../middleware/auth");

const router = express.Router();

// Consulta de solo lectura: el historial se llena solo (trigger
// trg_historial_laboral en schema.sql), no hay endpoint para escribirlo.
router.get("/", permitirPermiso("historial_laboral.ver"), async (req, res, next) => {
  try {
    const { id_empleado } = req.query;
    const params = [];
    let sql = `SELECT h.id_historial, h.id_empleado, e.nombres, e.apellidos,
                      pa.nombre AS puesto_anterior, pn.nombre AS puesto_nuevo,
                      h.salario_anterior, h.salario_nuevo, h.fecha_cambio, h.motivo
               FROM historial_laboral h
               JOIN empleado e ON e.id_empleado = h.id_empleado
               LEFT JOIN puesto pa ON pa.id_puesto = h.id_puesto_anterior
               LEFT JOIN puesto pn ON pn.id_puesto = h.id_puesto_nuevo
               WHERE 1=1`;
    if (id_empleado) { params.push(id_empleado); sql += ` AND h.id_empleado = $${params.length}`; }
    sql += ` ORDER BY h.fecha_cambio DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
