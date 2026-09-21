// utils/mailer.js
const nodemailer = require('nodemailer');

// ── CONFIGURAR TRANSPORTE ─────────────────────────────────
// Pon tus credenciales aquí o en variables de entorno
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'lazcano.cristobal28@gmail.com',
    pass: process.env.MAIL_PASS || 'qifcufcehjmaoziu',
  }
});

// ── GENERAR ARCHIVO .ICS ──────────────────────────────────
function generarICS(cita) {
  const fechaStr = (cita.fecha instanceof Date   ? cita.fecha.toISOString().split('T')[0]   : cita.fecha).replace(/-/g, '');
  const horaStr = cita.hora.replace(':', '') + '00';
  // Sumar 1 hora para hora fin
  const [h, m] = cita.hora.split(':').map(Number);
  const horaFin = `${String(h + 1).padStart(2, '0')}${String(m).padStart(2, '0')}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VehiLog//SISSA//ES',
    'BEGIN:VEVENT',
    `UID:${cita.oficio}@vehilog.sissa`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${fechaStr}T${horaStr}`,
    `DTEND:${fechaStr}T${horaFin}`,
    `SUMMARY:Visita - ${cita.nombres} ${cita.apPaterno}`,
    `DESCRIPTION:Oficio: ${cita.oficio}\\nVisitante: ${cita.nombres} ${cita.apPaterno}\\nÁrea: ${cita.area}\\nTeléfono: ${cita.telefono}`,
    `LOCATION:SISSA Monitoring Integral S.A. de C.V.`,
    'STATUS:TENTATIVE',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de visita',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// ── CORREO AL ANFITRIÓN (pedir aprobación) ────────────────
async function enviarSolicitudAnfitrion(cita, baseUrl) {
  const urlAceptar  = `${baseUrl}/api/citas/aprobar/${cita.tokenAprobacion}`;
  const urlRechazar = `${baseUrl}/api/citas/rechazar/${cita.tokenAprobacion}`;
  const ics = generarICS(cita);

  const html = `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f2f2f7;padding:24px;">
    <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">VehiLog</h1>
      <p style="color:#aaa;font-size:13px;margin:4px 0 0;">SISSA Monitoring Integral S.A. de C.V.</p>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:28px;">
      <h2 style="font-size:18px;color:#111;margin:0 0 8px;">Solicitud de visita pendiente</h2>
      <p style="color:#555;font-size:14px;margin:0 0 20px;">Tienes una solicitud de visita que requiere tu aprobación.</p>

      <div style="background:#f9f9f9;border:1px solid #e0e0e5;border-radius:10px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="color:#888;padding:4px 0;width:140px;">Oficio</td><td><strong>${cita.oficio}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Visitante</td><td><strong>${cita.nombres} ${cita.apPaterno} ${cita.apMaterno || ''}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Teléfono</td><td>${cita.telefono}</td></tr>
          <tr><td style="color:#888;padding:4px 0;">Área</td><td>${cita.area}</td></tr>
          <tr><td style="color:#888;padding:4px 0;">Fecha</td><td><strong>${cita.fecha}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Hora</td><td><strong>${cita.hora} hrs</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Tipo</td><td>${cita.tipo === 'vehiculo' ? '🚗 Con vehículo' : '🚶 Visita'}</td></tr>
          ${cita.veh_placas ? `<tr><td style="color:#888;padding:4px 0;">Placas</td><td>${cita.veh_placas} · ${cita.veh_marca} ${cita.veh_modelo}</td></tr>` : ''}
          ${(cita.documentos || []).length ? `<tr><td style="color:#888;padding:4px 0;">Documentos</td><td>${cita.documentos.join(', ')}</td></tr>` : ''}
        </table>
      </div>

      <p style="color:#555;font-size:13px;margin:0 0 16px;">¿Apruebas esta visita?</p>

      <div style="display:flex;gap:12px;">
        <a href="${urlAceptar}" style="display:inline-block;background:#34c759;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">✓ Aceptar visita</a>
        <a href="${urlRechazar}" style="display:inline-block;background:#e8441a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">✕ Rechazar</a>
      </div>

      <p style="color:#aaa;font-size:11px;margin:20px 0 0;">Se adjunta un archivo .ics para agregar esta visita a tu calendario si decides aceptarla.</p>
    </div>
    <p style="color:#aaa;font-size:11px;text-align:center;margin:16px 0 0;">VehiLog · Sistema de Control Vehicular</p>
  </div>`;

  await transporter.sendMail({
    from: `"VehiLog SISSA" <${process.env.MAIL_USER || 'lazcano.cristobal28@gmail.com'}>`,
    to: cita.emailAnfitrion,
    subject: `[VehiLog] Solicitud de visita — ${cita.nombres} ${cita.apPaterno} · ${cita.fecha}`,
    html,
    attachments: [{
      filename: 'visita.ics',
      content: ics,
      contentType: 'text/calendar'
    }]
  });
}

// ── CORREO AL VISITANTE (confirmación o rechazo) ──────────
async function enviarRespuestaVisitante(cita, accion) {
  const aceptada = accion === 'aceptar';

  const html = `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f2f2f7;padding:24px;">
    <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">VehiLog</h1>
      <p style="color:#aaa;font-size:13px;margin:4px 0 0;">SISSA Monitoring Integral S.A. de C.V.</p>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:28px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;">${aceptada ? '✅' : '❌'}</div>
        <h2 style="font-size:20px;color:${aceptada ? '#34c759' : '#e8441a'};margin:8px 0;">
          Tu visita fue ${aceptada ? 'aprobada' : 'rechazada'}
        </h2>
      </div>

      <div style="background:#f9f9f9;border:1px solid #e0e0e5;border-radius:10px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="color:#888;padding:4px 0;width:140px;">Oficio</td><td><strong>${cita.oficio}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Fecha</td><td><strong>${cita.fecha}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Hora</td><td><strong>${cita.hora} hrs</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Área</td><td>${cita.area}</td></tr>
        </table>
      </div>

      ${aceptada
      ? `<p style="color:#555;font-size:14px;margin-bottom:20px;">Tu visita ha sido confirmada. Preséntate el día indicado con tu identificación oficial.</p>
   <div style="text-align:center;background:#f9f9f9;border:1px solid #e0e0e5;border-radius:10px;padding:20px;margin-bottom:16px;">
     <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Número de Oficio</div>
     <div style="font-size:1.3rem;font-weight:700;letter-spacing:2px;color:#111;margin-bottom:16px;">${cita.oficio}</div>
     <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Código QR</div>
     <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${cita.oficio}|${cita.nombres} ${cita.apPaterno}|${cita.fecha} ${cita.hora}|${cita.area}`)}" width="180" height="180" style="border-radius:8px;display:block;margin:0 auto;"/>
     <div style="font-size:0.75rem;color:#888;margin-top:8px;">Presenta este QR en la caseta de entrada</div>
   </div>`
      : `<p style="color:#555;font-size:14px;">Lo sentimos, tu solicitud de visita no fue aprobada. Si tienes dudas, comunícate directamente con el área de ${cita.area}.</p>`
    }
    </div>
    <p style="color:#aaa;font-size:11px;text-align:center;margin:16px 0 0;">VehiLog · Sistema de Control Vehicular</p>
  </div>`;

  await transporter.sendMail({
    from: `"VehiLog SISSA" <${process.env.MAIL_USER || 'lazcano.cristobal28@gmail.com'}>`,
    to: cita.emailVisitante,
    subject: `[VehiLog] Tu visita fue ${aceptada ? 'aprobada ✅' : 'rechazada ❌'} — ${cita.oficio}`,
    html
  });
}

// ── CORREO AL VISITANTE (cita recibida, pendiente de aprobación) ──
async function enviarConfirmacionPendiente(cita) {
  const html = `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f2f2f7;padding:24px;">
    <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">VehiLog</h1>
      <p style="color:#aaa;font-size:13px;margin:4px 0 0;">SISSA Monitoring Integral S.A. de C.V.</p>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:28px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;">⏳</div>
        <h2 style="font-size:20px;color:#111;margin:8px 0;">Solicitud recibida</h2>
        <p style="color:#555;font-size:14px;">Tu solicitud de visita fue enviada al área de <strong>${cita.area}</strong>. Te notificaremos cuando sea confirmada o rechazada.</p>
      </div>
      <div style="background:#f9f9f9;border:1px solid #e0e0e5;border-radius:10px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="color:#888;padding:4px 0;width:140px;">Oficio</td><td><strong>${cita.oficio}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Fecha</td><td><strong>${cita.fecha}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Hora</td><td><strong>${cita.hora} hrs</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Área</td><td>${cita.area}</td></tr>
        </table>
      </div>
      <p style="color:#aaa;font-size:12px;">Guarda tu número de oficio <strong>${cita.oficio}</strong> — lo necesitarás al presentarte.</p>
    </div>
    <p style="color:#aaa;font-size:11px;text-align:center;margin:16px 0 0;">VehiLog · Sistema de Control Vehicular</p>
  </div>`;

  await transporter.sendMail({
    from: `"VehiLog SISSA" <${process.env.MAIL_USER || 'lazcano.cristobal28@gmail.com'}>`,
    to: cita.emailVisitante,
    subject: `[VehiLog] Solicitud recibida ⏳ — ${cita.oficio}`,
    html
  });
}

async function enviarCancelacionVisitante(cita) {
  const html = `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f2f2f7;padding:24px;">
    <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px;">
      <h1 style="color:#fff;font-size:22px;margin:0;">VehiLog</h1>
      <p style="color:#aaa;font-size:13px;margin:4px 0 0;">SISSA Monitoring Integral S.A. de C.V.</p>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:28px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;">⚠️</div>
        <h2 style="font-size:20px;color:#e8441a;margin:8px 0;">Cita cancelada por inasistencia</h2>
        <p style="color:#555;font-size:14px;margin:0;">
          Tu cita fue cancelada porque no se registró tu llegada en el tiempo establecido.
        </p>
      </div>
      <div style="background:#f9f9f9;border:1px solid #e0e0e5;border-radius:10px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:13px;color:#333;">
          <tr><td style="color:#888;padding:4px 0;width:140px;">Oficio</td><td><strong>${cita.oficio}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Visitante</td><td><strong>${cita.nombres} ${cita.apPaterno} ${cita.apMaterno || ''}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Fecha</td><td><strong>${cita.fecha}</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Hora</td><td><strong>${cita.hora} hrs</strong></td></tr>
          <tr><td style="color:#888;padding:4px 0;">Área</td><td>${cita.area}</td></tr>
        </table>
      </div>
      <div style="background:#fff5f3;border:1px solid rgba(232,68,26,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="color:#e8441a;font-size:14px;font-weight:700;margin:0 0 8px;">¿Deseas reagendar tu visita?</p>
        <p style="color:#555;font-size:13px;margin:0;">
          Si necesitas visitar nuestras instalaciones, por favor agenda una nueva cita a través del sistema VehiLog.
          Recuerda presentarte puntualmente en la hora indicada.
        </p>
      </div>
      <p style="color:#aaa;font-size:12px;margin:0;">
        Si crees que esto es un error, comunícate directamente con el área de <strong>${cita.area}</strong>.
      </p>
    </div>
    <p style="color:#aaa;font-size:11px;text-align:center;margin:16px 0 0;">VehiLog · Sistema de Control Vehicular</p>
  </div>`;
 
  await transporter.sendMail({
    from: `"VehiLog SISSA" <${process.env.MAIL_USER || 'lazcano.cristobal28@gmail.com'}>`,
    to: cita.emailVisitante,
    subject: `[VehiLog] Cita cancelada por inasistencia — ${cita.oficio}`,
    html
  });
}
async function enviarRecuperacionPassword(user, token, baseUrl) {
  const link = `${baseUrl}/reset.html?token=${token}`;
  await transporter.sendMail({
    from: '"VehiLog" <lazcano.cristobal28@gmail.com>',
    to: user.email,
    subject: 'Recuperación de contraseña — VehiLog',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <h2 style="color:#111;">Recuperación de contraseña</h2>
        <p>Hola <strong>${user.usuario}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <a href="${link}" style="display:inline-block;margin:1.5rem 0;background:#e8441a;color:#fff;padding:0.85rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="color:#8a8a8e;font-size:0.85rem;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.</p>
      </div>`
  });
}

//module.exports = { enviarSolicitudAnfitrion, enviarRespuestaVisitante, enviarConfirmacionPendiente, enviarRecuperacionPassword };
module.exports = { enviarSolicitudAnfitrion, enviarRespuestaVisitante, enviarConfirmacionPendiente, enviarRecuperacionPassword, enviarCancelacionVisitante };