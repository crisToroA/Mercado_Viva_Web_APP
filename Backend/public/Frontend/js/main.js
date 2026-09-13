const SOCKET_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : window.location.origin;

const socket = io(SOCKET_URL);

const productosCache = new Map();
const reservasActivas = new Map(); // reservaId -> { productoId, cantidad, expiraEn, intervalId }

const gridEl = document.getElementById("productos-grid");
const logEl = document.getElementById("actividad-log");
const puntoEl = document.getElementById("conexion-punto");
const textoConexionEl = document.getElementById("conexion-texto");

// --- Conexión ---
socket.on("connect", () => {
  puntoEl.classList.add("activa");
  textoConexionEl.textContent = "Conectado en tiempo real";
});

socket.on("disconnect", () => {
  puntoEl.classList.remove("activa");
  textoConexionEl.textContent = "Desconectado";
});

socket.on("inventario:actualizado", (producto) => {
  productosCache.set(producto.id, producto);
  registrarActividad(`Inventario actualizado — ${producto.nombre}: disponible ${producto.stock_total - producto.stock_reservado}/${producto.stock_total}`);
  renderProductos();
});

// --- Carga inicial ---
async function iniciar() {
  const productos = await obtenerProductos();
  productos.forEach((p) => productosCache.set(p.id, p));
  renderProductos();
}

// --- Render ---
function renderProductos() {
  gridEl.innerHTML = "";
  for (const producto of productosCache.values()) {
    gridEl.appendChild(crearTarjetaProducto(producto));
  }
}

function crearTarjetaProducto(producto) {
  const disponible = producto.stock_total - producto.stock_reservado;
  const porcentajeReservado = producto.stock_total > 0
    ? Math.round((producto.stock_reservado / producto.stock_total) * 100)
    : 0;

  const card = document.createElement("article");
  card.className = "producto-card" + (disponible <= 0 ? " sin-stock" : "");

  card.innerHTML = `
    <div class="producto-nombre">${producto.nombre}</div>
    ${producto.precio ? `<div class="producto-precio">$${Number(producto.precio).toLocaleString("es-CO")}</div>` : ""}
    <div class="producto-stock">
      <span class="producto-disponible">${disponible}</span>
      <span class="producto-total">disponibles de ${producto.stock_total}</span>
    </div>
    <div class="barra-stock">
      <div class="barra-stock-relleno" style="width: ${porcentajeReservado}%"></div>
    </div>
    <div class="producto-acciones">
      <input type="number" min="1" max="${disponible}" value="1" class="cantidad-input" ${disponible <= 0 ? "disabled" : ""} />
      <button class="btn btn-reservar" ${disponible <= 0 ? "disabled" : ""}>Verificar y reservar</button>
    </div>
    <div class="reservas-del-producto"></div>
  `;

  const input = card.querySelector(".cantidad-input");
  const botonReservar = card.querySelector(".btn-reservar");
  const contenedorReservas = card.querySelector(".reservas-del-producto");

  botonReservar.addEventListener("click", async () => {
    const cantidad = parseInt(input.value, 10) || 1;
    botonReservar.disabled = true;
    try {
      const reserva = await verificarYReservar(producto.id, cantidad);
      registrarActividad(`Reserva #${reserva.id} creada — ${producto.nombre} (${cantidad} uds)`);
      iniciarSeguimientoReserva(reserva, producto);
    } catch (error) {
      registrarActividad(`No se pudo reservar ${producto.nombre}: ${error.message}`, true);
    } finally {
      botonReservar.disabled = disponible <= 0;
    }
  });

  // Vuelve a pintar las reservas activas de ESTE producto que ya existían
  for (const [reservaId, datos] of reservasActivas.entries()) {
    if (datos.productoId === producto.id) {
      contenedorReservas.appendChild(crearPanelReserva(reservaId, datos, producto));
    }
  }

  return card;
}

function iniciarSeguimientoReserva(reserva, producto) {
  const expiraEn = new Date(reserva.expira_en).getTime();
  reservasActivas.set(reserva.id, {
    productoId: producto.id,
    cantidad: reserva.cantidad,
    expiraEn,
  });
  renderProductos();
}

function crearPanelReserva(reservaId, datos, producto) {
  const panel = document.createElement("div");
  panel.className = "reserva-activa";
  panel.dataset.reservaId = reservaId;

  panel.innerHTML = `
    <div class="reserva-linea">
      <span>Reserva #${reservaId} · ${datos.cantidad} uds</span>
      <span class="reserva-tiempo">--:--</span>
    </div>
    <div class="reserva-botones">
      <button class="btn btn-confirmar">Confirmar compra</button>
      <button class="btn btn-cancelar">Cancelar</button>
    </div>
  `;

  const tiempoEl = panel.querySelector(".reserva-tiempo");
  const btnConfirmar = panel.querySelector(".btn-confirmar");
  const btnCancelar = panel.querySelector(".btn-cancelar");

  const intervalo = setInterval(() => {
    const restanteMs = datos.expiraEn - Date.now();
    if (restanteMs <= 0) {
      clearInterval(intervalo);
      tiempoEl.textContent = "expirada";
      panel.classList.add("expirada");
      btnConfirmar.disabled = true;
      btnCancelar.disabled = true;
      return;
    }
    const segundos = Math.floor(restanteMs / 1000);
    const min = String(Math.floor(segundos / 60)).padStart(2, "0");
    const seg = String(segundos % 60).padStart(2, "0");
    tiempoEl.textContent = `${min}:${seg}`;
  }, 1000);

  btnConfirmar.addEventListener("click", async () => {
    btnConfirmar.disabled = true;
    btnCancelar.disabled = true;
    try {
      await confirmarReserva(reservaId);
      registrarActividad(`Reserva #${reservaId} confirmada — compra completada`);
      clearInterval(intervalo);
      reservasActivas.delete(reservaId);
      renderProductos();
    } catch (error) {
      registrarActividad(`No se pudo confirmar la reserva #${reservaId}: ${error.message}`, true);
      btnConfirmar.disabled = false;
      btnCancelar.disabled = false;
    }
  });

  btnCancelar.addEventListener("click", async () => {
    btnConfirmar.disabled = true;
    btnCancelar.disabled = true;
    try {
      await liberarReserva(reservaId);
      registrarActividad(`Reserva #${reservaId} cancelada por el usuario`);
      clearInterval(intervalo);
      reservasActivas.delete(reservaId);
      renderProductos();
    } catch (error) {
      registrarActividad(`No se pudo cancelar la reserva #${reservaId}: ${error.message}`, true);
      btnConfirmar.disabled = false;
      btnCancelar.disabled = false;
    }
  });

  return panel;
}

function registrarActividad(mensaje, esError = false) {
  const vacio = logEl.querySelector(".actividad-vacia");
  if (vacio) vacio.remove();

  const li = document.createElement("li");
  const hora = new Date().toLocaleTimeString("es-CO");
  li.innerHTML = `<span class="actividad-hora">${hora}</span><span>${esError ? "⚠ " : ""}${mensaje}</span>`;
  logEl.prepend(li);
}

iniciar();