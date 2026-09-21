//public/js/entrada.js
const token = localStorage.getItem('vehilog_token');
let citaSeleccionada = null;
let vehSeleccionado = null;

// Auth
(async () => {
  if (!token) { window.location.href = 'login.html'; return; }
  const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } }).catch(() => null);
  if (!res || !res.ok) { window.location.href = 'login.html'; }
})();

window.addEventListener('DOMContentLoaded', () => {
  cargarCitas();
  cargarCorp();
});

function setFechaHoraActual(prefijo = '') {
  const ahora = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fecha = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
  const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
  const f = document.getElementById(`${prefijo}FechaEntrada`);
  const h = document.getElementById(`${prefijo}HoraEntrada`);
  if (f) f.value = fecha;
  if (h) h.value = hora;
}

// ── TABS ──
function cambiarTab(tab) {
  document.getElementById('panelVisitante').classList.toggle('active', tab === 'visitante');
  document.getElementById('panelCorp').classList.toggle('active', tab === 'corp');
  document.getElementById('tabVisitante').className = 'tab-btn' + (tab === 'visitante' ? ' active' : '');
  document.getElementById('tabCorp').className = 'tab-btn' + (tab === 'corp' ? ' active-corp' : '');
}

// ══════════════════════════════════════
//  MODAL — utilidades genéricas
// ══════════════════════════════════════
function abrirModalEl(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
  // reset obs y botones según modal
  if (id === 'modalCheckin') {
    citaSeleccionada = null;
    const obs = document.getElementById('mObs');
    if (obs) obs.value = '';
    const btn = document.getElementById('mBtnGuardar');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar entrada'; }
  }
  if (id === 'modalCorp') {
    vehSeleccionado = null;
    const obs = document.getElementById('cObs');
    if (obs) obs.value = '';
    const btn = document.getElementById('cBtnGuardar');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar entrada'; }
  }
}

function cerrarModalSiFondo(e, id) {
  if (e.target === document.getElementById(id)) cerrarModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('modalCheckin').classList.contains('open')) cerrarModal('modalCheckin');
    if (document.getElementById('modalCorp').classList.contains('open')) cerrarModal('modalCorp');
  }
});

function scrollModalTop(modalId) {
  const box = document.querySelector(`#${modalId} .modal-box`);
  if (box) box.scrollTop = 0;
}

// ══════════════════════════════════════
//  VISITANTES — DataTables
// ══════════════════════════════════════
let todasLasCitas = [];
let dtCitasEntrada = null;
const DT_LANG_URL = 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json';

async function cargarCitas() {
  document.getElementById('loadingCitasDT').style.display = 'flex';
  document.getElementById('tablaCitasEntradaWrap').style.display = 'none';
  try {
    const res = await fetch('/api/citas', { headers: { 'x-session-token': token } });
    const data = await res.json();
    todasLasCitas = (data.citas || []).reverse();
    renderTablaCitasEntrada();
  } catch {
    document.getElementById('loadingCitasDT').innerHTML =
      '<i class="bi bi-wifi-off"></i> Error al cargar.';
  }
}

function renderTablaCitasEntrada() {
  document.getElementById('loadingCitasDT').style.display = 'none';
  document.getElementById('tablaCitasEntradaWrap').style.display = 'block';

  const rows = todasLasCitas.map(c => {
    const [a, m, d] = (c.fecha || '').split('-');
    const fechaLeg = c.fecha ? `${d}/${m}/${a}` : '—';
    const agendada = c.estatus === 'AGENDADA';
    const estatusConfig = {
      'AGENDADA': { label: 'Cita', cls: 'agendada' },
      'PENDIENTE': { label: 'Pendiente', cls: 'pendiente' },
      'RECHAZADA': { label: 'Rechazada', cls: 'rechazada' },
      'ATENDIDA': { label: 'Entrada', cls: 'atendida' },
      'CANCELADA': { label: 'Cancelada', cls: 'cancelada' },
    };
    const cfg = estatusConfig[c.estatus] || { label: c.estatus, cls: '' };
    const accionHtml = agendada
      ? `<button class="btn-accion btn-accion-checkin"
           onclick='abrirModalVisitante(${JSON.stringify(JSON.stringify(c))})'>
           <i class="bi bi-box-arrow-in-right"></i> Entrada
         </button>`
      : `<span style="font-size:0.75rem;color:var(--muted);">—</span>`;
    return [
      `<span class="dt-nombre">${c.nombres || ''} ${c.apPaterno || ''} ${c.apMaterno || ''}</span>`,
      `<span class="dt-folio">${c.oficio || '—'}</span>`,
      `<span class="dt-fecha">${fechaLeg}</span>`,
      c.hora || '—',
      c.area || '—',
      `<span class="rc-badge ${cfg.cls}">${cfg.label}</span>`,
      accionHtml
    ];
  });

  if (dtCitasEntrada) { dtCitasEntrada.destroy(); }
  document.querySelector('#tablaCitasEntrada tbody').innerHTML = '';

  dtCitasEntrada = $('#tablaCitasEntrada').DataTable({
    language: { url: DT_LANG_URL },
    responsive: false,
    autoWidth: false,
    pageLength: 15,
    lengthMenu: [10, 15, 25, 50],
    dom: '<"dt-top"lf>rt<"dt-bottom"ip>',
    data: rows,
    columns: [
      { title: 'Nombre' },
      { title: 'Oficio' },
      { title: 'Fecha' },
      { title: 'Hora', orderable: false },
      { title: 'Área de visita' },
      { title: 'Estatus' },
      { title: 'Acción', orderable: false, searchable: false }
    ],
    order: [[2, 'asc']],
    columnDefs: [
      { width: '28%', targets: 0 },
      { width: '22%', targets: 1 },
      { width: '10%', targets: 2 },
      { width: '8%', targets: 3 },
      { width: '16%', targets: 4 },
      { width: '8%', targets: 5 },
      { width: '8%', targets: 6 },
    ]
  });
}

