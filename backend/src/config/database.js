// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'plainness_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testar conexão (vai mostrar no terminal)
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados:', process.env.DB_NAME || 'plainness_crm');
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    console.error('   Verifique suas credenciais no arquivo .env');
  }
})();

module.exports = pool;