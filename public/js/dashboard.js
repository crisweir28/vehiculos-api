// public/js/dashboard.js
const token = localStorage.getItem('vehilog_token');
let todosRegistros = [];
let todasCitas = [];
let todosVehiculos = [];
let todosMovimientos = [];
let filtroReg = 'todos';
let filtroCita = 'todos';
let filtroFlotilla = 'todos';

// Instancias DataTable
let dtRegistros = null;
let dtCitas = null;
let dtFlotilla = null;

// ── OPCIONES BASE DATATABLES (compartidas) ──────────────
const DT_LANG_URL = 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json';

const dtBaseOpts = {
  language: { url: DT_LANG_URL },
  responsive: true,
  pageLength: 15,
  lengthMenu: [10, 15, 25, 50, 100],
  dom: '<"dt-top"lf>rt<"dt-bottom"ip>',
};

// ── TABS ────────────────────────────────────────────────
function cambiarTab(tab) {
  tabActual = tab;

  document.getElementById('panelRegistros').style.display = tab === 'registros' ? 'block' : 'none';
  document.getElementById('panelCitas').style.display = tab === 'citas' ? 'block' : 'none';
  document.getElementById('panelFlotilla').style.display = tab === 'flotilla' ? 'block' : 'none';
  document.getElementById('panelReportes').style.display = tab === 'reportes' ? 'block' : 'none';

  document.getElementById('tabRegistros').className = 'tab-pill' + (tab === 'registros' ? ' active' : '');
  document.getElementById('tabCitas').className = 'tab-pill' + (tab === 'citas' ? ' active-citas' : '');
  document.getElementById('tabFlotilla').className = 'tab-pill' + (tab === 'flotilla' ? ' active-flotilla' : '');
  document.getElementById('tabReportes').className = 'tab-pill' + (tab === 'reportes' ? ' active-reportes' : '');

  // Cargar datos la primera vez + actualizar stats
  if (tab === 'citas' && todasCitas.length === 0) { cargarCitas(); actualizarStatsReg(); }
  if (tab === 'flotilla' && todosVehiculos.length === 0) { cargarFlotilla(); actualizarStatsReg(); }

  // Ajustar columnas DataTables
  if (tab === 'registros' && dtRegistros) setTimeout(() => dtRegistros.columns.adjust().responsive.recalc(), 50);
  if (tab === 'citas' && dtCitas) setTimeout(() => dtCitas.columns.adjust().responsive.recalc(), 50);
  if (tab === 'flotilla' && dtFlotilla) setTimeout(() => dtFlotilla.columns.adjust().responsive.recalc(), 50);
}

// ══════════════════════════════════════════════════════════
//  REGISTROS
// ══════════════════════════════════════════════════════════
async function cargarRegistros() {
  document.getElementById('loadingReg').style.display = 'flex';
  document.getElementById('tablaRegistrosWrap').style.display = 'none';
  try {
    const res = await fetch('/api/registros', { headers: { 'x-session-token': token } });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    todosRegistros = (data.registros || []).reverse();
    const activos = todosRegistros.filter(r => r.estatus === 'ACTIVO').length;
    document.getElementById('statTotal').textContent = todosRegistros.length;
    document.getElementById('statActivo').textContent = activos;
    document.getElementById('statCerrado').textContent = todosRegistros.length - activos;
    renderTablaRegistros();
  } catch {
    document.getElementById('loadingReg').innerHTML =
      '<i class="bi bi-wifi-off"></i> No se pudo conectar.';
  }
}

async function actualizarStatsReg() {
  try {
    const res = await fetch('/api/registros/stats', { headers: { 'x-session-token': token } });
    const data = await res.json();
    const s = data.stats || {};
    document.getElementById('statTotal').textContent = s.total_registros || 0;
    document.getElementById('statActivo').textContent = s.registros_activos || 0;
    document.getElementById('statCerrado').textContent = s.registros_completados || 0;
  } catch { /* silencioso */ }
}

