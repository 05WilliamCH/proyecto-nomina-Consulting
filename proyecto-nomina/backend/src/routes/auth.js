const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, solicitarRecuperacion, restablecerPassword } = require("../services/authService");
const { requiereLogin } = require("../middleware/auth");

const router = express.Router();

// Limita intentos por IP para dificultar fuerza bruta / abuso, tanto en
// login como en la solicitud de recuperacion (que si no se limita, se
// podria usar para saturar la tabla de tokens o de correos).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesion. Intente de nuevo en unos minutos." },
});

const recuperacionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de recuperacion. Intente de nuevo en unos minutos." },
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { nombre_usuario, password } = req.body || {};
    const resultado = await login(nombre_usuario, password);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get("/me", requiereLogin, (req, res) => {
  res.json({ usuario: req.usuario });
});

// Recuperacion de contrasena (RNF-02 ampliado). No hay servidor de correo
// en este proyecto: la respuesta incluye el enlace/token directamente,
// marcado como modo desarrollo. En produccion, ese token se enviaria por
// correo y NO se devolveria en el JSON.
router.post("/olvide-password", recuperacionLimiter, async (req, res, next) => {
  try {
    const { nombre_usuario } = req.body || {};
    if (!nombre_usuario) return res.status(400).json({ error: "nombre_usuario es requerido" });
    const resultado = await solicitarRecuperacion(nombre_usuario);
    res.json(resultado);
  } catch (err) { next(err); }
});

router.post("/restablecer-password", recuperacionLimiter, async (req, res) => {
  try {
    const { token, password_nueva } = req.body || {};
    const resultado = await restablecerPassword(token, password_nueva);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
