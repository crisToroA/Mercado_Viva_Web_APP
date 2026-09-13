const pool = require("../db/pool");
const { emitirInventarioActualizado } = require("../sockets/index");

const MINUTOS_EXPIRACION = 1;

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

    const productoActualizado = await pool.query(
      "SELECT id, nombre, stock_total, stock_reservado FROM productos WHERE id = $1",
      [productoId]
    );
    emitirInventarioActualizado(productoActualizado.rows[0]);

    return resultadoReserva.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function confirmarReserva(reservaId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultadoReserva = await client.query(
      `SELECT * FROM reservas WHERE id = $1 FOR UPDATE`,
      [reservaId]
    );

    if (resultadoReserva.rows.length === 0) {
      throw new Error("RESERVA_NO_EXISTE");
    }

    const reserva = resultadoReserva.rows[0];

    if (reserva.estado !== "activa") {
      throw new Error("RESERVA_NO_ACTIVA");
    }

    await client.query(
      `UPDATE productos
       SET stock_total = stock_total - $1,
           stock_reservado = stock_reservado - $1
       WHERE id = $2`,
      [reserva.cantidad, reserva.producto_id]
    );

    const resultado = await client.query(
      `UPDATE reservas SET estado = 'confirmada' WHERE id = $1
       RETURNING id, producto_id, cantidad, estado, expira_en`,
      [reservaId]
    );

    await client.query("COMMIT");

    // ---- NUEVO ----
    const productoActualizado = await pool.query(
      "SELECT id, nombre, stock_total, stock_reservado FROM productos WHERE id = $1",
      [reserva.producto_id]
    );
    emitirInventarioActualizado(productoActualizado.rows[0]);
    // ---------------

    return resultado.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function liberarReserva(reservaId, nuevoEstado = "liberada") {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultadoReserva = await client.query(
      `SELECT * FROM reservas WHERE id = $1 FOR UPDATE`,
      [reservaId]
    );

    if (resultadoReserva.rows.length === 0) {
      throw new Error("RESERVA_NO_EXISTE");
    }

    const reserva = resultadoReserva.rows[0];

    if (reserva.estado !== "activa") {
      throw new Error("RESERVA_NO_ACTIVA");
    }

    await client.query(
      `UPDATE productos SET stock_reservado = stock_reservado - $1 WHERE id = $2`,
      [reserva.cantidad, reserva.producto_id]
    );

    const resultado = await client.query(
      `UPDATE reservas SET estado = $2 WHERE id = $1
       RETURNING id, producto_id, cantidad, estado, expira_en`,
      [reservaId, nuevoEstado]
    );

    await client.query("COMMIT");

    // ---- NUEVO ----
    const productoActualizado = await pool.query(
      "SELECT id, nombre, stock_total, stock_reservado FROM productos WHERE id = $1",
      [reserva.producto_id]
    );
    emitirInventarioActualizado(productoActualizado.rows[0]);
    // ---------------

    return resultado.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { crearReserva, confirmarReserva, liberarReserva };
