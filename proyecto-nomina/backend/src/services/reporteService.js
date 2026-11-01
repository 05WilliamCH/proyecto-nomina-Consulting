// ============================================================
// Servicio de Reportes - Sistema de Nomina, Consulting S.A.
// Implementa los 5 listados/reportes exigidos por el enunciado:
// cumpleaneros, descuentos IGSS, descuentos ISR, poliza contable
// y libro de salarios.
// ============================================================
const pool = require("../config/db");
const { obtenerNombreMes } = require("./nominaService");

// RF-08: listado de empleados cumpleaneros de un mes dado (1-12).
async function generarReporteCumpleanos(mes) {
  const { rows } = await pool.query(
    `SELECT e.id_empleado, e.nombres, e.apellidos, e.fecha_nacimiento, d.nombre AS departamento
     FROM empleado e
     JOIN departamento d ON d.id_departamento = e.id_departamento
     WHERE EXTRACT(MONTH FROM e.fecha_nacimiento) = $1 AND e.estado = 'Activo'
     ORDER BY EXTRACT(DAY FROM e.fecha_nacimiento)`,
    [mes]
  );
  const nombreMes = await obtenerNombreMes(mes);
  return { mes: nombreMes, empleados: rows };
}

async function _reporteEgresoPorTipo(anio, mes, nombreTipoEgreso) {
  const { rows } = await pool.query(
    `SELECT e.id_empleado, e.nombres, e.apellidos, d.nombre AS departamento, deg.monto
     FROM detalle_egreso_nomina deg
     JOIN empleado e ON e.id_empleado = deg.id_empleado
     JOIN departamento d ON d.id_departamento = e.id_departamento
     JOIN tipo_egreso te ON te.id_tipo_egreso = deg.id_tipo_egreso
     JOIN periodo_nomina p ON p.id_periodo = deg.id_periodo
     WHERE te.nombre = $1 AND p.anio = $2 AND p.mes = $3
     ORDER BY e.apellidos, e.nombres`,
    [nombreTipoEgreso, anio, mes]
  );
  const total = rows.reduce((acc, r) => acc + Number(r.monto), 0);
  const nombreMes = await obtenerNombreMes(mes);
  return { anio, mes, nombreMes, detalle: rows, total: Number(total.toFixed(2)) };
}

// RF-09: descuentos de IGSS por periodo.
function generarReporteIGSS(anio, mes) {
  return _reporteEgresoPorTipo(anio, mes, "IGSS");
}

// RF-10: descuentos de ISR por periodo.
function generarReporteISR(anio, mes) {
  return _reporteEgresoPorTipo(anio, mes, "ISR");
}

// RF-11: poliza contable del periodo, agrupada por la cuenta contable de
// cada departamento (RF-14: cada departamento tiene una cuenta distinta).
async function generarPolizaContable(anio, mes) {
  const { rows } = await pool.query(
    `SELECT c.codigo, c.nombre AS cuenta_contable, d.nombre AS departamento,
            SUM(nr.liquido_a_pagar) AS monto
     FROM nomina_resultado nr
     JOIN empleado e ON e.id_empleado = nr.id_empleado
     JOIN departamento d ON d.id_departamento = e.id_departamento
     JOIN cuenta_contable c ON c.id_cuenta_contable = d.id_cuenta_contable
     JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
     WHERE p.anio = $1 AND p.mes = $2 AND p.tipo = 'Fin de Mes'
     GROUP BY c.codigo, c.nombre, d.nombre
     ORDER BY c.codigo`,
    [anio, mes]
  );
  const totalPoliza = rows.reduce((acc, r) => acc + Number(r.monto), 0);
  const nombreMes = await obtenerNombreMes(mes);
  return { anio, mes, nombreMes, renglones: rows, total: Number(totalPoliza.toFixed(2)) };
}

// RF-12: libro de salarios: departamento / empleado / sueldo base / dias
// laborados / ingresos / egresos.
async function generarLibroSalarios(anio, mes) {
  const { rows } = await pool.query(
    `SELECT d.nombre AS departamento, e.nombres, e.apellidos, e.salario_base,
            e.dias_laborados, nr.total_ingresos, nr.total_egresos,
            nr.anticipo_descontado, nr.liquido_a_pagar
     FROM nomina_resultado nr
     JOIN empleado e ON e.id_empleado = nr.id_empleado
     JOIN departamento d ON d.id_departamento = e.id_departamento
     JOIN periodo_nomina p ON p.id_periodo = nr.id_periodo
     WHERE p.anio = $1 AND p.mes = $2 AND p.tipo = 'Fin de Mes'
     ORDER BY d.nombre, e.apellidos`,
    [anio, mes]
  );
  const nombreMes = await obtenerNombreMes(mes);
  return { anio, mes, nombreMes, renglones: rows };
}

module.exports = {
  generarReporteCumpleanos,
  generarReporteIGSS,
  generarReporteISR,
  generarPolizaContable,
  generarLibroSalarios,
};
