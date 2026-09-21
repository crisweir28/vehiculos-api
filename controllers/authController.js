// controllers/authController.js
const crypto = require('crypto');
const pool   = require('../db/connection');
const { enviarRecuperacionPassword } = require('../utils/mailer');

function hash(str) { return crypto.createHash('sha256').update(str).digest('hex'); }

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password)
      return res.status(400).json({ ok: false, error: 'Faltan usuario y contraseña.' });

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE usuario = ? AND password = ?',
      [usuario, hash(password)]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' });

    const token    = crypto.randomBytes(32).toString('hex');
    const creadaEn = Date.now();

    await pool.execute(
      'INSERT INTO sesiones (token, usuario, rol, creada_en) VALUES (?, ?, ?, ?)',
      [token, user.usuario, user.rol, creadaEn]
    );

    console.log(`[LOGIN] ${user.usuario} (${user.rol})`);
    res.json({ ok: true, token, usuario: user.usuario, rol: user.rol });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const token = req.headers['x-session-token'];
    if (token) {
      await pool.execute('DELETE FROM sesiones WHERE token = ?', [token]);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/auth/verificar
exports.verificar = (req, res) => {
  res.json({ ok: true, usuario: req.usuario, rol: req.rol });
};

// POST /api/auth/recuperar  (público)
exports.recuperar = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'Ingresa tu correo.' });

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE LOWER(email) = ?',
      [email.toLowerCase()]
    );
    const user = rows[0];

    if (!user) {
      console.log(`[RESET] Correo no encontrado: ${email}`);
      return res.json({ ok: true });
    }

    const token  = crypto.randomBytes(32).toString('hex');
    const expira = Date.now() + 60 * 60 * 1000; // 1 hora

    await pool.execute(
      'INSERT INTO resets (token, usuario, expira_en) VALUES (?, ?, ?)',
      [token, user.usuario, expira]
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    await enviarRecuperacionPassword(user, token, baseUrl);
    console.log(`[RESET] Correo enviado a ${email}`);

    res.json({ ok: true });
  } catch (err) {
    console.error('[RESET ERROR]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /api/auth/reset  (público)
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ ok: false, error: 'Faltan datos.' });
    if (password.length < 6)
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });

    const [rows] = await pool.execute(
      'SELECT * FROM resets WHERE token = ?', [token]
    );
    const reset = rows[0];

    if (!reset)
      return res.status(400).json({ ok: false, error: 'Token inválido.' });

    if (Date.now() > reset.expira_en) {
      await pool.execute('DELETE FROM resets WHERE token = ?', [token]);
      return res.status(400).json({ ok: false, error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE usuario = ?',
      [hash(password), reset.usuario]
    );

    await pool.execute('DELETE FROM resets WHERE token = ?', [token]);

    console.log(`[RESET] Contraseña actualizada para ${reset.usuario}`);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};