const express = require('express');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hola Mercado Viva');
});

app.get("/api/ping-db", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW()");
        res.json({
            mensaje: "Conexión exitosa a PostgreSQL",
            hora_servidor_db: resultado.rows[0].now,
        });
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error);
        res.status(500).json({ mensaje: "Error al conectar con la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corre en http://localhost:${PORT}`);
});
