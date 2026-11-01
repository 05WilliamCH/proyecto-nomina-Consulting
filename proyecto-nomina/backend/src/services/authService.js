// ============================================================
// Servicio de autenticacion. Usa bcrypt para las contrasenas (nunca se
// guardan ni se comparan en texto plano), JWT para las sesiones, y
// tokens de un solo uso (hasheados, con expiracion) para recuperar
// contrasena.
// ============================================================
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "cambiar-este-secreto-en-produccion";
const JWT_EXPIRES_IN = "8h";
const RESET_TOKEN_TTL_MINUTOS = 30;

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Trae el rol (por nombre) y la lista de permisos de ese rol, via join con
// rol_permiso + permiso. Se usa tanto al iniciar sesion como en /auth/me.
async function obtenerRolYPermisos(id_rol) {
  const { rows: rolRows } = await pool.query("SELECT nombre FROM rol WHERE id_rol = $1", [id_rol]);
  const { rows: permisoRows } = await pool.query(
    `SELECT p.codigo FROM rol_permiso rp JOIN permiso p ON p.id_permiso = rp.id_permiso WHERE rp.id_rol = $1`,
    [id_rol]
  );
  return { rol: rolRows[0]?.nombre, permisos: permisoRows.map((r) => r.codigo) };
}

async function login(nombre_usuario, password) {
  if (!nombre_usuario || !password) throw new Error("Usuario y contrasena son requeridos");

  // Consulta parametrizada: "nombre_usuario" viaja como parametro ($1),
  // nunca concatenado al texto SQL, por lo que este campo no puede usarse
  // para inyectar SQL (ver README > Seguridad). El join trae el nombre del
  // rol desde la tabla "rol" (antes era un VARCHAR directo en "usuario").
  const { rows } = await pool.query(
    `SELECT u.id_usuario, u.nombre_usuario, u.password_hash, u.id_rol, u.estado, r.nombre AS rol
     FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.nombre_usuario = $1`,
    [nombre_usuario]
  );
  const user = rows[0];

  // Se compara siempre con bcrypt, incluso si el usuario no existe, para
  // no filtrar por tiempo de respuesta si un nombre_usuario existe o no.
  const hashParaComparar = user ? user.password_hash : "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valido = await bcrypt.compare(password, hashParaComparar);

  if (!user || user.estado !== "Activo" || !valido) {
    throw new Error("Usuario o contrasena incorrectos");
  }

  const { permisos } = await obtenerRolYPermisos(user.id_rol);

  const token = jwt.sign(
    { id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario, rol: user.rol, permisos },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return {
    token,
    usuario: { id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario, rol: user.rol, permisos },
  };
}

// ---------- Recuperacion de contrasena ----------
// No hay servidor de correo configurado en este proyecto academico, asi
// que el enlace de recuperacion se devuelve directamente en la respuesta
// (claramente marcado como modo desarrollo) en vez de enviarse por email.
// Para produccion, bastaria con enviar "resetUrl" por correo (ej. con
// nodemailer) en vez de incluirlo en el JSON de respuesta.
function generarTokenSeguro() {
  const tokenPlano = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");
  return { tokenPlano, tokenHash };
}

async function solicitarRecuperacion(nombre_usuario) {
  const { rows } = await pool.query(
    "SELECT id_usuario FROM usuario WHERE nombre_usuario = $1 AND estado = 'Activo'",
    [nombre_usuario]
  );

  // Respuesta identica exista o no el usuario: no se revela si una cuenta
  // existe (evita que alguien use este endpoint para enumerar usuarios).
  if (!rows.length) {
    return { mensaje: "Si el usuario existe, se genero un enlace de recuperacion." };
  }

  const { tokenPlano, tokenHash } = generarTokenSeguro();
  const fechaExpiracion = new Date(Date.now() + RESET_TOKEN_TTL_MINUTOS * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_token (id_usuario, token_hash, fecha_expiracion)
     VALUES ($1, $2, $3)`,
    [rows[0].id_usuario, tokenHash, fechaExpiracion]
  );

  return {
    mensaje: "Si el usuario existe, se genero un enlace de recuperacion.",
    modoDesarrollo: true,
    resetToken: tokenPlano,
    expiraEn: `${RESET_TOKEN_TTL_MINUTOS} minutos`,
  };
}

async function restablecerPassword(tokenPlano, passwordNueva) {
  if (!tokenPlano || !passwordNueva) throw new Error("Token y nueva contrasena son requeridos");
  if (passwordNueva.length < 8) throw new Error("La nueva contrasena debe tener al menos 8 caracteres");

  const tokenHash = crypto.createHash("sha256").update(tokenPlano).digest("hex");

  const { rows } = await pool.query(
    `SELECT id_token, id_usuario, fecha_expiracion, usado FROM password_reset_token WHERE token_hash = $1`,
    [tokenHash]
  );
  const registro = rows[0];

  if (!registro || registro.usado || new Date(registro.fecha_expiracion) < new Date()) {
    throw new Error("El enlace de recuperacion es invalido o ya expiro");
  }

  const nuevoHash = await hashPassword(passwordNueva);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE usuario SET password_hash = $1 WHERE id_usuario = $2", [nuevoHash, registro.id_usuario]);
    await client.query("UPDATE password_reset_token SET usado = TRUE WHERE id_token = $1", [registro.id_token]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { mensaje: "Contrasena actualizada correctamente." };
}

// Cambio de contrasena por el propio usuario (pantalla "Mi perfil").
// Los errores de validacion usan status 400 (NO 401): el cliente HTTP del
// frontend interpreta un 401 como "sesion vencida" y cerraria la sesion.
async function cambiarPassword(id_usuario, passwordActual, passwordNueva) {
  const falla = (msg) => { const e = new Error(msg); e.status = 400; return e; };

  if (!passwordActual || !passwordNueva) throw falla("Debe indicar la contraseña actual y la nueva.");
  if (typeof passwordNueva !== "string" || passwordNueva.length < 8) {
    throw falla("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  if (passwordNueva === passwordActual) throw falla("La nueva contraseña debe ser distinta a la actual.");

  const { rows } = await pool.query(
    "SELECT password_hash FROM usuario WHERE id_usuario = $1 AND estado = 'Activo'",
    [id_usuario]
  );
  if (!rows.length) throw falla("Usuario no encontrado o inactivo.");

  const ok = await bcrypt.compare(passwordActual, rows[0].password_hash);
  if (!ok) throw falla("La contraseña actual es incorrecta.");

  const hash = await hashPassword(passwordNueva);
  await pool.query("UPDATE usuario SET password_hash = $1 WHERE id_usuario = $2", [hash, id_usuario]);
}

module.exports = { login, hashPassword, cambiarPassword, obtenerRolYPermisos, solicitarRecuperacion, restablecerPassword, JWT_SECRET };
