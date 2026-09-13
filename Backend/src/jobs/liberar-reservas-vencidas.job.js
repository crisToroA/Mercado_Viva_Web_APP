const pool = require("../db/pool");
const { liberarReserva } = require("../services/reservas.service");

const INTERVALO_MS = 30000; // revisa cada 30 segundos

async function revisarReservasVencidas() {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM reservas WHERE estado = 'activa' AND expira_en < NOW()`
    );

    for (const reserva of rows) {
      try {
        await liberarReserva(reserva.id, "expirada");
        console.log(`Reserva ${reserva.id} expiró y fue liberada automáticamente`);
      } catch (error) {
        console.error(`Error liberando reserva ${reserva.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error revisando reservas vencidas:", error);
  }
}

function iniciarJobLiberacion() {
  setInterval(revisarReservasVencidas, INTERVALO_MS);
  console.log("Job de liberación de reservas vencidas iniciado");
}

module.exports = { iniciarJobLiberacion };
