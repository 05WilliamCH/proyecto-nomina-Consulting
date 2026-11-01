// ============================================================
// Servicio de Nomina - Sistema de Nomina, Consulting S.A.
//
// La logica de calculo vive en la base de datos (funcion, procedimientos
// almacenados y triggers definidos en src/db/schema.sql); este servicio
// es la capa delgada que los invoca desde Node.js:
//   - fn_nombre_mes(mes)                    -> RF-06
//   - sp_calcular_anticipo(anio, mes)       -> RF-04
//   - sp_calcular_nomina_fin_de_mes(anio,mes) -> RF-05 / RF-07
// Los triggers trg_auditar_anticipo / trg_auditar_nomina (tambien en
// schema.sql) registran automaticamente cada calculo en la tabla
// "auditoria", sin que este archivo tenga que hacerlo explicitamente.
// ============================================================
const pool = require("../config/db");

// RF-06: nombre del mes. Se resuelve con la funcion fn_nombre_mes de
// PostgreSQL en vez de una tabla/arreglo en JavaScript.
async function obtenerNombreMes(numeroMes) {
  const n = Number(numeroMes);
  const { rows } = await pool.query("SELECT fn_nombre_mes($1) AS nombre", [n]);
  if (!rows[0]?.nombre) {
    throw new Error("El numero de mes debe estar entre 1 y 12");
  }
  return rows[0].nombre;
}

async function obtenerParametro(client, nombre) {
  const { rows } = await client.query(
    `SELECT valor FROM parametro_legal
     WHERE nombre = $1 AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
     ORDER BY vigente_desde DESC LIMIT 1`,
    [nombre]
  );
  if (!rows.length) throw new Error(`Parametro legal no configurado: ${nombre}`);
  return Number(rows[0].valor);
}

// Usa la funcion fn_obtener_o_crear_periodo de PostgreSQL (la misma que
// usan los dos procedimientos almacenados), para no duplicar esta logica
// en JavaScript y en SQL a la vez.
async function obtenerOCrearPeriodo(client, anio, mes, tipo) {
  const { rows } = await client.query(
    "SELECT fn_obtener_o_crear_periodo($1, $2, $3) AS id_periodo",
    [anio, mes, tipo]
  );
  return rows[0].id_periodo;
}

// RF-04: Anticipo = 50% del salario base, otorgado el dia 15 de cada mes.
// El calculo completo (recorrer empleados activos, aplicar el porcentaje
// configurado, insertar/actualizar) ocurre dentro de sp_calcular_anticipo;
// aqui solo se llama al procedimiento y se devuelve lo que quedo guardado.
async function calcularAnticipo(anio, mes) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("CALL sp_calcular_anticipo($1, $2)", [anio, mes]);

    const periodo = await client.query(
      `SELECT id_periodo FROM periodo_nomina WHERE anio=$1 AND mes=$2 AND tipo='Anticipo'`,
      [anio, mes]
    );
    const idPeriodo = periodo.rows[0].id_periodo;

    const { rows: anticipos } = await client.query(
      `SELECT id_anticipo, id_empleado, monto FROM anticipo WHERE id_periodo = $1 ORDER BY id_empleado`,
      [idPeriodo]
    );

    await client.query("COMMIT");
    return { periodo: { anio, mes, tipo: "Anticipo", id_periodo: idPeriodo }, anticipos };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// RF-05 / RF-07: procedimiento (pedido explicitamente por el enunciado)
// que calcula la nomina de fin de mes para todos los empleados activos.
// Toda la logica (sumar ingresos, sumar egresos, descontar el anticipo
// del mismo mes) vive en sp_calcular_nomina_fin_de_mes; aqui solo se
// invoca y se lee el resultado que quedo en nomina_resultado.
async function calcularNominaFinDeMes(anio, mes) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("CALL sp_calcular_nomina_fin_de_mes($1, $2)", [anio, mes]);

    const periodo = await client.query(
      `SELECT id_periodo FROM periodo_nomina WHERE anio=$1 AND mes=$2 AND tipo='Fin de Mes'`,
      [anio, mes]
    );
    const idPeriodo = periodo.rows[0].id_periodo;

    const { rows: resultados } = await client.query(
      `SELECT * FROM nomina_resultado WHERE id_periodo = $1 ORDER BY id_empleado`,
      [idPeriodo]
    );

    await client.query("COMMIT");

    const nombreMes = await obtenerNombreMes(mes);
    return {
      periodo: { anio, mes, tipo: "Fin de Mes", id_periodo: idPeriodo, nombreMes },
      resultados,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { obtenerNombreMes, calcularAnticipo, calcularNominaFinDeMes, obtenerParametro, obtenerOCrearPeriodo };
