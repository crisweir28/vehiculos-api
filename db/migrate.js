// db/migrate.js
// Uso: node db/migrate.js

const pool = require('./connection');
const fs   = require('fs');
const path = require('path');

function leer(nombre) {
  const p = path.join(__dirname, '../data', nombre);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

async function migrar() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── USUARIOS ──────────────────────────────────────
    // Problema: test4 y admin1 tienen el mismo id (1781886674063)
    // Solución: usar INSERT IGNORE pero para el duplicado asignar un id nuevo
    const usuarios = leer('usuarios.json') || [];
    const idsUsados = new Set();
    for (const u of usuarios) {
      let id = u.id;
      // Si el id ya fue usado en esta sesión, generar uno nuevo
      if (idsUsados.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
        console.log(`[migrate] ID duplicado para ${u.usuario}, asignando nuevo id: ${id}`);
      }
      idsUsados.add(id);

      await conn.execute(
        `INSERT INTO usuarios (id, usuario, password, rol, email, creado_en)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           password = VALUES(password),
           rol      = VALUES(rol),
           email    = VALUES(email)`,
        [id, u.usuario, u.password, u.rol, u.email || null,
         u.creadoEn ? new Date(u.creadoEn) : new Date()]
      );
    }
    console.log(`[migrate] usuarios: ${usuarios.length}`);

    // ── SESIONES ──────────────────────────────────────
    const sesiones = leer('sesiones.json') || {};
    for (const [token, s] of Object.entries(sesiones)) {
      await conn.execute(
        `INSERT IGNORE INTO sesiones (token, usuario, rol, creada_en)
         VALUES (?, ?, ?, ?)`,
        [token, s.usuario, s.rol, s.creadaEn]
      );
    }
    console.log(`[migrate] sesiones: ${Object.keys(sesiones).length}`);

    // ── ÁREAS ─────────────────────────────────────────
    const areas = leer('areas.json') || [];
    for (const a of areas) {
      await conn.execute(
        `INSERT INTO areas (id, nombre, email) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), email = VALUES(email)`,
        [a.id, a.nombre, a.email]
      );
    }
    console.log(`[migrate] areas: ${areas.length}`);

    // ── CONFIG ────────────────────────────────────────
    const cfg = leer('config.json');
    if (cfg) {
      await conn.execute(
        `INSERT INTO config (id, empresa, app_nombre, fuente, tamano,
           color_bg, color_surface, color_accent, color_text, color_header, logo, logo_size)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           empresa=VALUES(empresa), app_nombre=VALUES(app_nombre),
           fuente=VALUES(fuente), tamano=VALUES(tamano),
           color_bg=VALUES(color_bg), color_surface=VALUES(color_surface),
           color_accent=VALUES(color_accent), color_text=VALUES(color_text),
           color_header=VALUES(color_header), logo=VALUES(logo),
           logo_size=VALUES(logo_size)`,
        [cfg.empresa, cfg.appNombre, cfg.fuente, cfg.tamano,
         cfg.colorBg, cfg.colorSurface, cfg.colorAccent,
         cfg.colorText, cfg.colorHeader, cfg.logo || null, cfg.logoSize || 120]
      );
      console.log('[migrate] config: OK');
    }

    // ── VEHÍCULOS ─────────────────────────────────────
    const vehiculos = leer('vehiculos.json') || [];
    for (const v of vehiculos) {
      await conn.execute(
        `INSERT INTO vehiculos
           (id, placas, marca, modelo, color, anio, num_econ, estatus,
            conductor_actual, movimiento_id, creado_en, creado_por,
            mantenimiento, mantenimientos, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           estatus          = VALUES(estatus),
           conductor_actual = VALUES(conductor_actual),
           movimiento_id    = VALUES(movimiento_id),
           mantenimiento    = VALUES(mantenimiento),
           mantenimientos   = VALUES(mantenimientos),
           actualizado_en   = VALUES(actualizado_en)`,
        [v.id, v.placas, v.marca, v.modelo, v.color,
         v.anio || null, v.numEcon || null, v.estatus,
         v.conductorActual || null, v.movimientoId || null,
         v.creadoEn ? new Date(v.creadoEn) : new Date(),
         v.creadoPor || null,
         v.mantenimiento  ? JSON.stringify(v.mantenimiento)  : null,
         v.mantenimientos ? JSON.stringify(v.mantenimientos) : null,
         v.actualizadoEn  ? new Date(v.actualizadoEn) : null]
      );
    }
    console.log(`[migrate] vehiculos: ${vehiculos.length}`);

    // ── MOVIMIENTOS ───────────────────────────────────
    const movimientos = leer('movimientos.json') || [];
    for (const m of movimientos) {
      await conn.execute(
        `INSERT INTO movimientos
           (id, vehiculo_id, placas, tipo, conductor, destino,
            fecha_salida, hora_salida, fecha_entrada, hora_entrada,
            observaciones, registrado_por, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           tipo         = VALUES(tipo),
           fecha_entrada = VALUES(fecha_entrada),
           hora_entrada  = VALUES(hora_entrada),
           observaciones = VALUES(observaciones)`,
        [m.id, m.vehiculoId, m.placas, m.tipo, m.conductor,
         m.destino || null,
         m.fechaSalida || null, m.horaSalida || null,
         m.fechaEntrada || null, m.horaEntrada || null,
         m.observaciones || null, m.registradoPor || null,
         m.creadoEn ? new Date(m.creadoEn) : new Date()]
      );
    }
    console.log(`[migrate] movimientos: ${movimientos.length}`);

    // ── CITAS ─────────────────────────────────────────
    const citas = leer('citas.json') || [];
    for (const c of citas) {
      await conn.execute(
        `INSERT INTO citas
           (id, oficio, estatus, nombres, ap_paterno, ap_materno,
            telefono, email_visitante, area, email_anfitrion,
            fecha, hora, tipo, veh_placas, veh_marca, veh_modelo, veh_color,
            docs_check, documentos, token_aprobacion, accion_por,
            creado_en, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           estatus       = VALUES(estatus),
           accion_por    = VALUES(accion_por),
           actualizado_en = VALUES(actualizado_en)`,
        [c.id, c.oficio, c.estatus, c.nombres, c.apPaterno, c.apMaterno || null,
        (c.telefono || '').toString().slice(0, 50), c.emailVisitante || null, c.area, c.emailAnfitrion || null,
         c.fecha, c.hora, c.tipo || 'visita',
         c.veh_placas || null, c.veh_marca || null,
         c.veh_modelo || null, c.veh_color || null,
         c.docsCheck   ? JSON.stringify(c.docsCheck)   : null,
         c.documentos  ? JSON.stringify(c.documentos)  : null,
         c.tokenAprobacion || null, c.accionPor || null,
         c.creadoEn    ? new Date(c.creadoEn)    : new Date(),
         c.actualizadoEn ? new Date(c.actualizadoEn) : null]
      );
    }
    console.log(`[migrate] citas: ${citas.length}`);

    // ── REGISTROS ─────────────────────────────────────
    const registros = leer('registros.json') || [];
    for (const r of registros) {
      await conn.execute(
        `INSERT INTO registros
           (folio, fecha_entrada, hora_entrada, fecha_salida, hora_salida,
            tipo_movimiento, nombre_conductor, empresa, telefono,
            placas, marca, modelo, color, oficio_cita,
            docs_verificados, observaciones, observaciones_salida,
            estatus, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           fecha_salida        = VALUES(fecha_salida),
           hora_salida         = VALUES(hora_salida),
           observaciones_salida = VALUES(observaciones_salida),
           estatus             = VALUES(estatus)`,
        [r.folio, r.fechaEntrada, r.horaEntrada,
         r.fechaSalida || null, r.horaSalida || null,
         r.tipoMovimiento || 'ENTRADA',
         r.nombreConductor, r.empresa || null, r.telefono || null,
         r.placas || null, r.marca || null, r.modelo || null, r.color || null,
         r.oficioCita || null,
         r.docsVerificados ? JSON.stringify(r.docsVerificados) : null,
         r.observaciones || null, r.observacionesSalida || null,
         (r.estatus === 'CERRADO' ? 'COMPLETADO' : r.estatus) || 'ACTIVO',
         r.creadoEn ? new Date(r.creadoEn) : new Date()]
      );
    }
    console.log(`[migrate] registros: ${registros.length}`);

    await conn.commit();
    console.log('\n✅ Migración completada exitosamente.');
  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Error en migración:', err.message);
    console.error(err);
  } finally {
    conn.release();
    pool.end();
  }
}

migrar();