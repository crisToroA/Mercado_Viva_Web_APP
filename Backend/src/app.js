const express = require("express");
const http = require("http");
const pool = require("./db/pool");
const { iniciarJobLiberacion } = require("./jobs/liberar-reservas-vencidas.job");
const { inicializarSocket } = require("./sockets/index");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hola mundo desde el backend de Mercado Viva");
});

app.get("/api/ping-db", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");
    res.json({
      mensaje: "Conexión exitosa a PostgreSQL",
      hora_servidor_bd: resultado.rows[0].now,
    });
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    res.status(500).json({ mensaje: "Error al conectar con la base de datos" });
  }
});

app.get("/api/productos", async (req, res) => {
  const resultado = await pool.query("SELECT * FROM productos");
  res.json(resultado.rows);
});

app.use("/api/verificacion", require("./routes/verificacion.routes"));

const servidorHttp = http.createServer(app);
inicializarSocket(servidorHttp);

iniciarJobLiberacion();

servidorHttp.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
