// controllers/usuariosController.js
const crypto = require('crypto');
const pool   = require('../db/connection');

function hash(str) { return crypto.createHash('sha256').update(str).digest('hex'); }

// GET /api/usuarios
exports.listar = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, usuario, rol, email, creado_en AS creadoEn FROM usuarios ORDER BY creado_en ASC'
    );
    res.json({ ok: true, usuarios: rows });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/usuarios
exports.crear = async (req, res) => {
  try {
    const { usuario, password, rol, email } = req.body;
    if (!usuario || !password || !email)
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });
    if (password.length < 6)
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });

    const [exists] = await pool.execute('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (exists.length)
      return res.status(409).json({ ok: false, error: `El usuario "${usuario}" ya existe.` });

    const id = Date.now();
    await pool.execute(
      'INSERT INTO usuarios (id, usuario, password, rol, email, creado_en) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, usuario, hash(password), rol || 'operador', email]
    );
    console.log(`[USUARIO] Creado: ${usuario} (${rol}) por ${req.usuario}`);
    res.status(201).json({ ok: true, usuario });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// PATCH /api/usuarios/:usuario
exports.actualizar = async (req, res) => {
  try {
    const { email, rol, password } = req.body;
    const usuarioId = req.params.usuario;

    const [rows] = await pool.execute('SELECT id FROM usuarios WHERE usuario = ?', [usuarioId]);
    if (!rows.length)
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });

    if (password) {
      if (password.length < 6)
        return res.status(400).json({ ok: false, error: 'Mínimo 6 caracteres.' });
      await pool.execute(
        'UPDATE usuarios SET email = ?, rol = ?, password = ?, actualizado_en = NOW() WHERE usuario = ?',
        [email, rol, hash(password), usuarioId]
      );
    } else {
      await pool.execute(
        'UPDATE usuarios SET email = ?, rol = ?, actualizado_en = NOW() WHERE usuario = ?',
        [email, rol, usuarioId]
      );
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// DELETE /api/usuarios/:usuario
exports.eliminar = async (req, res) => {
  try {
    const usuarioId = req.params.usuario;
    if (usuarioId === 'admin')
      return res.status(403).json({ ok: false, error: 'No se puede eliminar el usuario admin.' });

    const [result] = await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [usuarioId]);
    if (!result.affectedRows)
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });

    // Eliminar sesiones del usuario
    await pool.execute('DELETE FROM sesiones WHERE usuario = ?', [usuarioId]);

    console.log(`[USUARIO] Eliminado: ${usuarioId} por ${req.usuario}`);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};