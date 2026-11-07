const pool = require("./config/db");

async function probarConexion() {
  try {
    const resultado = await pool.query(`
      SELECT
        current_database() AS base_datos,
        current_user AS usuario,
        NOW() AS fecha_conexion
    `);

    console.log("Conexión exitosa con AWS RDS:");
    console.log(resultado.rows[0]);
  } catch (error) {
    console.error("Error de conexión:", error.message);
  } finally {
    await pool.end();
  }
}

probarConexion();