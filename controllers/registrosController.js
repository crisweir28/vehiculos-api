// controllers/registrosController.js
const pool = require('../db/connection');

// GET /api/registros
exports.listar = async (req, res) => {
  try {
    console.log('[REGISTROS] consultando...');
    const [rows] = await pool.execute('SELECT * FROM registros ORDER BY fecha_entrada DESC, hora_entrada DESC');
    console.log('[REGISTROS] filas:', rows.length);
    res.json({ ok: true, total: rows.length, registros: rows.map(mapRegistro) });
  } catch (err) {
    console.error('[REGISTROS ERROR]', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/registros/:folio
exports.obtener = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM registros WHERE folio = ?', [req.params.folio]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Registro no encontrado.' });
    res.json({ ok: true, registro: mapRegistro(rows[0]) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/registros
exports.crear = async (req, res) => {
  try {
    const {
      folio, fechaEntrada, horaEntrada, nombreConductor,
      empresa, telefono, placas, marca, modelo, color,
      oficioCita, docsVerificados, observaciones
    } = req.body;

    if (!folio || !fechaEntrada || !horaEntrada || !nombreConductor)
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });

    await pool.execute(
      `CALL sp_registrar_entrada(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [folio, fechaEntrada, horaEntrada, nombreConductor,
       empresa || null, telefono || null,
       placas || null, marca || null, modelo || null, color || null,
       oficioCita || null,
       docsVerificados ? JSON.stringify(docsVerificados) : null,
       observaciones || null]
    );

    console.log(`[ENTRADA] ${folio} | ${nombreConductor}`);
    res.status(201).json({ ok: true, folio });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ ok: false, error: `El folio ${req.body.folio} ya existe.` });
    res.status(500).json({ ok: false, error: err.message });
  }
};

// PATCH /api/registros/:folio/salida
exports.registrarSalida = async (req, res) => {
  try {
    const { fechaSalida, horaSalida, observacionesSalida } = req.body;
    if (!fechaSalida || !horaSalida)
      return res.status(400).json({ ok: false, error: 'Faltan fechaSalida y horaSalida.' });

    await pool.execute(
      `CALL sp_registrar_salida(?, ?, ?, ?)`,
      [req.params.folio, fechaSalida, horaSalida, observacionesSalida || null]
    );

    console.log(`[SALIDA] ${req.params.folio} | ${fechaSalida} ${horaSalida}`);
    res.json({ ok: true });
  } catch (err) {
    if (err.message.includes('no encontrado') || err.message.includes('ya tiene salida'))
      return res.status(409).json({ ok: false, error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET /api/registros/activos
exports.activos = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM v_registros_activos');
    res.json({ ok: true, total: rows.length, registros: rows.map(mapRegistro) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/stats
exports.stats = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM v_dashboard_stats');
    res.json({ ok: true, stats: rows[0] });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// ── HELPER ──
function mapRegistro(row) {
  const parsear = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  };
  return {
    id:                  row.id,
    folio:               row.folio,
    fechaEntrada: row.fecha_entrada instanceof Date   ? row.fecha_entrada.toISOString().split('T')[0]   : row.fecha_entrada,
    horaEntrada:         row.hora_entrada ? String(row.hora_entrada).slice(0, 5) : null,
    fechaSalida:         row.fecha_salida instanceof Date   ? row.fecha_salida.toISOString().split('T')[0]   : row.fecha_salida,
    horaSalida:          row.hora_salida  ? String(row.hora_salida).slice(0, 5)  : null,
    tipoMovimiento:      row.tipo_movimiento,
    nombreConductor:     row.nombre_conductor,
    empresa:             row.empresa,
    telefono:            row.telefono,
    placas:              row.placas,
    marca:               row.marca,
    modelo:              row.modelo,
    color:               row.color,
    oficioCita:          row.oficio_cita,
    docsVerificados:     parsear(row.docs_verificados),
    observaciones:       row.observaciones,
    observacionesSalida: row.observaciones_salida,
    estatus:             row.estatus,
    creadoEn:            row.creado_en,
  };
}