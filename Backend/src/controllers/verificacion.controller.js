const { crearReserva } = require("../services/reservas.service");

async function verificarDisponibilidad(req, res) {
    const { producto_id, cantidad } = req.body;

    if (!producto_id || !cantidad) {
        return res.status(400).json({
            error: "Debes enviar producto_id y cantidad",
        });
    }

    if (cantidad <= 0) {
        return res.status(400).json({
            error: "La cantidad debe ser mayor a cero",
        });
    }

    try {
        const reserva = await crearReserva(producto_id, cantidad);

        return res.status(201).json({
            mensaje: "Stock reservado correctamente",
            reserva,
        });
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

module.exports = { verificarDisponibilidad };
