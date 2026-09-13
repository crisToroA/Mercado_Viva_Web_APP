const { Server } = require("socket.io");

let io;

function inicializarSocket(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

function emitirInventarioActualizado(producto) {
  if (io) {
    io.emit("inventario:actualizado", producto);
  }
}

module.exports = { inicializarSocket, emitirInventarioActualizado };
