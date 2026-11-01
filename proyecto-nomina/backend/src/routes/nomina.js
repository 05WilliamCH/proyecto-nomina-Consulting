const express = require("express");
const pool = require("../config/db");
const { calcularNominaFinDeMes } = require("../services/nominaService");
const { esAnioValido, esMesValido } = require("../utils/validacion");
const { permitirRoles } = require("../middleware/auth");

const router = express.Router();

// RF-05 / RF-07: calcular la nomina de fin de mes para todos los
// empleados activos.
router.post("/calcular", permitirRoles("RRHH", "Administrador"), async (req, res, next) => {
  try {
    const { anio, mes } = req.body;
    if (!esAnioValido(anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    const resultado = await calcularNominaFinDeMes(Number(anio), Number(mes));
    res.json(resultado);
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const { anio, mes } = req.query;
    const { rows } = await pool.query(
      `SELECT nr.*, e.nombres, e.apellidos, d.nombre AS departamento
       FROM nomina_resultado nr
       JOIN empleado e ON e.id_empleado = nr.id_empleado
       JOIN departamento d ON d.id_departamento = e.id_departamento
       JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
       WHERE p.anio = $1 AND p.mes = $2 AND p.tipo = 'Fin de Mes'
       ORDER BY d.nombre, e.apellidos`,
      [anio, mes]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
