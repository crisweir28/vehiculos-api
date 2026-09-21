// controllers/configController.js
const pool = require('../db/connection');

// GET /api/config  (público)
exports.obtener = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM config WHERE id = 1');
    if (!rows.length) return res.json({ ok: true, config: getDefault() });

    const row = rows[0];
    res.json({
      ok: true,
      config: {
        empresa:      row.empresa,
        appNombre:    row.app_nombre,
        fuente:       row.fuente,
        tamano:       row.tamano,
        colorBg:      row.color_bg,
        colorSurface: row.color_surface,
        colorAccent:  row.color_accent,
        colorText:    row.color_text,
        colorHeader:  row.color_header,
        logo:         row.logo || null,
        logoSize:     row.logo_size || 120,
      }
    });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// PUT /api/config  (solo admin)
exports.guardar = async (req, res) => {
  try {
    const cfg = req.body;
    await pool.execute(
  'CALL sp_guardar_config(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [cfg.empresa, cfg.appNombre, cfg.fuente, cfg.tamano,
   cfg.colorBg, cfg.colorSurface, cfg.colorAccent,
   cfg.colorText, cfg.colorHeader, cfg.logo || null, cfg.logoSize || 120]
);
    const [rows] = await pool.execute('SELECT * FROM config WHERE id = 1');
    const row = rows[0];
    res.json({
      ok: true,
      config: {
        empresa:      row.empresa,
        appNombre:    row.app_nombre,
        fuente:       row.fuente,
        tamano:       row.tamano,
        colorBg:      row.color_bg,
        colorSurface: row.color_surface,
        colorAccent:  row.color_accent,
        colorText:    row.color_text,
        colorHeader:  row.color_header,
        logo:         row.logo || null,
        logoSize:     row.logo_size || 120,
      }
    });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

function getDefault() {
  return {
    empresa: 'SISSA Monitoring Integral S.A. de C.V.',
    appNombre: 'VehiLog', fuente: 'Inter', tamano: '16',
    colorBg: '#f2f2f7', colorSurface: '#ffffff', colorAccent: '#e8441a',
    colorText: '#111111', colorHeader: '#111111', logo: null, logoSize: 120,
  };
}