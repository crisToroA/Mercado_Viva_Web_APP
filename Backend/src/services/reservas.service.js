const pool = require("../db/pool");

const MINUTOS_EXPIRACION = 5;

async function crearReserva(productoId, cantidad) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultadoProducto = await client.query(
      `SELECT stock_total, stock_reservado
       FROM productos
       WHERE id = $1
       FOR UPDATE`,
      [productoId]
    );

    if (resultadoProducto.rows.length === 0) {
      throw new Error("PRODUCTO_NO_EXISTE");
    }

    const { stock_total, stock_reservado } = resultadoProducto.rows[0];
    const disponible = stock_total - stock_reservado;

    if (disponible < cantidad) {
      throw new Error("STOCK_INSUFICIENTE");
    }

    await client.query(
      `UPDATE productos
       SET stock_reservado = stock_reservado + $1
       WHERE id = $2`,
      [cantidad, productoId]
    );

    const expiraEn = new Date(Date.now() + MINUTOS_EXPIRACION * 60 * 1000);

    const resultadoReserva = await client.query(
      `INSERT INTO reservas (producto_id, cantidad, estado, expira_en)
       VALUES ($1, $2, 'activa', $3)
       RETURNING id, producto_id, cantidad, estado, expira_en`,
      [productoId, cantidad, expiraEn]
    );

    await client.query("COMMIT");

    return resultadoReserva.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { crearReserva };