// ── MODAL VISITANTES ──
const DOCS = [
  { key: 'oficio', label: 'N° de Oficio', desc: 'Número de oficio o referencia de la visita.', req: true },
  { key: 'ine', label: 'INE / Documento Oficial', desc: 'Identificación oficial vigente con fotografía.', req: true },
  { key: 'licencia', label: 'Licencia de Conducir', desc: 'Requerida si el visitante ingresa con vehículo.', req: false },
];

function abrirModalVisitante(citaJson) {
  citaSeleccionada = JSON.parse(citaJson);
  setFechaHoraActual('m');
  renderModalChecklist();
  mIrPaso(1);
  abrirModalEl('modalCheckin');
}

function mIrPaso(n) {
  if (n === 2) {
    const reqs = document.querySelectorAll('#mChecklistItems .check-item[data-key="oficio"], #mChecklistItems .check-item[data-key="ine"]');
    let ok = true;
    reqs.forEach(el => { if (!el.classList.contains('checked')) ok = false; });
    if (!ok) { document.getElementById('mCheckErr').style.display = 'flex'; return; }
    document.getElementById('mCheckErr').style.display = 'none';
    renderModalResumen();
  }
  ['mstep1', 'mstep2', 'mstep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i + 1 < n) el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });
  document.querySelectorAll('#modalCheckin .modal-step').forEach(p => p.classList.remove('active'));
  document.getElementById({ 1: 'mPanel1', 2: 'mPanel2', 3: 'mPanel3' }[n]).classList.add('active');
  scrollModalTop('modalCheckin');
}

function renderModalChecklist() {
  const c = citaSeleccionada;
  const [a, m, d] = (c.fecha || '').split('-');
  const fechaLeg = c.fecha ? `${d}/${m}/${a}` : '—';
  const docsLabels = { oficio: 'N° de Oficio', ine: 'INE / Documento Oficial', licencia: 'Licencia de Conducir' };
  const docsDeclarados = c.docsCheck || [];

  document.getElementById('mSelectedInfo').innerHTML = `
    <div class="selected-info">
      <div class="si-name">${c.nombres} ${c.apPaterno} ${c.apMaterno || ''}</div>
      <div class="si-detail">Oficio: ${c.oficio} &nbsp;·&nbsp; ${fechaLeg} ${c.hora} &nbsp;·&nbsp; ${c.area}</div>
      ${c.veh_placas ? `<div class="si-detail" style="margin-top:4px;">🚗 ${c.veh_placas} · ${c.veh_marca} ${c.veh_modelo}</div>` : ''}
    </div>
    ${docsDeclarados.length ? `
    <div style="background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.2);border-left:3px solid var(--accent);border-radius:8px;padding:0.85rem 1rem;margin-top:0.5rem;">
      <div style="font-size:0.72rem;font-weight:700;color:var(--accent);margin-bottom:0.4rem;">📋 El visitante declaró traer:</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
        ${docsDeclarados.map(k => `<span style="font-size:0.75rem;font-weight:500;background:#fff;color:var(--accent);border:1px solid rgba(124,58,237,0.25);border-radius:20px;padding:3px 10px;">${docsLabels[k] || k}</span>`).join('')}
      </div>
      <div style="font-size:0.7rem;color:var(--muted);font-style:italic;">Verifica físicamente que el visitante presente cada documento.</div>
    </div>` : ''}`;

  const docs = c.tipo === 'visita' ? DOCS.filter(d => d.key !== 'licencia') : DOCS;
  document.getElementById('mChecklistItems').innerHTML = docs.map(doc => `
    <div class="check-item" data-key="${doc.key}"
      onclick="this.classList.toggle('checked'); document.getElementById('mCheckErr').style.display='none';">
      <div class="check-box">✓</div>
      <div class="check-content">
        <div class="ct">${doc.label} <span class="${doc.req ? 'badge-req' : 'badge-opt'}">${doc.req ? 'Requerido' : 'Si aplica'}</span></div>
        <div class="cs">${doc.desc}</div>
      </div>
    </div>`).join('');
}

function renderModalResumen() {
  const c = citaSeleccionada;
  const f = (k, v) => `
    <div style="display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:0.85rem;">
      <span style="color:var(--muted);font-size:0.72rem;text-transform:uppercase;">${k}</span>
      <span style="font-weight:500;">${v || '—'}</span>
    </div>`;
  const chk = document.querySelectorAll('#mChecklistItems .check-item.checked').length;
  const tot = document.querySelectorAll('#mChecklistItems .check-item').length;
  document.getElementById('mResumen').innerHTML = `
    <div style="background:rgba(124,58,237,0.04);border:1px solid rgba(124,58,237,0.15);border-radius:var(--radius);padding:1rem 1.25rem;">
      ${f('Visitante', `${c.nombres} ${c.apPaterno} ${c.apMaterno || ''}`)}
      ${f('Oficio', c.oficio)}
      ${f('Área', c.area)}
      ${c.veh_placas ? f('Vehículo', `${c.veh_placas} · ${c.veh_marca} ${c.veh_modelo}`) : ''}
      ${f('Docs verificados', `${chk} / ${tot}`)}
    </div>`;
}

async function guardarEntrada() {
  const btn = document.getElementById('mBtnGuardar');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  const c = citaSeleccionada;
  const folio = `ENT-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const docsVerificados = [...document.querySelectorAll('#mChecklistItems .check-item.checked')].map(el => el.dataset.key);
  const payload = {
    folio,
    fechaEntrada: document.getElementById('mFechaEntrada').value,
    horaEntrada: document.getElementById('mHoraEntrada').value,
    tipoMovimiento: 'ENTRADA',
    nombreConductor: `${c.nombres} ${c.apPaterno} ${c.apMaterno || ''}`.trim(),
    empresa: c.area,
    telefono: c.telefono,
    placas: c.veh_placas || 'N/A',
    marca: c.veh_marca || 'N/A',
    modelo: c.veh_modelo || 'N/A',
    color: c.veh_color || 'N/A',
    oficioCita: c.oficio,
    docsVerificados,
    observaciones: document.getElementById('mObs').value.trim(),
    estatus: 'ACTIVO',
  };
  try {
    const res = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar entrada';
      return;
    }
    try {
      await fetch(`/api/citas/${encodeURIComponent(c.oficio)}/accion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-session-token': token },
        body: JSON.stringify({ accion: 'ATENDIDA' })
      });
    } catch { /* no bloquear si falla */ }

    document.getElementById('mFolioOk').textContent = `Folio: ${folio}`;
    mIrPaso(3);
    cargarCitas();
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar entrada';
  }
}

