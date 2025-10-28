const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.PG_URI;
if (!connectionString) {
  throw new Error('PG_URI não definida. Cria .env com PG_URI.');
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ PostgreSQL: conexão OK');
  } catch (err) {
    console.error('❌ PostgreSQL: falha de conexão —', err.message);
    // Não encerramos o processo aqui; deixamos a app decidir.
  }
}

testConnection();

module.exports = pool;
