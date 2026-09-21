// routes/reportes.js
const express     = require('express');
const router      = express.Router();
const PDFDocument = require('pdfkit');
const pool        = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// ── HELPERS ──────────────────────────────────────────────
function fmt(val) {
  if (!val) return '—';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

function filtrarFecha(lista, campo, desde, hasta) {
  return lista.filter(item => {
    const f = fmt(item[campo]);
    if (!f || f === '—') return false;
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });
}

function encabezado(doc, titulo, filtros) {
  doc.rect(0, 0, doc.page.width, 90).fill('#111111');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('VehiLog', 40, 25);
  doc.fontSize(11).font('Helvetica').text('SISSA Monitoring Integral S.A. de C.V.', 40, 50);
  doc.fontSize(14).font('Helvetica-Bold').text(titulo, doc.page.width - 290, 30, { width: 250, align: 'right' });
  const fecha = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  doc.fontSize(8).font('Helvetica').fillColor('#cccccc').text(`Generado: ${fecha}`, doc.page.width - 290, 55, { width: 250, align: 'right' });
  doc.rect(0, 90, doc.page.width, 28).fill('#f2f2f7');
  doc.fillColor('#555555').fontSize(8).font('Helvetica').text(filtros, 40, 100, { width: doc.page.width - 80 });
  doc.fillColor('#111111');
  doc.y = 130;
}

function tablaEncabezado(doc, cols, y) {
  doc.rect(40, y, doc.page.width - 80, 24).fill('#333333');
  let x = 40;
  cols.forEach(col => {
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(col.label, x + 4, y + 5, { width: col.w - 8 });
    x += col.w;
  });
  return y + 24;
}

function tablaFila(doc, cols, valores, y, par, tipo) {
  const h = 18;
  doc.rect(40, y, doc.page.width - 80, h).fill(par ? '#f9f9f9' : '#ffffff');
  let x = 40;
  cols.forEach((col, i) => {
    let color = '#222222';
    if (tipo === 'registros' && col.label === 'ESTATUS') {
      if (valores[i] === 'ACTIVO')    color = '#e8441a';
      if (valores[i] === 'COMPLETADO') color = '#34c759';
    }
    if (tipo === 'flotilla' && col.label === 'ESTATUS') {
      if (valores[i] === 'EN RUTA')    color = '#e8441a';
      if (valores[i] === 'COMPLETADO') color = '#34c759';
    }
    doc.fillColor(color).fontSize(7).font(color !== '#222222' ? 'Helvetica-Bold' : 'Helvetica')
       .text(String(valores[i] || '—'), x + 4, y + 5, { width: col.w - 8, ellipsis: true, lineBreak: false });
    x += col.w;
  });
  doc.strokeColor('#e0e0e0').lineWidth(0.3).rect(40, y, doc.page.width - 80, h).stroke();
  return y + h;
}

function pie(doc) {
  const bottom = doc.page.height - 35;
  doc.rect(0, bottom, doc.page.width, 35).fill('#111111');
  doc.fillColor('#888888').fontSize(7).font('Helvetica')
     .text('VehiLog · Sistema de Control Vehicular · Documento generado automáticamente', 40, bottom + 12, { width: doc.page.width - 80, align: 'center' });
}

// ══════════════════════════════════════
//  PREVIEWS
// ══════════════════════════════════════
router.get('/registros/preview', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, estatus, conVehiculo } = req.query;
    let [rows] = await pool.execute('SELECT * FROM registros ORDER BY fecha_entrada DESC');

    // Normalizar fechas
    rows = rows.map(r => ({ ...r, fechaEntrada: fmt(r.fecha_entrada), horaEntrada: r.hora_entrada ? String(r.hora_entrada).slice(0,5) : null, fechaSalida: fmt(r.fecha_salida), horaSalida: r.hora_salida ? String(r.hora_salida).slice(0,5) : null, nombreConductor: r.nombre_conductor, estatus: r.estatus, placas: r.placas, marca: r.marca, modelo: r.modelo, folio: r.folio }));

    if (desde || hasta) rows = filtrarFecha(rows, 'fechaEntrada', desde, hasta);
    if (estatus && estatus !== 'todos') rows = rows.filter(r => r.estatus === estatus);
    if (conVehiculo === 'si') rows = rows.filter(r => r.placas && r.placas !== 'N/A');
    if (conVehiculo === 'no') rows = rows.filter(r => !r.placas || r.placas === 'N/A');

    res.json({
      titulo: 'Reporte de Registros', total: rows.length,
      filtros: [desde || hasta ? `${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas', estatus && estatus !== 'todos' ? estatus : 'Todos los estatus', conVehiculo === 'si' ? 'Con vehículo' : conVehiculo === 'no' ? 'Sin vehículo' : 'Con y sin vehículo'].join(' · '),
      muestra: rows.slice(0, 5).map(r => `${r.folio} · ${r.nombreConductor} · ${r.fechaEntrada} · ${r.estatus}`)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/citas/preview', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, tipo } = req.query;
    let [rows] = await pool.execute('SELECT * FROM citas ORDER BY fecha DESC');
    rows = rows.map(r => ({ ...r, fecha: fmt(r.fecha) }));
    if (desde || hasta) rows = filtrarFecha(rows, 'fecha', desde, hasta);
    if (tipo && tipo !== 'todos') rows = rows.filter(c => c.tipo === tipo);
    res.json({
      titulo: 'Reporte de Citas', total: rows.length,
      filtros: [desde || hasta ? `${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas', tipo && tipo !== 'todos' ? tipo.toUpperCase() : 'Todos los tipos'].join(' · '),
      muestra: rows.slice(0, 5).map(c => `${c.oficio} · ${c.nombres} ${c.ap_paterno} · ${c.fecha} ${c.hora} · ${c.tipo}`)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/flotilla/preview', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, estatus } = req.query;
    let [rows] = await pool.execute('SELECT * FROM movimientos ORDER BY fecha_salida DESC');
    rows = rows.map(r => ({ ...r, fechaSalida: fmt(r.fecha_salida), horaSalida: r.hora_salida ? String(r.hora_salida).slice(0,5) : null, fechaEntrada: fmt(r.fecha_entrada), horaEntrada: r.hora_entrada ? String(r.hora_entrada).slice(0,5) : null }));
    if (desde || hasta) rows = filtrarFecha(rows, 'fechaSalida', desde, hasta);
    if (estatus === 'EN RUTA') rows = rows.filter(m => m.tipo === 'SALIDA');
    if (estatus === 'COMPLETADO') rows = rows.filter(m => m.tipo === 'COMPLETADO');
    res.json({
      titulo: 'Reporte de Flotilla', total: rows.length,
      filtros: [desde || hasta ? `${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas', estatus && estatus !== 'todos' ? estatus : 'Todos los estatus'].join(' · '),
      muestra: rows.slice(0, 5).map(m => `${m.placas} · ${m.conductor} · ${m.fechaSalida} · ${m.tipo === 'SALIDA' ? 'EN RUTA' : 'COMPLETADO'}`)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════
//  PDF REGISTROS
// ══════════════════════════════════════
router.get('/registros', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, estatus, conVehiculo } = req.query;
    let [rows] = await pool.execute('SELECT * FROM registros ORDER BY fecha_entrada DESC');
    rows = rows.map(r => ({
      folio: r.folio, nombreConductor: r.nombre_conductor, empresa: r.empresa,
      fechaEntrada: fmt(r.fecha_entrada), horaEntrada: r.hora_entrada ? String(r.hora_entrada).slice(0,5) : null,
      fechaSalida: fmt(r.fecha_salida), horaSalida: r.hora_salida ? String(r.hora_salida).slice(0,5) : null,
      placas: r.placas, marca: r.marca, modelo: r.modelo, estatus: r.estatus
    }));

    if (desde || hasta) rows = filtrarFecha(rows, 'fechaEntrada', desde, hasta);
    if (estatus && estatus !== 'todos') rows = rows.filter(r => r.estatus === estatus);
    if (conVehiculo === 'si') rows = rows.filter(r => r.placas && r.placas !== 'N/A');
    if (conVehiculo === 'no') rows = rows.filter(r => !r.placas || r.placas === 'N/A');

    const filtroTexto = [
      desde || hasta ? `Fechas: ${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas',
      estatus && estatus !== 'todos' ? `Estatus: ${estatus}` : 'Todos los estatus',
      conVehiculo === 'si' ? 'Con vehículo' : conVehiculo === 'no' ? 'Sin vehículo' : 'Con y sin vehículo',
      `Total registros: ${rows.length}`
    ].join('   ·   ');

    const doc = new PDFDocument({ margin: 0, size: 'LETTER', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-registros-${Date.now()}.pdf"`);
    doc.pipe(res);
    encabezado(doc, 'Reporte de Registros', filtroTexto);

    const cols = [
      { label: 'FOLIO', w: 70 }, { label: 'NOMBRE', w: 115 }, { label: 'EMPRESA', w: 80 },
      { label: 'FECHA ENTRADA', w: 65 }, { label: 'HORA ENTRADA', w: 50 },
      { label: 'PLACAS', w: 65 }, { label: 'VEHÍCULO', w: 90 },
      { label: 'FECHA SALIDA', w: 65 }, { label: 'HORA SALIDA', w: 50 }, { label: 'ESTATUS', w: 65 },
    ];
    let y = tablaEncabezado(doc, cols, doc.y);
    rows.forEach((r, i) => {
      if (y > doc.page.height - 60) { pie(doc); doc.addPage(); encabezado(doc, 'Reporte de Registros (cont.)', filtroTexto); y = tablaEncabezado(doc, cols, doc.y); }
      const veh = r.placas && r.placas !== 'N/A' ? `${r.marca||''} ${r.modelo||''}`.trim() : '--';//TODO aqui esta lo del a pie del reporte, se quito y se puso un guion, si se quiere poner un guion largo poner '—'
      y = tablaFila(doc, cols, [r.folio, r.nombreConductor, r.empresa, r.fechaEntrada, r.horaEntrada, r.placas !== 'N/A' ? r.placas : '—', veh, r.fechaSalida||'—', r.horaSalida||'—', r.estatus], y, i % 2 === 0, 'registros');
    });
    pie(doc); doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════
//  PDF CITAS
// ══════════════════════════════════════
router.get('/citas', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, tipo } = req.query;
    let [rows] = await pool.execute('SELECT * FROM citas ORDER BY fecha DESC');
    rows = rows.map(r => ({
      oficio: r.oficio, nombres: r.nombres, apPaterno: r.ap_paterno, apMaterno: r.ap_materno,
      area: r.area, telefono: r.telefono, fecha: fmt(r.fecha), hora: r.hora,
      tipo: r.tipo, veh_placas: r.veh_placas, veh_marca: r.veh_marca, veh_modelo: r.veh_modelo, estatus: r.estatus
    }));

    if (desde || hasta) rows = filtrarFecha(rows, 'fecha', desde, hasta);
    if (tipo && tipo !== 'todos') rows = rows.filter(c => c.tipo === tipo);

    const filtroTexto = [
      desde || hasta ? `Fechas: ${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas',
      tipo && tipo !== 'todos' ? `Tipo: ${tipo}` : 'Todos los tipos',
      `Total citas: ${rows.length}`
    ].join('   ·   ');

    const doc = new PDFDocument({ margin: 0, size: 'LETTER', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-citas-${Date.now()}.pdf"`);
    doc.pipe(res);
    encabezado(doc, 'Reporte de Citas', filtroTexto);

    const cols = [
      { label: 'OFICIO', w: 80 }, { label: 'NOMBRE', w: 130 }, { label: 'ÁREA', w: 90 },
      { label: 'TELÉFONO', w: 70 }, { label: 'FECHA', w: 65 }, { label: 'HORA', w: 45 },
      { label: 'TIPO', w: 55 }, { label: 'PLACAS', w: 65 }, { label: 'VEHÍCULO', w: 90 },
    ];
    let y = tablaEncabezado(doc, cols, doc.y);
    rows.forEach((c, i) => {
      if (y > doc.page.height - 60) { pie(doc); doc.addPage(); encabezado(doc, 'Reporte de Citas (cont.)', filtroTexto); y = tablaEncabezado(doc, cols, doc.y); }
      const veh = c.veh_placas ? `${c.veh_marca||''} ${c.veh_modelo||''}`.trim() : '—';
      y = tablaFila(doc, cols, [c.oficio, `${c.nombres} ${c.apPaterno} ${c.apMaterno||''}`.trim(), c.area, c.telefono, c.fecha, c.hora, c.tipo?.toUpperCase(), c.veh_placas||'—', veh], y, i % 2 === 0, 'citas');
    });
    pie(doc); doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════
//  PDF FLOTILLA
// ══════════════════════════════════════
router.get('/flotilla', requireAuth, async (req, res) => {
  try {
    const { desde, hasta, estatus } = req.query;
    let [rows] = await pool.execute('SELECT * FROM movimientos ORDER BY fecha_salida DESC');
    rows = rows.map(r => ({
      placas: r.placas, conductor: r.conductor, destino: r.destino,
      fechaSalida: fmt(r.fecha_salida), horaSalida: r.hora_salida ? String(r.hora_salida).slice(0,5) : null,
      fechaEntrada: fmt(r.fecha_entrada), horaEntrada: r.hora_entrada ? String(r.hora_entrada).slice(0,5) : null,
      tipo: r.tipo, observaciones: r.observaciones
    }));

    if (desde || hasta) rows = filtrarFecha(rows, 'fechaSalida', desde, hasta);
    if (estatus === 'EN RUTA') rows = rows.filter(m => m.tipo === 'SALIDA');
    if (estatus === 'COMPLETADO') rows = rows.filter(m => m.tipo === 'COMPLETADO');

    const filtroTexto = [
      desde || hasta ? `Fechas: ${desde||'—'} al ${hasta||'—'}` : 'Todas las fechas',
      estatus && estatus !== 'todos' ? `Estatus: ${estatus}` : 'Todos los estatus',
      `Total movimientos: ${rows.length}`
    ].join('   ·   ');

    const doc = new PDFDocument({ margin: 0, size: 'LETTER', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-flotilla-${Date.now()}.pdf"`);
    doc.pipe(res);
    encabezado(doc, 'Reporte de Flotilla', filtroTexto);

    const cols = [
      { label: 'PLACAS', w: 70 }, { label: 'CONDUCTOR', w: 130 }, { label: 'DESTINO', w: 100 },
      { label: 'FECHA SALIDA', w: 65 }, { label: 'HORA. SALIDA', w: 50 },
      { label: 'FECHA ENTRADA', w: 65 }, { label: 'HORA. ENTRADA', w: 50 },
      { label: 'ESTATUS', w: 70 }, { label: 'OBSERVACIONES', w: 90 },
    ];
    let y = tablaEncabezado(doc, cols, doc.y);
    rows.forEach((m, i) => {
      if (y > doc.page.height - 60) { pie(doc); doc.addPage(); encabezado(doc, 'Reporte de Flotilla (cont.)', filtroTexto); y = tablaEncabezado(doc, cols, doc.y); }
      y = tablaFila(doc, cols, [m.placas, m.conductor, m.destino||'—', m.fechaSalida, m.horaSalida||'—', m.fechaEntrada||'—', m.horaEntrada||'—', m.tipo === 'SALIDA' ? 'EN RUTA' : 'COMPLETADO', m.observaciones||'—'], y, i % 2 === 0, 'flotilla');
    });
    pie(doc); doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;