function setFilterReg(f, cardId) {
  filtroReg = f;
  document.querySelectorAll('#panelRegistros .stat-filtro').forEach(c =>
    c.classList.remove('active-filter'));
  document.getElementById(cardId).classList.add('active-filter');

  if (dtRegistros) {
    if (f === 'todos') dtRegistros.column(6).search('').draw();
    else if (f === 'ACTIVO') dtRegistros.column(6).search('En sitio').draw();
    else if (f === 'CERRADO') dtRegistros.column(6).search('Con salida').draw();
  }
}

function renderTablaRegistros() {
  document.getElementById('loadingReg').style.display = 'none';
  document.getElementById('tablaRegistrosWrap').style.display = 'block';

  const rows = todosRegistros.map(r => {
    const esActivo = r.estatus === 'ACTIVO';
    return [
      `<span class="dt-nombre">${r.nombreConductor || '—'}</span>`,
      `<span class="dt-folio">${r.folio || '—'}</span>`,
      r.placas || '—',
      `${r.marca || ''} ${r.modelo || ''}`.trim() || '—',
      `${r.fechaEntrada || ''} ${r.horaEntrada || ''}`.trim(),
      esActivo ? '—' : `${r.fechaSalida || ''} ${r.horaSalida || ''}`.trim(),
      esActivo
        ? `<span class="rc-badge activo">En sitio</span>`
        : `<span class="rc-badge cerrado">Con salida</span>`,
      `<button class="btn-accion btn-accion-detalle" onclick="verDetalleReg('${r.folio}')"><i class="bi bi-eye"></i> Ver</button>`
    ];
  });

  if (dtRegistros) { dtRegistros.destroy(); }
  document.querySelector('#tablaRegistros tbody').innerHTML = '';

  dtRegistros = $('#tablaRegistros').DataTable({
    ...dtBaseOpts,
    data: rows,
    columns: [
      { title: 'Nombre' },
      { title: 'Folio' },
      { title: 'Placas' },
      { title: 'Vehículo' },
      { title: 'Entrada', type: 'string' },
      { title: 'Salida', type: 'string' },
      { title: 'Estatus' },
      { title: 'Acción', orderable: false, searchable: false }
    ],
    order: [[4, 'desc']],
    columnDefs: [
      { responsivePriority: 1, targets: 0 },
      { responsivePriority: 2, targets: 6 },
      { responsivePriority: 3, targets: 7 },
      { responsivePriority: 4, targets: 2 },
      { responsivePriority: 5, targets: 4 },
      { responsivePriority: 6, targets: 5 },
      { responsivePriority: 7, targets: 1 },
      { responsivePriority: 8, targets: 3 },
    ]
  });

  if (filtroReg === 'ACTIVO') dtRegistros.column(6).search('En sitio').draw();
  else if (filtroReg === 'CERRADO') dtRegistros.column(6).search('Con salida').draw();
}

// ══════════════════════════════════════════════════════════
//  CITAS
// ══════════════════════════════════════════════════════════
async function cargarCitas() {
  document.getElementById('loadingCitas').style.display = 'flex';
  document.getElementById('tablaCitasWrap').style.display = 'none';
  try {
    const res = await fetch('/api/citas', { headers: { 'x-session-token': token } });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    todasCitas = (data.citas || []).reverse();
    actualizarStatsCitas();
    renderTablaCitas();
  } catch {
    document.getElementById('loadingCitas').innerHTML =
      '<i class="bi bi-wifi-off"></i> No se pudo conectar.';
  }
}

function actualizarStatsCitas() {
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('statCitasTotal').textContent = todasCitas.length;
  document.getElementById('statCitasHoy').textContent = todasCitas.filter(c => c.fecha === hoy).length;
  document.getElementById('statCitasAgendadas').textContent = todasCitas.filter(c => c.estatus === 'AGENDADA').length;
  document.getElementById('statCitasPendientes').textContent = todasCitas.filter(c => c.estatus === 'PENDIENTE').length;
}

