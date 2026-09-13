const socket = io("http://localhost:3000");

socket.on("inventario:actualizado", (producto) => {
  console.log("Inventario actualizado en tiempo real:", producto);
  // Aquí actualizas el DOM, por ejemplo:
  // document.getElementById(`stock-${producto.id}`).textContent = producto.stock_total - producto.stock_reservado;
});