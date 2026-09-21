// controllers/vehiculosController.js
const pool = require('../db/connection');

// GET /api/vehiculos
exports.listar = async (req, res) => {
  try {
    console.log('[VEHICULOS] consultando...');
    const [rows] = await pool.execute('SELECT * FROM v_resumen_flotilla');
    const vehiculos = rows.map(mapVehiculo);
    res.json({ ok: true, total: vehiculos.length, vehiculos });
  } catch (err) {
    console.error('[VEHICULOS ERROR]', err.message, err.stack);
    res.status(500).json({ ok: false, error: err.message });
  }
};
// GET /api/vehiculos/:id
exports.obtener = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    res.json({ ok: true, vehiculo: mapVehiculo(rows[0]) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/vehiculos
exports.crear = async (req, res) => {
  try {
    const { placas, marca, modelo, color, anio, numEcon } = req.body;
    if (!placas || !marca || !modelo || !color)
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos.' });

    const [exists] = await pool.execute('SELECT id FROM vehiculos WHERE placas = ?', [placas.toUpperCase()]);
    if (exists.length)
      return res.status(409).json({ ok: false, error: `Las placas ${placas} ya están registradas.` });

    const id = Date.now();
    await pool.execute(
      'CALL sp_crear_vehiculo(?, ?, ?, ?, ?, ?, ?, ?)',
      [id, placas.toUpperCase(), marca, modelo, color, anio || null, numEcon || null, req.usuario]
    );
    console.log(`[VEHÍCULO] Alta: ${placas} | ${marca} ${modelo} | por ${req.usuario}`);
    res.status(201).json({ ok: true, id, placas: placas.toUpperCase() });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// DELETE /api/vehiculos/:id
exports.eliminar = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    if (rows[0].estatus === 'EN RUTA')
      return res.status(409).json({ ok: false, error: 'No puedes eliminar un vehículo en ruta.' });
    if (rows[0].estatus === 'MANTENIMIENTO')
      return res.status(409).json({ ok: false, error: 'No puedes eliminar un vehículo en mantenimiento.' });

    await pool.execute('DELETE FROM vehiculos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/vehiculos/:id/movimientos
exports.historial = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM movimientos WHERE vehiculo_id = ? ORDER BY creado_en DESC',
      [req.params.id]
    );
    res.json({ ok: true, total: rows.length, movimientos: rows.map(mapMovimiento) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/movimientos
exports.listarMovimientos = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM movimientos ORDER BY creado_en DESC');
    res.json({ ok: true, total: rows.length, movimientos: rows.map(mapMovimiento) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/vehiculos/:id/salida
exports.registrarSalida = async (req, res) => {
  try {
    const { conductor, destino, horaSalida, fechaSalida, observaciones } = req.body;
    if (!conductor || !horaSalida || !fechaSalida)
      return res.status(400).json({ ok: false, error: 'Faltan: conductor, fechaSalida, horaSalida.' });

    const [vRows] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!vRows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    if (vRows[0].estatus === 'EN RUTA')
      return res.status(409).json({ ok: false, error: 'El vehículo ya está en ruta.' });

    const id = Date.now();
    await pool.execute(
      'CALL sp_registrar_salida_vehiculo(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, vRows[0].id, vRows[0].placas, conductor, destino || null,
        fechaSalida, horaSalida, observaciones || null, req.usuario]
    );

    console.log(`[SALIDA CORP] ${vRows[0].placas} | ${conductor}`);
    res.status(201).json({ ok: true, movimientoId: id });
  } catch (err) { 
    console.error('[SALIDA CORP ERROR]', err.message, err.sqlMessage);
    res.status(500).json({ ok: false, error: err.message }); 
  }
};

// POST /api/vehiculos/:id/entrada
exports.registrarEntrada = async (req, res) => {
  try {
    const { horaEntrada, fechaEntrada, observaciones } = req.body;
    if (!horaEntrada || !fechaEntrada)
      return res.status(400).json({ ok: false, error: 'Faltan: fechaEntrada, horaEntrada.' });

    const [vRows] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!vRows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    if (vRows[0].estatus !== 'EN RUTA')
      return res.status(409).json({ ok: false, error: 'El vehículo no está en ruta.' });

    await pool.execute(
      'CALL sp_registrar_entrada_vehiculo(?, ?, ?, ?, ?)',
      [req.params.id, vRows[0].movimiento_id, fechaEntrada, horaEntrada, observaciones || null]
    );

    console.log(`[ENTRADA CORP] ${vRows[0].placas} | ${fechaEntrada} ${horaEntrada}`);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// PATCH /api/vehiculos/:id/estatus
exports.cambiarEstatus = async (req, res) => {
  try {
    const { estatus, razon } = req.body;
    if (!['DISPONIBLE', 'MANTENIMIENTO'].includes(estatus))
      return res.status(400).json({ ok: false, error: 'Estatus no válido.' });

    const [vRows] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!vRows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    if (vRows[0].estatus === 'EN RUTA')
      return res.status(409).json({ ok: false, error: 'No se puede cambiar mientras está en ruta.' });

    await pool.execute(
      'CALL sp_cambiar_estatus_vehiculo(?, ?, ?, ?)',
      [req.params.id, estatus, razon || null, req.usuario]
    );

    const [updated] = await pool.execute('SELECT * FROM vehiculos WHERE id = ?', [req.params.id]);
    res.json({ ok: true, vehiculo: mapVehiculo(updated[0]) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// GET /api/vehiculos/:id/mantenimientos
exports.historialMantenimientos = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT mantenimientos FROM vehiculos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Vehículo no encontrado.' });
    const lista = rows[0].mantenimientos ? JSON.parse(rows[0].mantenimientos) : [];
    res.json({ ok: true, mantenimientos: lista });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// ── HELPERS ──
function mapVehiculo(row) {
  const parsear = (val) => {
    if (!val) return null;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch { return null; } }
    return val;
  };
  return {
    id: row.id,
    placas: row.placas,
    marca: row.marca,
    modelo: row.modelo,
    color: row.color,
    anio: row.anio,
    numEcon: row.num_econ,
    estatus: row.estatus,
    conductorActual: row.conductor_actual,
    movimientoId: row.movimiento_id,
    creadoEn: row.creado_en,
    creadoPor: row.creado_por,
    actualizadoEn: row.actualizado_en,
    mantenimiento: parsear(row.mantenimiento),
    mantenimientos: parsear(row.mantenimientos) || [],
  };
}

function mapMovimiento(row) {
  return {
    id: row.id,
    vehiculoId: row.vehiculo_id,
    placas: row.placas,
    tipo: row.tipo,
    conductor: row.conductor,
    destino: row.destino,
    fechaSalida: row.fecha_salida,
    horaSalida: row.hora_salida,
    fechaEntrada: row.fecha_entrada,
    horaEntrada: row.hora_entrada,
    observaciones: row.observaciones,
    registradoPor: row.registrado_por,
    creadoEn: row.creado_en,
  };
}