function setFilterCita(f, cardId) {
  filtroCita = f;
  document.querySelectorAll('#panelCitas .stat-filtro-cita').forEach(c =>
    c.classList.remove('active-filter-cita'));
  if (cardId) document.getElementById(cardId).classList.add('active-filter-cita');

  if (dtCitas) {
    const hoy = new Date().toISOString().split('T')[0];
    const [a, m, d] = hoy.split('-');
    const hoyLeg = `${d}/${m}/${a}`;

    // Limpiar siempre ambos filtros antes de aplicar el nuevo
    dtCitas.search('').columns().search('');

    if (f === 'todos')      dtCitas.draw();
    else if (f === 'HOY')   dtCitas.search(hoyLeg).draw();
    else                    dtCitas.column(6).search(f).draw();
  }
}

function renderTablaCitas() {
  document.getElementById('loadingCitas').style.display = 'none';
  document.getElementById('tablaCitasWrap').style.display = 'block';

  const rows = todasCitas.map(c => {
    const [a, m, d] = (c.fecha || '').split('-');
    const fechaLeg = c.fecha ? `${d}/${m}/${a}` : '—';
    const estatus = (c.estatus || '').toLowerCase();
    const tipoLabel = c.tipo === 'visita' ? '🪪 Visita'
      : c.tipo === 'vehiculo' ? '🚗 Vehículo'
        : '🪪🚗 Ambos';

    let badgeClass = estatus;
    const badgeHtml = `<span class="rc-badge ${badgeClass}">${c.estatus || '—'}</span>`;

    return [
      `<span class="dt-nombre">${c.nombres || ''} ${c.apPaterno || ''} ${c.apMaterno || ''}</span>`,
      `<span class="dt-folio">${c.oficio || '—'}</span>`,
      `<span class="dt-fecha">${fechaLeg}</span>`,
      c.hora || '—',
      c.area || '—',
      tipoLabel,
      badgeHtml,
      `<button class="btn-accion btn-accion-detalle" onclick="verDetalleCita('${c.oficio}')">
         <i class="bi bi-eye"></i> Ver
       </button>`
    ];
  });

  if (dtCitas) { dtCitas.destroy(); }
  document.querySelector('#tablaCitas tbody').innerHTML = '';

  dtCitas = $('#tablaCitas').DataTable({
    ...dtBaseOpts,
    data: rows,
    columns: [
      { title: 'Nombre' },
      { title: 'Oficio' },
      { title: 'Fecha' },
      { title: 'Hora', orderable: false },
      { title: 'Área' },
      { title: 'Tipo', orderable: false },
      { title: 'Estatus' },
      { title: 'Acción', orderable: false, searchable: false }
    ],
    order: [[2, 'desc']],
    columnDefs: [
      { responsivePriority: 1, targets: 0 },  // Nombre
      { responsivePriority: 2, targets: 6 },  // Estatus
      { responsivePriority: 3, targets: 7 },  // Acción
      { responsivePriority: 4, targets: 2 },  // Fecha
      { responsivePriority: 5, targets: 3 },  // Hora
      { responsivePriority: 6, targets: 4 },  // Área
      { responsivePriority: 7, targets: 5 },  // Tipo
      { responsivePriority: 8, targets: 1 },  // Oficio
    ]
  });

  // Re-aplicar filtro de chip activo
  if (filtroCita !== 'todos') dtCitas.column(6).search(filtroCita).draw();
}

// ══════════════════════════════════════════════════════════
//  FLOTILLA
// ══════════════════════════════════════════════════════════
async function cargarFlotilla() {
  document.getElementById('loadingFlotilla').style.display = 'flex';
  document.getElementById('tablaFlotillaWrap').style.display = 'none';
  try {
    const [resVeh, resMov] = await Promise.all([
      fetch('/api/vehiculos', { headers: { 'x-session-token': token } }),
      fetch('/api/movimientos', { headers: { 'x-session-token': token } })
    ]);
    if (resVeh.status === 401) { window.location.href = 'login.html'; return; }
    const dataVeh = await resVeh.json();
    const dataMov = await resMov.json();
    todosVehiculos = dataVeh.vehiculos || [];
    todosMovimientos = dataMov.movimientos || [];
    actualizarStatsFlotilla();
    renderTablaFlotilla();
  } catch {
    document.getElementById('loadingFlotilla').innerHTML =
      '<i class="bi bi-wifi-off"></i> No se pudo conectar.';
  }
}

