// ============================================================
// Validacion de entrada - defensa en profundidad.
//
// La proteccion real contra inyeccion SQL en este proyecto viene de que
// TODAS las consultas usan parametros posicionales ($1, $2, ...) de la
// libreria "pg" (ver src/config/db.js y cada archivo de src/routes/*.js).
// pg envia el texto SQL y los valores por separado al servidor: un valor
// como  "1; DROP TABLE empleado;--"  llega como un simple string de
// datos, nunca se interpreta como parte del comando SQL. Por eso este
// proyecto NUNCA concatena strings para construir SQL con datos del
// usuario (ni siquiera con template literals).
//
// Esta utilidad es una segunda capa: valida que los datos tengan la
// forma esperada ANTES de llegar a la base de datos, para responder con
// un 400 claro en vez de un error de base de datos, y para reducir la
// superficie de ataque (rechaza tipos inesperados en vez de confiar en
// que "algun dia" lleguen bien formados).
// ============================================================

function esEnteroPositivo(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}

function esMontoValido(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100000000;
}

function esMesValido(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 12;
}

function esAnioValido(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 2000 && n <= 2100;
}

function esTextoSeguro(v, { min = 1, max = 150 } = {}) {
  return typeof v === "string" && v.trim().length >= min && v.length <= max;
}

// Middleware factory: valida req.body[campo] con la funcion dada;
// si falla, responde 400 y detiene la peticion antes de tocar la BD.
function validar(reglas) {
  return (req, res, next) => {
    for (const [campo, regla] of Object.entries(reglas)) {
      const valor = req.body[campo];
      if (!regla.fn(valor)) {
        return res.status(400).json({ error: `Campo inválido: ${campo} (${regla.mensaje})` });
      }
    }
    next();
  };
}

module.exports = { esEnteroPositivo, esMontoValido, esMesValido, esAnioValido, esTextoSeguro, validar };
