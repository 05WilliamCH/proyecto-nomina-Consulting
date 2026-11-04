// ============================================================
// Datos de DEMOSTRACION para el Dashboard.  Uso: npm run db:demo
//
// Genera nomina de los ultimos 6 meses (incluido el actual) para los
// empleados activos. NO calcula nada por su cuenta: registra ingresos,
// egresos y compras de tienda como lo haria RRHH, y luego llama a los
// procedimientos reales sp_calcular_anticipo y sp_calcular_nomina_fin_de_mes
// (los triggers de auditoria y de tienda se disparan igual que en produccion).
//
// Es idempotente: los meses que ya tengan ingresos o nomina se omiten.
// Los montos son ficticios: usar solo para pruebas / presentaciones.
// ============================================================
const pool = require("../config/db");

const MESES_A_GENERAR = 6;

// Generador pseudoaleatorio determinista: mismos datos en cada corrida.
function crearRng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n) => Number(n.toFixed(2));

async function run() {
  const client = await pool.connect();
  try {
    const rand = crearRng(2026);
    const entre = (a, b) => a + rand() * (b - a);

    const mapa = async (sql, claveId) =>
      Object.fromEntries((await client.query(sql)).rows.map((r) => [r.nombre, r[claveId]]));
    const ING = await mapa("SELECT id_tipo_ingreso, nombre FROM tipo_ingreso", "id_tipo_ingreso");
    const EGR = await mapa("SELECT id_tipo_egreso, nombre FROM tipo_egreso", "id_tipo_egreso");
    for (const n of ["Salario Base", "Horas Extras y Dobles", "Bonificacion Decreto", "Bonificacion x Produccion", "Comisiones"])
      if (!ING[n]) throw new Error(`Falta el tipo de ingreso "${n}" (ejecute npm run db:init)`);
    for (const n of ["IGSS", "ISR", "Ahorro Asociacion Solidarista"])
      if (!EGR[n]) throw new Error(`Falta el tipo de egreso "${n}"`);

    const { rows: empleados } = await client.query(
      `SELECT e.id_empleado, e.salario_base::float AS salario, d.nombre AS depto
       FROM empleado e JOIN departamento d ON d.id_departamento = e.id_departamento
       WHERE e.estado = 'Activo' ORDER BY e.id_empleado`);
    if (!empleados.length) throw new Error("No hay empleados activos.");
    // Solo articulos de consumo corriente (hasta Q400): una compra mensual tipica en la tienda
    // de la Asociacion, para que el descuento sea realista frente al IGSS.
    const { rows: articulos } = await client.query(
      "SELECT id_articulo, precio::float AS precio FROM articulo_tienda WHERE activo = TRUE AND precio <= 400");

    const hoy = new Date();
    let generados = 0;

    for (let i = MESES_A_GENERAR - 1; i >= 0; i--) {
      const f = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const anio = f.getFullYear(), mes = f.getMonth() + 1;

      const { rows: [{ id }] } = await client.query(
        "SELECT fn_obtener_o_crear_periodo($1,$2,'Fin de Mes') AS id", [anio, mes]);
      const { rows: previo } = await client.query(
        `SELECT 1 FROM detalle_ingreso_nomina WHERE id_periodo = $1
         UNION ALL SELECT 1 FROM nomina_resultado WHERE id_periodo = $1 LIMIT 1`, [id]);
      if (previo.length) { console.log(`  ${anio}-${String(mes).padStart(2, "0")}: ya tiene datos, se omite`); continue; }

      await client.query("BEGIN");
      const ins = (emp, tipo, monto) => client.query(
        "INSERT INTO detalle_ingreso_nomina (id_empleado,id_tipo_ingreso,id_periodo,monto) VALUES ($1,$2,$3,$4)",
        [emp, tipo, id, monto]);
      const egr = (emp, tipo, monto) => client.query(
        "INSERT INTO detalle_egreso_nomina (id_empleado,id_tipo_egreso,id_periodo,monto) VALUES ($1,$2,$3,$4)",
        [emp, tipo, id, monto]);

      for (const e of empleados) {
        let afectoIgss = e.salario;
        await ins(e.id_empleado, ING["Salario Base"], r2(e.salario));
        await ins(e.id_empleado, ING["Bonificacion Decreto"], 250); // exenta de IGSS

        if (rand() < 0.4) { // horas extra: 4 a 16 h a 1.5x la hora ordinaria
          const horasExtra = r2((e.salario / 30 / 8) * 1.5 * Math.round(entre(4, 16)));
          await ins(e.id_empleado, ING["Horas Extras y Dobles"], horasExtra); afectoIgss += horasExtra;
        }
        if (e.depto === "Produccion") {
          const bono = r2(entre(300, 900));
          await ins(e.id_empleado, ING["Bonificacion x Produccion"], bono); afectoIgss += bono;
        }
        if (e.depto === "Mercadeo") {
          const com = r2(entre(500, 2500));
          await ins(e.id_empleado, ING["Comisiones"], com); afectoIgss += com;
        }

        await egr(e.id_empleado, EGR["IGSS"], r2(afectoIgss * 0.0483));
        // ISR: 5% sobre la renta imponible anual (ingreso anual - 48,000), retenido en 12 pagos.
        const isr = r2(Math.max(0, e.salario * 12 - 48000) * 0.05 / 12);
        if (isr > 0) await egr(e.id_empleado, EGR["ISR"], isr);
        if (e.id_empleado % 2 === 0) await egr(e.id_empleado, EGR["Ahorro Asociacion Solidarista"], r2(e.salario * 0.03));

        // Compras en la tienda: el trigger crea solo el egreso "Descuento Tienda Solidarista".
        if (articulos.length && rand() < 0.3) {
          const { rows: [{ id_compra }] } = await client.query(
            "INSERT INTO compra_tienda (id_empleado,id_periodo) VALUES ($1,$2) RETURNING id_compra", [e.id_empleado, id]);
          for (let k = 0; k < 1; k++) {
            const a = articulos[Math.floor(rand() * articulos.length)];
            const cant = 1 + Math.floor(rand() * 2);
            await client.query(
              `INSERT INTO detalle_compra_tienda
                 (id_compra,id_empleado,id_periodo,id_articulo,cantidad,precio_unitario,subtotal)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [id_compra, e.id_empleado, id, a.id_articulo, cant, a.precio, r2(a.precio * cant)]);
          }
        }
      }

      await client.query("CALL sp_calcular_anticipo($1,$2)", [anio, mes]);
      await client.query("CALL sp_calcular_nomina_fin_de_mes($1,$2)", [anio, mes]);
      await client.query("COMMIT");
      generados++;
      console.log(`  ${anio}-${String(mes).padStart(2, "0")}: nomina generada (${empleados.length} empleados)`);
    }
    console.log(generados ? `Listo: ${generados} mes(es) de demostracion generados.` : "No habia nada que generar.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => { console.error("Error generando datos de demostracion:", e.message); process.exit(1); });
