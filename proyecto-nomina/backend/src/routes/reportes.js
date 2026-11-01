const express = require("express");
const {
  generarReporteCumpleanos, generarReporteIGSS, generarReporteISR,
  generarPolizaContable, generarLibroSalarios,
} = require("../services/reporteService");
const { esAnioValido, esMesValido } = require("../utils/validacion");

const router = express.Router();

router.get("/cumpleaneros", async (req, res, next) => {
  try {
    if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    res.json(await generarReporteCumpleanos(Number(req.query.mes)));
  } catch (err) { next(err); }
});

router.get("/igss", async (req, res, next) => {
  try {
    if (!esAnioValido(req.query.anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    res.json(await generarReporteIGSS(Number(req.query.anio), Number(req.query.mes)));
  } catch (err) { next(err); }
});

router.get("/isr", async (req, res, next) => {
  try {
    if (!esAnioValido(req.query.anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    res.json(await generarReporteISR(Number(req.query.anio), Number(req.query.mes)));
  } catch (err) { next(err); }
});

router.get("/poliza-contable", async (req, res, next) => {
  try {
    if (!esAnioValido(req.query.anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    res.json(await generarPolizaContable(Number(req.query.anio), Number(req.query.mes)));
  } catch (err) { next(err); }
});

router.get("/libro-salarios", async (req, res, next) => {
  try {
    if (!esAnioValido(req.query.anio)) return res.status(400).json({ error: "anio invalido" });
    if (!esMesValido(req.query.mes)) return res.status(400).json({ error: "mes invalido (use un valor entre 1 y 12)" });
    res.json(await generarLibroSalarios(Number(req.query.anio), Number(req.query.mes)));
  } catch (err) { next(err); }
});

module.exports = router;