function actualizarStatsFlotilla() {
  document.getElementById('statVehTotal').textContent = todosVehiculos.length;
  document.getElementById('statVehDisp').textContent = todosVehiculos.filter(v => v.estatus === 'DISPONIBLE').length;
  document.getElementById('statVehRuta').textContent = todosVehiculos.filter(v => v.estatus === 'EN RUTA').length;
}

function setFilterFlotilla(f, cardId) {
  filtroFlotilla = f;
  document.querySelectorAll('#panelFlotilla .stat-filtro-flot').forEach(c =>
    c.classList.remove('active-filter-flot'));
  if (cardId) document.getElementById(cardId).classList.add('active-filter-flot');

  if (dtFlotilla) {
    if (f === 'todos')           dtFlotilla.column(5).search('').draw();
    else if (f === 'EN RUTA')    dtFlotilla.column(5).search('En ruta').draw();
    else if (f === 'DISPONIBLE') dtFlotilla.column(5).search('Completado').draw();
  }
}
function renderTablaFlotilla() {
  document.getElementById('loadingFlotilla').style.display = 'none';
  document.getElementById('tablaFlotillaWrap').style.display = 'block';

  const rows = todosMovimientos.map(m => {
    const enRuta = m.tipo === 'SALIDA';
    return [
      `<span class="dt-nombre">${m.placas || '—'}</span>`,
      m.conductor || '—',
      m.destino || '—',
      `${m.fechaSalida || ''} ${m.horaSalida || ''}`.trim() || '—',
      m.horaEntrada ? `${m.fechaEntrada || ''} ${m.horaEntrada}`.trim() : `<span style="color:var(--muted)">En ruta</span>`,
      enRuta
        ? `<span class="rc-badge en-ruta">En ruta</span>`
        : `<span class="rc-badge completado">Completado</span>`,
      `<button class="btn-accion btn-accion-detalle" onclick="verDetalleMovimiento(${m.id})">
         <i class="bi bi-eye"></i> Ver
       </button>`
    ];
  });

  if (dtFlotilla) { dtFlotilla.destroy(); }
  document.querySelector('#tablaFlotilla tbody').innerHTML = '';

  dtFlotilla = $('#tablaFlotilla').DataTable({
    ...dtBaseOpts,
    data: rows,
    columns: [
      { title: 'Placas' },
      { title: 'Conductor' },
      { title: 'Destino' },
      { title: 'Salida' },
      { title: 'Regreso' },
      { title: 'Estatus' },
      { title: 'Acción', orderable: false, searchable: false }
    ],
    order: [[3, 'desc']],
    columnDefs: [
      { responsivePriority: 1, targets: 0 },  // Placas
      { responsivePriority: 2, targets: 1 },  // Conductor
      { responsivePriority: 3, targets: 5 },  // Estatus
      { responsivePriority: 4, targets: 6 },  // Acción
      { responsivePriority: 5, targets: 3 },  // Salida
      { responsivePriority: 6, targets: 4 },  // Regreso
      { responsivePriority: 7, targets: 2 },  // Destino
    ]
  });

  // Re-aplicar filtro activo
  if (filtroFlotilla === 'EN RUTA') dtFlotilla.column(5).search('En ruta').draw();
  else if (filtroFlotilla === 'DISPONIBLE') dtFlotilla.column(5).search('Completado').draw();
}

// ══════════════════════════════════════════════════════════
//  DETALLE PANELS
// ══════════════════════════════════════════════════════════
const f = (k, v) =>
  `<div class="detail-row"><span class="dk">${k}</span><span class="dv">${v || '—'}</span></div>`;

