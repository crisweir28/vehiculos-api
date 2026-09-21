// jobs/limpiarCitas.js
const pool = require('../db/connection');

async function limpiarCitasCaducadas() {
  try {
    const [result] = await pool.execute(
      `DELETE FROM citas 
       WHERE estatus IN ('AGENDADA', 'PENDIENTE') 
       AND TIMESTAMP(fecha, hora) < NOW()`
    );

    if (result.affectedRows > 0) {
      console.log(`[CITAS] ${result.affectedRows} cita(s) caducada(s) eliminada(s).`);
    } else {
      console.log('[CITAS] Sin citas caducadas.');
    }
  } catch (err) {
    console.error('[CITAS] Error al limpiar:', err.message);
  }
}

module.exports = limpiarCitasCaducadas;