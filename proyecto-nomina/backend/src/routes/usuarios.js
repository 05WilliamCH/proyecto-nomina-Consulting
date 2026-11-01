const express = require("express");
const pool = require("../config/db");
const { hashPassword, cambiarPassword } = require("../services/authService");
const { requiereLogin, permitirRoles } = require("../middleware/auth");
const { validar, esTextoSeguro } = require("../utils/validacion");

const router = express.Router();
const soloAdmin = permitirRoles("Administrador");

// ============================================================
// MIS DATOS — disponible para CUALQUIER usuario autenticado.
// Importante: estas rutas van ANTES de las de administrador y solo
// leen/modifican al usuario del token (req.usuario.id_usuario), nunca
// un id recibido por parametro, asi nadie puede ver datos de otro.
// ============================================================
router.get("/me", requiereLogin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.estado, u.fecha_creacion,
              u.id_rol, r.nombre AS rol,
              e.id_empleado, e.nombres, e.apellidos, e.dpi, e.nit, e.fecha_ingreso,
              d.nombre AS departamento, p.nombre AS puesto
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
       LEFT JOIN departamento d ON d.id_departamento = e.id_departamento
       LEFT JOIN puesto p ON p.id_puesto = e.id_puesto
       WHERE u.id_usuario = $1`,
      [req.usuario.id_usuario]
    );
    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
    const u = rows[0];

    const { rows: permisos } = await pool.query(
      `SELECT p.codigo, p.descripcion
       FROM rol_permiso rp JOIN permiso p ON p.id_permiso = rp.id_permiso
       WHERE rp.id_rol = $1 ORDER BY p.codigo`,
      [u.id_rol]
    );

    res.json({
      usuario: {
        id_usuario: u.id_usuario, nombre_usuario: u.nombre_usuario, rol: u.rol,
        estado: u.estado, fecha_creacion: u.fecha_creacion,
      },
      // null si la cuenta no esta vinculada a un empleado (ej. cuentas tecnicas)
      empleado: u.id_empleado ? {
        id_empleado: u.id_empleado, nombres: u.nombres, apellidos: u.apellidos,
        dpi: u.dpi, nit: u.nit, fecha_ingreso: u.fecha_ingreso,
        departamento: u.departamento, puesto: u.puesto,
      } : null,
      permisos,
    });
  } catch (err) { next(err); }
});

router.put("/me/password", requiereLogin, async (req, res, next) => {
  try {
    const { password_actual, password_nueva } = req.body || {};
    await cambiarPassword(req.usuario.id_usuario, password_actual, password_nueva);
    res.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ============================================================
// ADMINISTRACION DE USUARIOS — exclusivo del rol Administrador.
// ============================================================
router.get("/", soloAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, r.nombre AS rol, u.estado, u.fecha_creacion,
              u.id_empleado, (e.nombres || ' ' || e.apellidos) AS empleado
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
       ORDER BY u.nombre_usuario`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post(
  "/",
  soloAdmin,
  validar({
    nombre_usuario: { fn: (v) => esTextoSeguro(v, { min: 3, max: 50 }), mensaje: "3 a 50 caracteres" },
    password: { fn: (v) => typeof v === "string" && v.length >= 8, mensaje: "mínimo 8 caracteres" },
    rol: { fn: (v) => ["RRHH", "Contabilidad", "Administrador"].includes(v), mensaje: "RRHH, Contabilidad o Administrador" },
  }),
  async (req, res, next) => {
    try {
      const { nombre_usuario, password, rol, id_empleado } = req.body;
      const password_hash = await hashPassword(password);
      const { rows: rolRows } = await pool.query("SELECT id_rol FROM rol WHERE nombre = $1", [rol]);
      if (!rolRows.length) return res.status(400).json({ error: "Rol invalido" });

      const { rows } = await pool.query(
        `INSERT INTO usuario (nombre_usuario, password_hash, id_rol, id_empleado)
         VALUES ($1,$2,$3,$4)
         RETURNING id_usuario, nombre_usuario, id_rol, id_empleado, estado`,
        [nombre_usuario.trim(), password_hash, rolRows[0].id_rol, id_empleado || null]
      );
      res.status(201).json({ ...rows[0], rol });
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Ese nombre de usuario ya existe." });
      next(err);
    }
  }
);

router.put("/:id/estado", soloAdmin, async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!["Activo", "Inactivo"].includes(estado)) {
      return res.status(400).json({ error: "estado debe ser Activo o Inactivo" });
    }
    // Evita que el administrador se bloquee a si mismo fuera del sistema.
    if (Number(req.params.id) === req.usuario.id_usuario && estado === "Inactivo") {
      return res.status(400).json({ error: "No puede inactivar su propia cuenta." });
    }
    const { rows } = await pool.query(
      `UPDATE usuario SET estado=$1 WHERE id_usuario=$2 RETURNING id_usuario, nombre_usuario, estado`,
      [estado, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