function verDetalleReg(folio) {
  const r = todosRegistros.find(r => r.folio === folio);
  if (!r) return;
  const tieneVehiculo = r.placas && r.placas !== 'N/A' && r.placas !== 'null';
  const tieneSalida = r.estatus === 'COMPLETADO' || r.estatus === 'CERRADO';

  const html = `
    <div class="detail-section"><div class="detail-section-title">Entrada</div>
      ${f('Folio', r.folio)}
      ${f('Fecha', r.fechaEntrada)}
      ${f('Hora', r.horaEntrada)}
    </div>
    <div class="detail-section"><div class="detail-section-title">Conductor</div>
      ${f('Nombre', r.nombreConductor)}
      ${f('Empresa', r.empresa)}
      ${f('Teléfono', r.telefono)}
    </div>
    ${tieneVehiculo ? `
    <div class="detail-section"><div class="detail-section-title">Vehículo</div>
      ${f('Placas', r.placas)}
      ${f('Marca', r.marca)}
      ${f('Modelo', r.modelo)}
      ${f('Color', r.color)}
    </div>` : ''}
    ${tieneSalida ? `
    <div class="detail-section"><div class="detail-section-title">Salida</div>
      ${f('Fecha', r.fechaSalida)}
      ${f('Hora', r.horaSalida)}
      ${r.observacionesSalida ? f('Observaciones', r.observacionesSalida) : ''}
    </div>
    <div class="cerrado-banner">
      <i class="bi bi-check-circle"></i> Salida registrada el ${r.fechaSalida} a las ${r.horaSalida}
    </div>` : ''}`;

  abrirDetalle(`${r.folio}`, html);
}

function abrirModalSalida(folio) {
  const r = todosRegistros.find(r => r.folio === folio);
  if (!r) return;
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fechaHoy = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const horaAhora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const html = `
    <div class="detail-section"><div class="detail-section-title">Registro</div>
      ${f('Placas', r.placas)}${f('Marca', r.marca)}${f('Modelo', r.modelo)}${f('Conductor', r.nombreConductor)}
    </div>
    <div class="salida-form">
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Fecha de Salida *</label>
          <input type="date" class="form-control" id="salidaFecha" value="${fechaHoy}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Hora de Salida *</label>
          <input type="time" class="form-control" id="salidaHora" value="${horaAhora}"/>
        </div>
      </div>
      <button class="btn-registrar-salida" id="btnGuardarSalida" onclick="guardarSalida('${r.folio}')">
        <i class="bi bi-check-lg"></i> Confirmar Salida
      </button>
      <button class="btn-cancel" onclick="cerrarSalidaPanel()">Cancelar</button>
    </div>`;
  abrirSalidaPanel(html);
}

