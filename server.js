const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3300;

// ── CACHÉ — evitar que el navegador guarde páginas HTML ──
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ── MIDDLEWARES ──
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── MIDDLEWARE AUTH ──
const { requireAuth } = require('./middleware/auth');

// ── RUTAS API ──
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/usuarios',  require('./routes/usuarios'));
app.use('/api/registros', require('./routes/registros'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/vehiculos', require('./routes/vehiculos'));
app.use('/api/reportes',  require('./routes/reportes'));
app.use('/api/config',    require('./routes/config'));
app.use('/api/areas', require('./routes/areas'));

// GET /api/movimientos
const pool = require('./db/connection');
app.get('/api/movimientos', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM movimientos ORDER BY creado_en DESC');
    const movimientos = rows.map(m => ({
      id:            m.id,
      vehiculoId:    m.vehiculo_id,
      placas:        m.placas,
      tipo:          m.tipo,
      conductor:     m.conductor,
      destino:       m.destino,
      fechaSalida:   m.fecha_salida instanceof Date ? m.fecha_salida.toISOString().split('T')[0] : m.fecha_salida,
      horaSalida:    m.hora_salida  ? String(m.hora_salida).slice(0, 5)  : null,
      fechaEntrada:  m.fecha_entrada instanceof Date ? m.fecha_entrada.toISOString().split('T')[0] : m.fecha_entrada,
      horaEntrada:   m.hora_entrada ? String(m.hora_entrada).slice(0, 5) : null,
      observaciones: m.observaciones,
      registradoPor: m.registrado_por,
      creadoEn:      m.creado_en,
    }));
    res.json({ ok: true, total: movimientos.length, movimientos });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── FALLBACK ──
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'acceso.html'));
});

// ── ERRORES GLOBALES ──
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ ok: false, error: err.message });
});

// ── INICIO ──
process.stdin.resume();
process.on('uncaughtException', err => console.error('Error inesperado:', err.message));

const os = require('os');
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}
// ── JOB: LIMPIAR CITAS CADUCADAS ──
const limpiarCitasCaducadas = require('./jobs/limpiarCitas');
 
// Correr al iniciar
limpiarCitasCaducadas();
 
// Correr cada 24 horas (86400000 ms)
setInterval(limpiarCitasCaducadas, 24 * 60 * 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════════╗');
  console.log('  ║   VehiLog — Servidor iniciado                          ║');
  console.log(`  ║   Local:  http://localhost:${PORT}                        ║`);
  console.log(`  ║   Red:    http://${ip}:${PORT}                    ║`);
  console.log('  ╠════════════════════════════════════════════════════════╣');
  console.log(`  ║   Login:  http://${ip}:${PORT}/login.html         ║`);
  console.log(`  ║   Citas:  http://${ip}:${PORT}/citas/agenda.html  ║`);
  console.log('  ╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Presiona Ctrl+C para detener.');
  console.log('');
}).on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ERROR: Puerto ${PORT} en uso.\n`);
  } else {
    console.error('Error al iniciar:', err.message);
  }
  process.exit(1);
});