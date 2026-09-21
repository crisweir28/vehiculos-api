// controllers/citasController.js
const pool = require('../db/connection');
const areasCtrl = require('./areasController');
const crypto = require('crypto');
const { enviarSolicitudAnfitrion, enviarConfirmacionPendiente, enviarCancelacionVisitante, enviarRespuestaVisitante } = require('../utils/mailer');

function generarOficio() {
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`;
  return `OF-${fecha}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

// GET /api/citas  (protegido)
exports.listar = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM citas ORDER BY creado_en DESC');
    res.json({ ok: true, total: rows.length, citas: rows.map(mapCita) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/citas/buscar?oficio=  (público)
exports.buscar = async (req, res) => {
  try {
    const { oficio } = req.query;
    if (!oficio) return res.status(400).json({ ok: false, error: 'Falta oficio.' });
    const [rows] = await pool.execute('SELECT * FROM citas WHERE oficio = ?', [oficio]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Cita no encontrada.' });
    res.json({ ok: true, cita: mapCita(rows[0]) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/citas  (público)
exports.crear = async (req, res) => {
  try {
    const {
      nombres, apPaterno, apMaterno, telefono, emailVisitante,
      area, fecha, hora, tipo, documentos,
      veh_placas, veh_marca, veh_modelo, veh_color
    } = req.body;

    if (!nombres || !apPaterno || !telefono || !area || !fecha || !hora)
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });

    const oficio = generarOficio();
    const token = crypto.randomBytes(32).toString('hex');
    const emailAnfitrion = await areasCtrl.getEmail(area);
    const id = Date.now();

    await pool.execute(
  'CALL sp_crear_cita(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [id, oficio, nombres, apPaterno, apMaterno || null,
   telefono, emailVisitante || null, area, emailAnfitrion || null,
   fecha, hora, tipo || 'visita',
   veh_placas || null, veh_marca || null, veh_modelo || null, veh_color || null,
   documentos ? JSON.stringify(documentos) : null, token]
   );

    const [rows] = await pool.execute('SELECT * FROM citas WHERE id = ?', [id]);
    const cita = mapCita(rows[0]);

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await enviarConfirmacionPendiente(cita);
      if (cita.emailAnfitrion) await enviarSolicitudAnfitrion(cita, baseUrl);
    } catch (e) {
      console.error('[MAILER]', e.message);
    }

    res.status(201).json({ ok: true, oficio, id });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

exports.aprobar = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM citas WHERE token_aprobacion = ?', [req.params.token]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Token inválido.' });
    const cita = rows[0];
    if (cita.estatus !== 'PENDIENTE')
      return res.json({ ok: true, mensaje: `La cita ya está en estatus: ${cita.estatus}` });

    await pool.execute(
      `UPDATE citas SET estatus = 'AGENDADA', token_aprobacion = NULL, actualizado_en = NOW() WHERE id = ?`,
      [cita.id]
    );

    const [updated] = await pool.execute('SELECT * FROM citas WHERE id = ?', [cita.id]);
    try { await enviarRespuestaVisitante(mapCita(updated[0]), 'aceptar'); } catch (e) {
      console.error('[MAILER]', e.message);
    }

    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Cita aprobada</title></head><body><script>window.close();</script><p>✅ Cita aprobada. Puedes cerrar esta ventana.</p></body></html>`);
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

exports.rechazar = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM citas WHERE token_aprobacion = ?', [req.params.token]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Token inválido.' });
    const cita = rows[0];
    if (cita.estatus !== 'PENDIENTE')
      return res.json({ ok: true, mensaje: `La cita ya está en estatus: ${cita.estatus}` });

    await pool.execute(
      `UPDATE citas SET estatus = 'RECHAZADA', token_aprobacion = NULL, actualizado_en = NOW() WHERE id = ?`,
      [cita.id]
    );

    const [updated] = await pool.execute('SELECT * FROM citas WHERE id = ?', [cita.id]);
    try { await enviarRespuestaVisitante(mapCita(updated[0]), 'rechazar'); } catch (e) {
      console.error('[MAILER]', e.message);
    }

    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Cita rechazada</title></head><body><script>window.close();</script><p>❌ Cita rechazada. Puedes cerrar esta ventana.</p></body></html>`);
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// PATCH /api/citas/:oficio/accion  (protegido)
exports.accion = async (req, res) => {
  try {
    const { accion } = req.body;
    if (!['ATENDIDA', 'CANCELADA'].includes(accion))
      return res.status(400).json({ ok: false, error: 'Acción no válida.' });

    const [rows] = await pool.execute('SELECT * FROM citas WHERE oficio = ?', [req.params.oficio]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Cita no encontrada.' });

    await pool.execute(
      `UPDATE citas SET estatus = ?, accion_por = ?, actualizado_en = NOW() WHERE oficio = ?`,
      [accion, req.usuario, req.params.oficio]
    );

    if (accion === 'CANCELADA') {
      const [updated] = await pool.execute('SELECT * FROM citas WHERE oficio = ?', [req.params.oficio]);
      try { await enviarCancelacionVisitante(mapCita(updated[0])); } catch (e) {
        console.error('[MAILER]', e.message);
      }
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

exports.porFecha = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.json({ ok: true, citas: [] });

    const hoy = new Date().toISOString().split('T')[0];
    const query = fecha === hoy
      ? 'SELECT oficio, estatus, hora FROM v_citas_hoy'
      : 'SELECT oficio, estatus, hora FROM citas WHERE fecha = ?';
    const params = fecha === hoy ? [] : [fecha];

    const [rows] = await pool.execute(query, params);
    res.json({ ok: true, citas: rows });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/citas/hoy  (protegido)
exports.hoy = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM v_citas_hoy');
    res.json({ ok: true, total: rows.length, citas: rows.map(mapCita) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// ── HELPER ──
function mapCita(row) {
  const parsear = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  };
  return {
    id: row.id,
    oficio: row.oficio,
    estatus: row.estatus,
    nombres: row.nombres,
    apPaterno: row.ap_paterno,
    apMaterno: row.ap_materno,
    telefono: row.telefono,
    emailVisitante: row.email_visitante,
    area: row.area,
    emailAnfitrion: row.email_anfitrion,
    fecha: row.fecha instanceof Date   ? row.fecha.toISOString().split('T')[0]   : row.fecha,
    hora: row.hora ? String(row.hora).slice(0, 5) : null,
    tipo: row.tipo,
    veh_placas: row.veh_placas,
    veh_marca: row.veh_marca,
    veh_modelo: row.veh_modelo,
    veh_color: row.veh_color,
    documentos: parsear(row.documentos) || [],
    docsCheck: parsear(row.docs_check) || [],
    tokenAprobacion: row.token_aprobacion,
    accionPor: row.accion_por,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}