function verDetalleCita(oficio) {
  const c = todasCitas.find(c => c.oficio === oficio);
  if (!c) return;
  const [a, m, d] = (c.fecha || '').split('-');
  const fechaLeg = c.fecha ? `${d}/${m}/${a}` : '—';
  const estatus = c.estatus || '';

  // Botones de acción — solo aparecen si la cita está AGENDADA
  const botonesAccion = estatus === 'AGENDADA' ? `
    <div class="detalle-acciones">
      <div class="detalle-acciones-title">Acciones</div>
      <div class="detalle-acciones-btns">
        <button class="btn-accion-cita btn-atendida" onclick="accionCita('${c.oficio}', 'ATENDIDA')">
          <i class="bi bi-check-circle"></i> Marcar como Atendida
        </button>
        <button class="btn-accion-cita btn-cancelar-cita" onclick="accionCita('${c.oficio}', 'CANCELADA')">
          <i class="bi bi-x-circle"></i> Cancelar por inasistencia
        </button>
      </div>
      <p class="detalle-acciones-hint">
        <i class="bi bi-info-circle"></i>
        Al cancelar por inasistencia se notificará al visitante por correo.
      </p>
    </div>` : '';

  // Banner de estatus final
  let bannerEstatus = '';
  if (estatus === 'ATENDIDA') {
    bannerEstatus = `
      <div class="cita-banner atendida">
        <i class="bi bi-check-circle-fill"></i> Cita atendida el ${c.actualizadoEn ? new Date(c.actualizadoEn).toLocaleDateString('es-MX') : '—'}
        ${c.accionPor ? `· por <strong>${c.accionPor}</strong>` : ''}
      </div>`;
  } else if (estatus === 'CANCELADA') {
    bannerEstatus = `
      <div class="cita-banner cancelada">
        <i class="bi bi-x-circle-fill"></i> Cancelada por inasistencia el ${c.actualizadoEn ? new Date(c.actualizadoEn).toLocaleDateString('es-MX') : '—'}
        ${c.accionPor ? `· por <strong>${c.accionPor}</strong>` : ''}
      </div>`;
  } else if (estatus === 'RECHAZADA') {
    bannerEstatus = `
      <div class="cita-banner rechazada">
        <i class="bi bi-slash-circle"></i> Cita rechazada por el área
      </div>`;
  }

  const html = `
    <div class="detail-section"><div class="detail-section-title">Agenda</div>
      ${f('Oficio', c.oficio)}${f('Fecha', fechaLeg)}${f('Hora', (c.hora || '') + ' hrs')}${f('Tipo', c.tipo?.toUpperCase())}
      ${f('Estatus', `<span class="rc-badge ${estatus.toLowerCase()}">${estatus}</span>`)}
    </div>
    <div class="detail-section"><div class="detail-section-title">Visitante</div>
      ${f('Nombre', `${c.nombres} ${c.apPaterno} ${c.apMaterno || ''}`)}
      ${f('Área', c.area)}${f('Teléfono', c.telefono)}
      ${c.emailVisitante ? f('Email', c.emailVisitante) : ''}
    </div>
    ${c.veh_placas ? `
    <div class="detail-section"><div class="detail-section-title">Vehículo</div>
      ${f('Placas', c.veh_placas)}${f('Marca', c.veh_marca)}${f('Modelo', c.veh_modelo)}${f('Color', c.veh_color)}
    </div>` : ''}
    <div class="detail-section"><div class="detail-section-title">Documentos</div>
      ${(c.documentos || []).length
      ? c.documentos.map(d => `<span class="doc-chip">📄 ${d}</span>`).join('')
      : '<span style="color:var(--muted)">Ninguno</span>'}
    </div>
    ${bannerEstatus}
    ${botonesAccion}`;

  abrirDetalle(`Cita — ${c.oficio}`, html);
}

