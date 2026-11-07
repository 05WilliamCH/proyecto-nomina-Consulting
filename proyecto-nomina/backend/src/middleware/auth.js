// ============================================================
// Middlewares de autenticacion y autorizacion por rol.
// ============================================================
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../services/authService");
const pool = require("../config/db");

// Exige un JWT valido en el header "Authorization: Bearer <token>".

async function requiereLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const usuarioToken = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT id_usuario, nombre_usuario, id_rol, estado
       FROM usuario
       WHERE id_usuario = $1`,
      [usuarioToken.id_usuario]
    );

    const usuarioBD = rows[0];

    if (!usuarioBD || usuarioBD.estado !== "Activo") {
      return res.status(401).json({
        error: "Usuario inexistente o inactivo"
      });
    }

    req.usuario = {
      ...usuarioToken,
      id_usuario: usuarioBD.id_usuario,
      nombre_usuario: usuarioBD.nombre_usuario
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token invalido o expirado"
      });
    }

    console.error("Error verificando autenticacion:", err);

    return res.status(500).json({
      error: "Error interno de autenticacion"
    });
  }
}


// Exige que el usuario autenticado tenga uno de los roles indicados.
// Uso: router.post("/", permitirRoles("Administrador"), ctrl)
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: "No autenticado" });
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tiene permisos para realizar esta accion" });
    }
    next();
  };
}

// Exige que el usuario autenticado tenga AL MENOS UNO de los permisos
// indicados (catalogo formal en las tablas rol/permiso/rol_permiso).
// Uso: router.post("/", permitirPermiso("tienda.escribir"), ctrl)
function permitirPermiso(...codigosPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: "No autenticado" });
    const permisos = req.usuario.permisos || [];
    const tienePermiso = codigosPermitidos.some((c) => permisos.includes(c));
    if (!tienePermiso) {
      return res.status(403).json({ error: "No tiene permisos para realizar esta accion" });
    }
    next();
  };
}

module.exports = { requiereLogin, permitirRoles, permitirPermiso };
