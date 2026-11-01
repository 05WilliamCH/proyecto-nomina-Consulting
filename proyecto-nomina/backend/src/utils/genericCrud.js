// Fabrica de controladores CRUD simples, para catalogos que no tienen
// logica de negocio propia (departamento, cuenta_contable, tipo_ingreso,
// tipo_egreso). Evita repetir el mismo codigo 4 veces.
const pool = require("../config/db");

function makeCrudController(table, idColumn, columns) {
  const cols = columns.join(", ");
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(", ");

  return {
    async listAll(req, res, next) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${idColumn}`);
        res.json(rows);
      } catch (err) { next(err); }
    },

    async getById(req, res, next) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE ${idColumn} = $1`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: `${table} no encontrado` });
        res.json(rows[0]);
      } catch (err) { next(err); }
    },

    async create(req, res, next) {
      try {
        const values = columns.map((c) => req.body[c]);
        const { rows } = await pool.query(
          `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
          values
        );
        res.status(201).json(rows[0]);
      } catch (err) { next(err); }
    },

    async update(req, res, next) {
      try {
        const values = columns.map((c) => req.body[c]);
        const { rows } = await pool.query(
          `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = $${columns.length + 1} RETURNING *`,
          [...values, req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: `${table} no encontrado` });
        res.json(rows[0]);
      } catch (err) { next(err); }
    },

    async remove(req, res, next) {
      try {
        const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE ${idColumn} = $1`, [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: `${table} no encontrado` });
        res.status(204).send();
      } catch (err) { next(err); }
    },
  };
}

module.exports = { makeCrudController };
