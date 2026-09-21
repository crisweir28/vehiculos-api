// db/connection.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '123456',
  database: process.env.DB_NAME     || 'vehilog',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: 'Z',
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('[DB] Conectado a MySQL correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Error de conexión:', err.message);
    process.exit(1);
  });

module.exports = pool;