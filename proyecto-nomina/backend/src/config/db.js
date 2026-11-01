const { Pool } = require("pg");
require("dotenv").config();

// Pool de conexiones a PostgreSQL. Los valores se leen de variables de
// entorno (ver .env.example) para no dejar credenciales en el codigo.
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "nomina_consulting1",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "CHIroy23",
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL", err);
});

module.exports = pool;
