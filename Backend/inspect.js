const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: "postgresql://mercado_viva_db_user:wTIqmrSQVOgfV2hmHlpuZw5DXfmq1b58@dpg-daji80gae00c73a308ng-a.virginia-postgres.render.com/mercado_viva_db",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM productos ORDER BY id");
    console.log("PRODUCTOS:");
    console.table(res.rows);

    const res2 = await pool.query("SELECT * FROM reservas ORDER BY id");
    console.log("RESERVAS:");
    console.table(res2.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
