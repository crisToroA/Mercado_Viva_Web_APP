const express = require("express");
const fs = require('fs');
const path = require('path');
const http = require("http");
const pool = require("./db/pool");
const { iniciarJobLiberacion } = require("./jobs/liberar-reservas-vencidas.job");
const { inicializarSocket } = require("./sockets/index");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public/Frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/Frontend/index.html"));
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
  // Se agregó un bloque try/catch para evitar caídas del servidor
  try {
    const resultado = await pool.query("SELECT * FROM productos");
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error obteniendo los productos:", error);
    res.status(500).json({ mensaje: "Error obteniendo los productos de la BD" });
  }
});

app.use("/api/verificacion", require("./routes/verificacion.routes"));

const servidorHttp = http.createServer(app);
inicializarSocket(servidorHttp);

iniciarJobLiberacion();

// ==========================================
// FUNCIÓN PARA INICIALIZAR LA BASE DE DATOS
// ==========================================
async function inicializarBD() {
  try {
    console.log("Conectando a la BD para verificar/crear tablas...");
    
    // IMPORTANTE: Esta ruta asume que el archivo schema.sql está en la misma carpeta que este archivo.
    // Si lo tienes dentro de la carpeta "db", cámbialo a: path.join(__dirname, 'db', 'schema.sql')
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    
    // Verificamos que el archivo realmente exista antes de leerlo
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log("✅ Tablas verificadas/creadas exitosamente en la BD de Render.");
    } else {
      console.warn(`⚠️ No se encontró schema.sql en: ${schemaPath}`);
      console.warn(`Asegúrate de ajustar la ruta correcta en tu index.js`);
    }
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
  }
}

// Inicializamos la BD y SOLO SI termina (con éxito o error), levantamos el servidor
inicializarBD().then(() => {
  servidorHttp.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  });
});