async function accionCita(oficio, accion) {
  const esCancelacion = accion === 'CANCELADA';

  const resultado = await Swal.fire({
    title: esCancelacion ? 'Cancelar cita' : '¿Marcar como atendida?',
    html: esCancelacion
      ? `<p style="color:#555;font-size:0.92rem;margin:0;">
           ¿Confirmas que el visitante <strong>no se presentó</strong>?<br><br>
           Se enviará un correo notificándole que su cita fue cancelada por inasistencia
           y que debe reagendar.
         </p>`
      : `<p style="color:#555;font-size:0.92rem;margin:0;">
           Se registrará que el visitante fue <strong>atendido correctamente</strong>.
         </p>`,
    icon: esCancelacion ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: esCancelacion
      ? '<i class="bi bi-x-circle"></i> Sí, cancelar cita'
      : '<i class="bi bi-check-circle"></i> Sí, marcar atendida',
    cancelButtonText: 'No, regresar',
    confirmButtonColor: esCancelacion ? '#e8441a' : '#34c759',
    cancelButtonColor: '#8a8a8e',
    reverseButtons: true,
    customClass: {
      popup: 'swal-vehilog',
      confirmButton: 'swal-btn-confirm',
      cancelButton: 'swal-btn-cancel',
    }
  });

  if (!resultado.isConfirmed) return;

  // Mostrar loading mientras procesa
  Swal.fire({
    title: esCancelacion ? 'Cancelando cita...' : 'Registrando...',
    text: esCancelacion ? 'Enviando notificación al visitante.' : '',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch(`/api/citas/${encodeURIComponent(oficio)}/accion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ accion })
    });
    const data = await res.json();

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.error || 'No se pudo completar la acción.',
        confirmButtonColor: '#e8441a'
      });
      return;
    }

    await cargarCitas();
    cerrarDetalle();

    Swal.fire({
      icon: esCancelacion ? 'info' : 'success',
      title: esCancelacion ? 'Cita cancelada' : '¡Atendida!',
      text: esCancelacion
        ? 'Se notificó al visitante por correo.'
        : 'La cita fue marcada como atendida.',
      confirmButtonColor: esCancelacion ? '#e8441a' : '#34c759',
      timer: 3000,
      timerProgressBar: true,
    });

  } catch {
    Swal.fire({
      icon: 'error',
      title: 'Sin conexión',
      text: 'No se pudo conectar con el servidor.',
      confirmButtonColor: '#e8441a'
    });
  }
}

async function verDetalleVehiculo(id) {
  const v = todosVehiculos.find(v => v.id === id);
  if (!v) return;
  let html = `
    <div class="detail-section"><div class="detail-section-title">Vehículo</div>
      ${f('Placas', v.placas)}${f('Marca / Modelo', v.marca + ' ' + v.modelo)}
      ${f('Color', v.color)}${f('Año', v.anio)}${f('VIN / N° de Serie', v.numEcon)}${f('Estatus', v.estatus)}
    </div>
    <div class="detail-section"><div class="detail-section-title">Historial</div>
      <div id="historialVeh">Cargando...</div>
    </div>`;
  abrirDetalle(`Vehículo — ${v.placas}`, html);
  try {
    const res = await fetch(`/api/vehiculos/${id}/movimientos`, { headers: { 'x-session-token': token } });
    const data = await res.json();
    if (!data.movimientos?.length) {
      document.getElementById('historialVeh').innerHTML =
        '<span style="color:var(--muted);font-size:0.85rem;">Sin movimientos.</span>';
      return;
    }
    document.getElementById('historialVeh').innerHTML = data.movimientos.map(m => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.75rem 1rem;margin-bottom:0.5rem;">
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:${m.tipo === 'COMPLETADO' ? 'var(--green)' : 'var(--accent)'};">
          ${m.tipo === 'COMPLETADO' ? '✅ Completado' : '🚗 En Ruta'}
        </div>
        <div style="font-size:0.82rem;margin-top:0.3rem;">
          Conductor: <strong>${m.conductor}</strong>${m.destino ? ' · ' + m.destino : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--muted);margin-top:0.15rem;">
          Salida: ${m.fechaSalida} ${m.horaSalida}
          ${m.horaEntrada ? ' · Regreso: ' + m.fechaEntrada + ' ' + m.horaEntrada : ''}
        </div>
      </div>`).join('');
  } catch {
    document.getElementById('historialVeh').innerHTML =
      '<span style="color:var(--muted);">Error al cargar.</span>';
  }
}

function verDetalleMovimiento(id) {
  const m = todosMovimientos.find(m => m.id === id);
  if (!m) return;
  const enRuta = m.tipo === 'SALIDA';
  const html = `
    <div class="detail-section"><div class="detail-section-title">Vehículo</div>
      ${f('Placas', m.placas)}
      ${f('Estatus', enRuta ? '🚗 En Ruta' : '✅ Completado')}
    </div>
    <div class="detail-section"><div class="detail-section-title">Conductor</div>
      ${f('Nombre', m.conductor)}
    </div>
    <div class="detail-section"><div class="detail-section-title">Salida</div>
      ${f('Destino', m.destino)}
      ${f('Fecha', m.fechaSalida)}
      ${f('Hora', m.horaSalida ? m.horaSalida + ' hrs' : '—')}
      ${m.observaciones ? f('Observaciones', m.observaciones) : ''}
    </div>
    ${!enRuta ? `
    <div class="detail-section"><div class="detail-section-title">Regreso</div>
      ${f('Fecha', m.fechaEntrada)}
      ${f('Hora', m.horaEntrada ? m.horaEntrada + ' hrs' : '—')}
    </div>
    <div class="cerrado-banner">
      <i class="bi bi-check-circle"></i> Completado — Regresó el ${m.fechaEntrada} a las ${m.horaEntrada}
    </div>` : `
    <div style="background:rgba(232,68,26,0.07);border:1px solid rgba(232,68,26,0.2);border-radius:var(--radius-sm);padding:0.85rem 1rem;font-size:0.85rem;color:var(--accent);">
      <i class="bi bi-truck"></i> Vehículo actualmente en ruta
    </div>`}`;
  abrirDetalle(`Movimiento — ${m.placas}`, html);
}

// ══════════════════════════════════════════════════════════
//  GUARDAR SALIDA
// ══════════════════════════════════════════════════════════
async function guardarSalida(folio) {
  const fechaSalida = document.getElementById('salidaFecha').value;
  const horaSalida = document.getElementById('salidaHora').value;
  if (!fechaSalida || !horaSalida) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Ingresa fecha y hora de salida.', confirmButtonColor: '#e8441a' });
    return;
  }
  const btn = document.getElementById('btnGuardarSalida');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  try {
    const res = await fetch(`/api/registros/${encodeURIComponent(folio)}/salida`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ fechaSalida, horaSalida })
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar Salida';
      return;
    }
    cerrarSalidaPanel();
    await cargarRegistros();
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar Salida';
  }
}

