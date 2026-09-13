const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://mercado_viva_db_user:wTIqmrSQVOgfV2hmHlpuZw5DXfmq1b58@dpg-daji80gae00c73a308ng-a.virginia-postgres.render.com/mercado_viva_db",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query("UPDATE productos SET nombre = 'Arroz 1kg (Lote 1)' WHERE id = 1");
    await pool.query("UPDATE productos SET nombre = 'Arroz 1kg (Lote 2)' WHERE id = 4");
    await pool.query("UPDATE productos SET nombre = 'Arroz 1kg (Lote 3)' WHERE id = 7");
    
    await pool.query("UPDATE productos SET nombre = 'Leche entera 1L (Lote 1)' WHERE id = 2");
    await pool.query("UPDATE productos SET nombre = 'Leche entera 1L (Lote 2)' WHERE id = 5");
    await pool.query("UPDATE productos SET nombre = 'Leche entera 1L (Lote 3)' WHERE id = 8");
    
    await pool.query("UPDATE productos SET nombre = 'Aceite vegetal 900ml (Lote 1)' WHERE id = 3");
    await pool.query("UPDATE productos SET nombre = 'Aceite vegetal 900ml (Lote 2)' WHERE id = 6");
    await pool.query("UPDATE productos SET nombre = 'Aceite vegetal 900ml (Lote 3)' WHERE id = 9");

    console.log("Renamed successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
