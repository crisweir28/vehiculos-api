// middleware/auth.js
const pool = require('../db/connection');

async function requireAuth(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token)
    return res.status(401).json({ ok: false, error: 'No autenticado.' });

  try {
    const [rows] = await pool.execute('SELECT * FROM sesiones WHERE token = ?', [token]);
    const sesion = rows[0];
    if (!sesion)
      return res.status(401).json({ ok: false, error: 'Sesión inválida.' });

    if (Date.now() - Number(sesion.creada_en) > 8 * 60 * 60 * 1000) {
      await pool.execute('DELETE FROM sesiones WHERE token = ?', [token]);
      return res.status(401).json({ ok: false, error: 'Sesión expirada.' });
    }

    req.usuario = sesion.usuario;
    req.rol     = sesion.rol;
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.rol !== 'admin')
      return res.status(403).json({ ok: false, error: 'Se requiere rol admin.' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin };