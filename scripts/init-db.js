
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const connectionString = process.env.PG_URI;
if (!connectionString) {
  console.error('Falta PG_URI no .env. Abortando.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sql = fs.readFileSync('sql/schema.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Tabelas criadas/validadas');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