// ══════════════════════════════════════
//  FLOTILLA — DataTables + Modal
// ══════════════════════════════════════
let todosVehiculos = [];

async function cargarCorp() {
  document.getElementById('loadingFlotillaDT').style.display = 'flex';
  document.getElementById('tablaFlotillaWrap').style.display = 'none';
  try {
    const res = await fetch('/api/vehiculos', { headers: { 'x-session-token': token } });
    const data = await res.json();
    todosVehiculos = (data.vehiculos || []).filter(v => v.estatus === 'EN RUTA');
    renderTablaFlotilla();
  } catch (e) {
    console.error(e);
    document.getElementById('loadingFlotillaDT').innerHTML =
      '<i class="bi bi-wifi-off"></i> Error al cargar.';
  }
}

function renderTablaFlotilla() {
  document.getElementById('loadingFlotillaDT').style.display = 'none';
  document.getElementById('tablaFlotillaWrap').style.display = 'block';

  const rows = todosVehiculos.map(v => [
    `<span class="badge-corp">${v.placas}</span>`,
    `<span class="dt-nombre">${v.marca} ${v.modelo}</span>`,
    v.conductorActual || '—',
    `<span class="ri-ruta">${v.ruta || 'Sin ruta'}</span>`,
    `<div style="text-align:center;">
   <button class="btn-accion btn-accion-checkin" onclick="abrirModalCorp(${v.id})">
     <i class="bi bi-box-arrow-in-right"></i> Entrada
   </button>
 </div>`
  ]);

  if (window.dtFlotilla) { window.dtFlotilla.destroy(); }
  $('#tablaFlotilla tbody').empty();

  window.dtFlotilla = $('#tablaFlotilla').DataTable({
    language: { url: DT_LANG_URL },
    responsive: false,
    autoWidth: false,
    pageLength: 15,
    lengthMenu: [10, 15, 25, 50],
    dom: '<"dt-top"lf>rt<"dt-bottom"ip>',
    data: rows,
    columns: [
      { title: 'Placas' },
      { title: 'Vehículo' },
      { title: 'Conductor / Responsable' },
      { title: 'Ruta / Detalles' },
      { title: 'Acción', orderable: false, searchable: false, className: 'text-center' }
    ],
    initComplete: function () {
      this.api().columns.adjust().responsive.recalc();
    }
  });
}

