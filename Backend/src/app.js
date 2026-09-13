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

app.get("/api/limpiar-duplicados", async (req, res) => {
  try {
    // Esta consulta borra todos los productos repetidos dejando solo el más antiguo (MIN id)
    await pool.query(`
      DELETE FROM productos
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM productos
        GROUP BY nombre
      );
    `);
    res.send("¡Duplicados eliminados correctamente! Ya puedes volver a tu página principal.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al limpiar: " + error.message);
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
    let necesitaInicializar = false;

    // 1. Verificamos si la tabla ya existe y tiene datos
    try {
      const res = await pool.query("SELECT COUNT(*) FROM productos");
      if (parseInt(res.rows[0].count) === 0) necesitaInicializar = true;
    } catch (e) {
      // Si entra aquí, es porque la tabla "productos" aún no existe
      necesitaInicializar = true;
    }

    // 2. Si ya hay datos, detenemos la inicialización para no duplicar
    if (!necesitaInicializar) {
      console.log("✅ La base de datos ya tiene productos. Omitiendo schema.sql.");
      return;
    }

    console.log("Conectando a la BD para verificar/crear tablas e insertar datos...");
    const schemaPath = path.join(__dirname, 'schema.sql'); // Ajusta la ruta si es necesario
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log("✅ Tablas creadas y datos insertados por primera vez.");
    } else {
      console.warn(`⚠️ No se encontró schema.sql en: ${schemaPath}`);
    }
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
  }
}