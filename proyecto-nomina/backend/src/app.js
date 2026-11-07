const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./routes");
const { requiereLogin } = require("./middleware/auth");
const pool = require("./config/db");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", servicio: "nomina-backend" }));
// Prueba temporal de conexión con PostgreSQL
app.get("/api/db-health", async (req, res) => {
  const token = process.env.DB_HEALTH_TOKEN;

  if (!token || req.get("x-db-health-token") !== token) {
    return res.status(404).json({ error: "Ruta no encontrada" });
  }

  try {
    await pool.query("SELECT 1");

    return res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    return res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

// Login es publico; todo lo demas bajo /api exige un JWT valido
// (ver src/middleware/auth.js). La autorizacion fina por rol se aplica
// dentro de cada archivo de rutas con permitirRoles(...).
app.use("/api/auth", require("./routes/auth"));
app.use("/api", requiereLogin, routes);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Manejador de errores centralizado. El detalle completo siempre se
// registra en el log del servidor (para depurar), pero al cliente solo
// se le devuelve el mensaje crudo si estamos en desarrollo: un error de
// PostgreSQL sin filtrar puede revelar nombres de tablas/columnas, asi
// que en produccion se responde con un mensaje generico.
app.use((err, req, res, next) => {
  console.error(err);
  // Convertir errores de unicidad de PostgreSQL en mensajes claros para el usuario.
  if (err.code === "23505") {
    const detail = err.detail || "";
    if (detail.includes("dpi"))    return res.status(400).json({ error: "El DPI ingresado ya está registrado en otro empleado." });
    if (detail.includes("nombre_usuario")) return res.status(400).json({ error: "El nombre de usuario ya existe." });
    return res.status(400).json({ error: "El valor ingresado ya existe (restricción de unicidad)." });
  }
  // Violación de FK
  if (err.code === "23503") {
    return res.status(400).json({ error: "No se puede completar la operación: referencia inválida (FK)." });
  }
  const esDev = process.env.NODE_ENV !== "production";
  res.status(500).json({ error: esDev ? (err.message || "Error interno del servidor") : "Error interno del servidor" });
});

module.exports = app;
