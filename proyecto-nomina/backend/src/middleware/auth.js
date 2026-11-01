// ============================================================
// Middlewares de autenticacion y autorizacion por rol.
// ============================================================
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../services/authService");

// Exige un JWT valido en el header "Authorization: Bearer <token>".
function requiereLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado" });
  }
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalido o expirado" });
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
