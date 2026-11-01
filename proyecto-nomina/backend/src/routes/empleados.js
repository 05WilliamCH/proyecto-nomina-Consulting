const express = require("express");
const pool = require("../config/db");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();

// RF-01: registrar, modificar, consultar e inactivar empleados.
// Lectura: cualquier usuario autenticado. Escritura: RRHH o Administrador.
router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    const params = [];
    let sql = `SELECT e.*, d.nombre AS departamento, pu.nombre AS puesto
               FROM empleado e
               JOIN departamento d ON d.id_departamento = e.id_departamento
               LEFT JOIN puesto pu ON pu.id_puesto = e.id_puesto`;
    if (estado) {
      params.push(estado);
      sql += ` WHERE e.estado = $1`;
    }
    sql += ` ORDER BY e.apellidos, e.nombres`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, d.nombre AS departamento, pu.nombre AS puesto
       FROM empleado e
       JOIN departamento d ON d.id_departamento = e.id_departamento
       LEFT JOIN puesto pu ON pu.id_puesto = e.id_puesto
       WHERE e.id_empleado = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Empleado no encontrado" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post("/", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { nombres, apellidos, fecha_nacimiento, fecha_ingreso, id_departamento, id_puesto, dpi, nit, salario_base, dias_laborados, banco, tipo_cuenta_banco, numero_cuenta_banco } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO empleado (nombres, apellidos, fecha_nacimiento, fecha_ingreso, id_departamento, id_puesto, dpi, nit, salario_base, dias_laborados, banco, tipo_cuenta_banco, numero_cuenta_banco)
       VALUES ($1,$2,$3, COALESCE($4, CURRENT_DATE), $5,$6,$7,$8,$9, COALESCE($10,30), $11, $12, $13)
       RETURNING *`,
      [nombres, apellidos, fecha_nacimiento, fecha_ingreso, id_departamento, id_puesto || null, dpi || null, nit || null, salario_base, dias_laborados, banco || null, tipo_cuenta_banco || null, numero_cuenta_banco || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put("/:id", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { nombres, apellidos, fecha_nacimiento, id_departamento, id_puesto, dpi, nit, salario_base, dias_laborados, estado, banco, tipo_cuenta_banco, numero_cuenta_banco } = req.body;
    // El UPDATE dispara trg_historial_laboral si salario_base o id_puesto cambian.
    const { rows } = await pool.query(
      `UPDATE empleado SET nombres=$1, apellidos=$2, fecha_nacimiento=$3, id_departamento=$4,
              id_puesto=$5, dpi=$6, nit=$7, salario_base=$8, dias_laborados=$9, estado=$10,
              banco=$11, tipo_cuenta_banco=$12, numero_cuenta_banco=$13
       WHERE id_empleado=$14 RETURNING *`,
      [nombres, apellidos, fecha_nacimiento, id_departamento, id_puesto || null, dpi || null, nit || null, salario_base, dias_laborados, estado, banco || null, tipo_cuenta_banco || null, numero_cuenta_banco || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Empleado no encontrado" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// "Eliminar" un empleado en este sistema significa inactivarlo (no borrar
// el historial de nomina), tal como lo pide RF-01.
router.delete("/:id", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE empleado SET estado='Inactivo' WHERE id_empleado=$1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Empleado no encontrado" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
