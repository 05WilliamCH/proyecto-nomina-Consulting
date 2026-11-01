// Crea (o re-hashea la contrasena de) los usuarios iniciales del sistema.
// Uso: npm run db:seed-users
//
// IMPORTANTE: estas contrasenas son solo para desarrollo/pruebas del
// proyecto academico. Cambielas (o elimine estos usuarios) antes de
// usar el sistema con datos reales.
const pool = require("../config/db");
const { hashPassword } = require("../services/authService");

const USUARIOS_INICIALES = [
  { nombre_usuario: "admin", password: "Admin#2026", rol: "Administrador" },
  { nombre_usuario: "rrhh", password: "Rrhh#2026", rol: "RRHH" },
  { nombre_usuario: "contabilidad", password: "Conta#2026", rol: "Contabilidad" },
];

async function run() {
  for (const u of USUARIOS_INICIALES) {
    const password_hash = await hashPassword(u.password);
    const { rows } = await pool.query("SELECT id_rol FROM rol WHERE nombre = $1", [u.rol]);
    if (!rows.length) throw new Error(`Rol no encontrado en la tabla rol: ${u.rol}`);
    await pool.query(
      `INSERT INTO usuario (nombre_usuario, password_hash, id_rol)
       VALUES ($1, $2, $3)
       ON CONFLICT (nombre_usuario) DO UPDATE SET password_hash = EXCLUDED.password_hash, id_rol = EXCLUDED.id_rol`,
      [u.nombre_usuario, password_hash, rows[0].id_rol]
    );
    console.log(`Usuario listo: ${u.nombre_usuario} (${u.rol})`);
  }
  await pool.end();
}

run().catch((err) => {
  console.error("Error creando usuarios:", err.message);
  process.exit(1);
});