// ══════════════════════════════════════════════════════════
//  REPORTES
// ══════════════════════════════════════════════════════════
async function previsualizarReporte(tipo) {
  let desde, hasta;
  if (tipo === 'registros') {
    desde = document.getElementById('rRegDesde').value;
    hasta = document.getElementById('rRegHasta').value;
  } else if (tipo === 'citas') {
    desde = document.getElementById('rCitaDesde').value;
    hasta = document.getElementById('rCitaHasta').value;
  } else if (tipo === 'flotilla') {
    desde = document.getElementById('rFlotDesde').value;
    hasta = document.getElementById('rFlotHasta').value;
  }

  if (!desde || !hasta) {
    Swal.fire({ icon: 'warning', title: 'Rango de fechas requerido',
      text: 'Debes seleccionar una fecha de inicio y una fecha de fin.',
      confirmButtonColor: '#e8441a' });
    return;
  }
  if (desde > hasta) {
    Swal.fire({ icon: 'warning', title: 'Rango inválido',
      text: 'La fecha de inicio no puede ser mayor a la fecha de fin.',
      confirmButtonColor: '#e8441a' });
    return;
  }

  let url = `/api/reportes/${tipo}/preview?`;
  if (tipo === 'registros') {
    const estatus = document.getElementById('rRegEstatus').value;
    const vehiculo = document.getElementById('rRegVehiculo').value;
    url += `desde=${desde}&hasta=${hasta}&`;
    if (estatus !== 'todos') url += `estatus=${estatus}&`;
    if (vehiculo !== 'todos') url += `conVehiculo=${vehiculo}&`;
  } else if (tipo === 'citas') {
    const tipo2 = document.getElementById('rCitaTipo').value;
    url += `desde=${desde}&hasta=${hasta}&`;
    if (tipo2 !== 'todos') url += `tipo=${tipo2}&`;
  } else if (tipo === 'flotilla') {
    const estatus = document.getElementById('rFlotEstatus').value;
    url += `desde=${desde}&hasta=${hasta}&`;
    if (estatus !== 'todos') url += `estatus=${encodeURIComponent(estatus)}&`;
  }

  window._reporteUrl = url.replace('/preview', '');
  window._reporteTipo = tipo;

  try {
    const res = await fetch(url, { headers: { 'x-session-token': token } });
    const data = await res.json();
    document.getElementById('prevTitulo').textContent = data.titulo;
    document.getElementById('prevTotal').textContent = data.total;
    document.getElementById('prevFiltros').textContent = data.filtros;
    document.getElementById('prevLista').innerHTML =
      data.muestra.map(item => `<div class="prev-item">${item}</div>`).join('');
    document.getElementById('reportePreview').classList.add('open');
    document.body.classList.add('no-scroll');
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo previsualizar el reporte.', confirmButtonColor: '#e8441a' });
  }
}

function cerrarPreview() {
  document.getElementById('reportePreview').classList.remove('open');
  document.body.classList.remove('no-scroll');
}

async function confirmarReporte() {
  const btn = document.querySelector('#reportePreview .btn-reporte');
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
  try {
    const res = await fetch(window._reporteUrl, { headers: { 'x-session-token': token } });
    if (!res.ok) {
      const data = await res.json();
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = textoOriginal;
      return;
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `reporte-${window._reporteTipo}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    cerrarPreview();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

function generarReporte(tipo) { previsualizarReporte(tipo); }