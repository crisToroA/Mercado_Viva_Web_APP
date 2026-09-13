const {
  crearReserva,
  confirmarReserva,
  liberarReserva,
} = require("../services/reservas.service");

async function verificarDisponibilidad(req, res) {
  const { producto_id, cantidad } = req.body;

  if (!producto_id || !cantidad) {
    return res.status(400).json({ error: "Debes enviar producto_id y cantidad" });
  }
  if (cantidad <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser mayor a cero" });
  }

  try {
    const reserva = await crearReserva(producto_id, cantidad);
    return res.status(201).json({ mensaje: "Stock reservado correctamente", reserva });
  } catch (error) {
    if (error.message === "PRODUCTO_NO_EXISTE") {
      return res.status(404).json({ error: "El producto no existe" });
    }
    if (error.message === "STOCK_INSUFICIENTE") {
      return res.status(409).json({ error: "No hay stock suficiente disponible" });
    }
    console.error("Error inesperado al crear reserva:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function confirmarCompra(req, res) {
  const { id } = req.params;

  try {
    const reserva = await confirmarReserva(id);
    return res.status(200).json({ mensaje: "Compra confirmada", reserva });
  } catch (error) {
    if (error.message === "RESERVA_NO_EXISTE") {
      return res.status(404).json({ error: "La reserva no existe" });
    }
    if (error.message === "RESERVA_NO_ACTIVA") {
      return res.status(409).json({ error: "La reserva ya no está activa" });
    }
    console.error("Error inesperado al confirmar reserva:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function liberarCompra(req, res) {
  const { id } = req.params;

  try {
    const reserva = await liberarReserva(id, "liberada");
    return res.status(200).json({ mensaje: "Reserva liberada", reserva });
  } catch (error) {
    if (error.message === "RESERVA_NO_EXISTE") {
      return res.status(404).json({ error: "La reserva no existe" });
    }
    if (error.message === "RESERVA_NO_ACTIVA") {
      return res.status(409).json({ error: "La reserva ya no está activa" });
    }
    console.error("Error inesperado al liberar reserva:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { verificarDisponibilidad, confirmarCompra, liberarCompra };