// ── MODAL FLOTILLA ──
function abrirModalCorp(id) {
  vehSeleccionado = todosVehiculos.find(v => v.id === id);
  if (!vehSeleccionado) return;
  setFechaHoraActual('c');
  renderChecklistCorp();
  cIrPaso(1);
  abrirModalEl('modalCorp');
}

function cIrPaso(n) {
  if (n === 2) {
    const reqs = document.querySelectorAll('#cChecklistItems .check-item[data-corp="conductor"], #cChecklistItems .check-item[data-corp="danos"]');
    let ok = true;
    reqs.forEach(el => { if (!el.classList.contains('checked')) ok = false; });
    if (!ok) { document.getElementById('cCheckErr').style.display = 'flex'; return; }
    document.getElementById('cCheckErr').style.display = 'none';
    renderResumenCorp();
  }
  ['cstep1', 'cstep2', 'cstep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i + 1 < n) el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });
  document.querySelectorAll('#modalCorp .modal-step').forEach(p => p.classList.remove('active'));
  document.getElementById({ 1: 'cPanel1', 2: 'cPanel2', 3: 'cPanel3' }[n]).classList.add('active');
  scrollModalTop('modalCorp');
}

function renderChecklistCorp() {
  const v = vehSeleccionado;
  document.getElementById('cBannerModal').innerHTML = `
    <div class="selected-banner-c">
      <div class="sb-placas">${v.placas}</div>
      <div class="sb-det">${v.marca} ${v.modelo} · ${v.color}</div>
      <div class="sb-cond">🚗 Conductor que salió: ${v.conductorActual || '—'}</div>
    </div>`;

  document.getElementById('cChecklistItems').innerHTML = `
    <div class="check-item" data-corp="conductor"
      onclick="this.classList.toggle('checked'); document.getElementById('cCheckErr').style.display='none';">
      <div class="check-box">✓</div>
      <div class="check-content">
        <div class="ct">Conductor es el mismo que salió <span class="badge-req">Requerido</span></div>
        <div class="cs">Confirma que ${v.conductorActual || 'el conductor registrado'} es quien regresa el vehículo.</div>
      </div>
    </div>
    <div class="check-item" data-corp="danos"
      onclick="this.classList.toggle('checked'); document.getElementById('cCheckErr').style.display='none';">
      <div class="check-box">✓</div>
      <div class="check-content">
        <div class="ct">Vehículo sin daños visibles <span class="badge-req">Requerido</span></div>
        <div class="cs">Verifica que el vehículo regresa en las mismas condiciones en que salió.</div>
      </div>
    </div>
    <div class="check-item" data-corp="llaves"
      onclick="this.classList.toggle('checked');">
      <div class="check-box">✓</div>
      <div class="check-content">
        <div class="ct">Llaves / tarjeta de circulación entregadas <span class="badge-opt">Opcional</span></div>
        <div class="cs">El conductor entregó llaves y documentos del vehículo.</div>
      </div>
    </div>`;
}

function renderResumenCorp() {
  const v = vehSeleccionado;
  const f = (k, val) => `
    <div style="display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:0.85rem;">
      <span style="color:var(--muted);font-size:0.72rem;text-transform:uppercase;">${k}</span>
      <span style="font-weight:500;">${val || '—'}</span>
    </div>`;
  document.getElementById('cResumenModal').innerHTML = `
    <div style="background:rgba(52,199,89,0.04);border:1px solid rgba(52,199,89,0.2);border-radius:var(--radius);padding:1rem 1.25rem;">
      ${f('Placas', v.placas)}
      ${f('Vehículo', `${v.marca} ${v.modelo} · ${v.color}`)}
      ${f('Conductor', v.conductorActual)}
    </div>`;
}

async function guardarCorp() {
  const btn = document.getElementById('cBtnGuardar');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  try {
    const res = await fetch(`/api/vehiculos/${vehSeleccionado.id}/entrada`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({
        fechaEntrada: document.getElementById('cFechaEntrada').value,
        horaEntrada: document.getElementById('cHoraEntrada').value,
        observaciones: document.getElementById('cObs').value.trim(),
      })
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar entrada';
      return;
    }
    cIrPaso(3);
    cargarCorp(); // refresca tabla en background
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar entrada';
  }
}