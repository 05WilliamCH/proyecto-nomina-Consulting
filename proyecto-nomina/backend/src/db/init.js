// Ejecuta schema.sql y seed.sql contra la base configurada en .env, y
// crea los usuarios de acceso por defecto (uno por rol) con contrasenas
// hasheadas con bcrypt.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { hashPassword } = require("../services/authService");

const USUARIOS_POR_DEFECTO = [
  { nombre_usuario: "rrhh", password: "Rrhh#2026", rol: "RRHH" },
  { nombre_usuario: "contabilidad", password: "Conta#2026", rol: "Contabilidad" },
  { nombre_usuario: "admin", password: "Admin#2026", rol: "Administrador" },
];

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  const client = await pool.connect();
  try {
    console.log("Aplicando schema.sql ...");
    await client.query(schema);
    console.log("Aplicando seed.sql ...");
    await client.query(seed);

    console.log("Creando usuarios por defecto (si no existen) ...");
    for (const u of USUARIOS_POR_DEFECTO) {
      const existe = await client.query("SELECT 1 FROM usuario WHERE nombre_usuario = $1", [u.nombre_usuario]);
      if (existe.rows.length) continue;
      const hash = await hashPassword(u.password);
      const { rows } = await client.query("SELECT id_rol FROM rol WHERE nombre = $1", [u.rol]);
      if (!rows.length) throw new Error(`Rol no encontrado en la tabla rol: ${u.rol}`);
      await client.query(
        "INSERT INTO usuario (nombre_usuario, password_hash, id_rol) VALUES ($1,$2,$3)",
        [u.nombre_usuario, hash, rows[0].id_rol]
      );
      console.log(`  usuario creado: ${u.nombre_usuario} / ${u.password} (${u.rol})`);
    }

    console.log("Base de datos inicializada correctamente.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Error inicializando la base de datos:", err.message);
  process.exit(1);
});
