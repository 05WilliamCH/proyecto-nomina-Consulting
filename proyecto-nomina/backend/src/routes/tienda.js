const express = require("express");
const pool = require("../config/db");
const { permitirPermiso } = require("../middleware/auth");

const router = express.Router();

// ---------- Articulos (catalogo) ----------
router.get("/articulos", permitirPermiso("tienda.leer", "tienda.escribir"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM articulo_tienda WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/articulos", permitirPermiso("tienda.escribir"), async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO articulo_tienda (nombre, descripcion, precio, stock)
       VALUES ($1,$2,$3, COALESCE($4,0)) RETURNING *`,
      [nombre, descripcion || null, precio, stock]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put("/articulos/:id", permitirPermiso("tienda.escribir"), async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock, activo } = req.body;
    const { rows } = await pool.query(
      `UPDATE articulo_tienda SET nombre=$1, descripcion=$2, precio=$3, stock=$4, activo=$5
       WHERE id_articulo=$6 RETURNING *`,
      [nombre, descripcion, precio, stock, activo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Articulo no encontrado" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ---------- Compras ----------
// Registrar una compra crea el encabezado (compra_tienda) y sus renglones
// (detalle_compra_tienda); el trigger trg_sync_egreso_tienda (schema.sql)
// se encarga de sumar el total y reflejarlo como egreso "Descuento Tienda
// Solidarista" del empleado para ese periodo, automaticamente.
router.get("/compras", permitirPermiso("tienda.leer", "tienda.escribir"), async (req, res, next) => {
  try {
    const { id_empleado, anio, mes } = req.query;
    const params = [];
    let sql = `SELECT c.*, e.nombres, e.apellidos
               FROM compra_tienda c
               JOIN empleado e ON e.id_empleado = c.id_empleado
               JOIN periodo_nomina p ON p.id_periodo = c.id_periodo
               WHERE 1=1`;
    if (id_empleado) { params.push(id_empleado); sql += ` AND c.id_empleado = $${params.length}`; }
    if (anio) { params.push(anio); sql += ` AND p.anio = $${params.length}`; }
    if (mes) { params.push(mes); sql += ` AND p.mes = $${params.length}`; }
    sql += ` ORDER BY c.fecha DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/compras/:id/detalle", permitirPermiso("tienda.leer", "tienda.escribir"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT dc.*, a.nombre AS articulo
       FROM detalle_compra_tienda dc JOIN articulo_tienda a ON a.id_articulo = dc.id_articulo
       WHERE dc.id_compra = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/compras", permitirPermiso("tienda.escribir"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id_empleado, anio, mes, items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items debe ser un arreglo con al menos un articulo" });
    }

    await client.query("BEGIN");
    const { rows: periodoRows } = await client.query(
      "SELECT fn_obtener_o_crear_periodo($1,$2,'Fin de Mes') AS id_periodo",
      [anio, mes]
    );
    const idPeriodo = periodoRows[0].id_periodo;

    const { rows: compraRows } = await client.query(
      `INSERT INTO compra_tienda (id_empleado, id_periodo) VALUES ($1,$2) RETURNING id_compra`,
      [id_empleado, idPeriodo]
    );
    const idCompra = compraRows[0].id_compra;

    for (const item of items) {
      const { rows: art } = await client.query(
        `SELECT precio FROM articulo_tienda WHERE id_articulo = $1 AND activo = TRUE`,
        [item.id_articulo]
      );
      if (!art.length) throw new Error(`Articulo ${item.id_articulo} no existe o esta inactivo`);
      const precioUnitario = Number(art[0].precio);
      const subtotal = Number((precioUnitario * item.cantidad).toFixed(2));

      await client.query(
        `INSERT INTO detalle_compra_tienda
           (id_compra, id_empleado, id_periodo, id_articulo, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [idCompra, id_empleado, idPeriodo, item.id_articulo, item.cantidad, precioUnitario, subtotal]
      );
    }

    const { rows: total } = await client.query(
      `SELECT total FROM compra_tienda WHERE id_compra = $1`,
      [idCompra]
    );

    await client.query("COMMIT");
    res.status(201).json({ id_compra: idCompra, id_periodo: idPeriodo, total: total[0].total });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.delete("/compras/:id", permitirPermiso("tienda.escribir"), async (req, res, next) => {
  try {
    // ON DELETE CASCADE en detalle_compra_tienda dispara el trigger de
    // sincronizacion, que recalcula (o elimina) el egreso correspondiente.
    const { rowCount } = await pool.query(`DELETE FROM compra_tienda WHERE id_compra=$1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Compra no encontrada" });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
