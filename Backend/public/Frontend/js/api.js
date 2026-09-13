const API_BASE = "http://localhost:3000";

async function obtenerProductos() {
  const respuesta = await fetch(`${API_BASE}/api/productos`);
  return respuesta.json();
}

async function verificarYReservar(productoId, cantidad) {
  const respuesta = await fetch(`${API_BASE}/api/verificacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ producto_id: productoId, cantidad }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error al reservar");
  return datos.reserva;
}

async function confirmarReserva(reservaId) {
  const respuesta = await fetch(`${API_BASE}/api/verificacion/${reservaId}/confirmar`, {
    method: "POST",
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error al confirmar");
  return datos.reserva;
}

async function liberarReserva(reservaId) {
  const respuesta = await fetch(`${API_BASE}/api/verificacion/${reservaId}/liberar`, {
    method: "POST",
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error al liberar");
  return datos.reserva;
}