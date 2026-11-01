const express = require("express");
const pool = require("../config/db");
const { calcularAnticipo } = require("../services/nominaService");
const { esAnioValido, esMesValido } = require("../utils/validacion");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();

// RF-04: calcular y registrar el anticipo del 15 de cada mes.
router.post("/calcular", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { anio, mes } = req.body;
    if (!esAnioValido(anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    const resultado = await calcularAnticipo(Number(anio), Number(mes));
    res.json(resultado);
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { anio, mes } = req.query;
    const { rows } = await pool.query(
      `SELECT a.*, e.nombres, e.apellidos
       FROM anticipo a
       JOIN empleado e ON e.id_empleado = a.id_empleado
       JOIN periodo_nomina p ON p.id_periodo = a.id_periodo
       WHERE p.anio = $1 AND p.mes = $2
       ORDER BY e.apellidos`,
      [anio, mes]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
