//public/js/salida.js
const token = localStorage.getItem('vehilog_token');
let regSeleccionado = null;
let vehSeleccionado = null;

const DT_LANG_URL = 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json';

// ── AUTH ──
(async () => {
  if (!token) { window.location.href = 'login.html'; return; }
  const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } }).catch(() => null);
  if (!res || !res.ok) { window.location.href = 'login.html'; return; }
  cargarVisitantes();
  cargarCorp();
})();

function setFechaHoraActual(prefijo) {
  const ahora = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fecha = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
  const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
  const f = document.getElementById(`${prefijo}FechaSalida`);
  const h = document.getElementById(`${prefijo}HoraSalida`);
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
  if (id === 'modalVisitante') {
    regSeleccionado = null;
    const obs = document.getElementById('vObs');
    if (obs) obs.value = '';
    const btn = document.getElementById('vBtnGuardar');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar salida'; }
    cargarVisitantes(); // refresca para quitar el que acaba de salir
  }
  if (id === 'modalCorp') {
    vehSeleccionado = null;
    ['cConductor', 'cDestino', 'cObs'].forEach(eid => {
      const el = document.getElementById(eid);
      if (el) el.value = '';
    });
    document.getElementById('cConductorErr').style.display = 'none';
    const btn = document.getElementById('cBtnGuardar');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Registrar salida'; }
    cargarCorp(); // refresca para quitar el vehículo que salió
  }
}

function cerrarModalSiFondo(e, id) {
  if (e.target === document.getElementById(id)) cerrarModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('modalVisitante').classList.contains('open')) cerrarModal('modalVisitante');
    if (document.getElementById('modalCorp').classList.contains('open')) cerrarModal('modalCorp');
  }
});

function scrollModalTop(id) {
  const box = document.querySelector(`#${id} .modal-box`);
  if (box) box.scrollTop = 0;
}

// ══════════════════════════════════════
//  VISITANTES — DataTables
// ══════════════════════════════════════
let todosRegistros = [];
let dtVisitantes = null;

async function cargarVisitantes() {
  document.getElementById('loadingVisitantesDT').style.display = 'flex';
  document.getElementById('tablaVisitantesWrap').style.display = 'none';
  try {
    const res = await fetch('/api/registros/activos', { headers: { 'x-session-token': token } });
    const data = await res.json();
    todosRegistros = data.registros || [];
    renderTablaVisitantes();
  } catch {
    document.getElementById('loadingVisitantesDT').innerHTML =
      '<i class="bi bi-wifi-off"></i> Error al cargar.';
  }
}

function renderTablaVisitantes() {
  document.getElementById('loadingVisitantesDT').style.display = 'none';
  document.getElementById('tablaVisitantesWrap').style.display = 'block';

  const rows = todosRegistros.map(r => [
    `<span class="dt-nombre">${r.nombreConductor || '—'}</span>`,
    `<span class="dt-folio">${r.folio || '—'}</span>`,
    r.placas || '—',
    `${r.marca || ''} ${r.modelo || ''}`.trim() || '—',
    `<span class="dt-fecha">${r.fechaEntrada || '—'} ${r.horaEntrada || ''}</span>`,
    `<button class="btn-accion btn-accion-salida"
       onclick='abrirModalVisitante(${JSON.stringify(JSON.stringify(r))})'>
       <i class="bi bi-box-arrow-right"></i> Salida
     </button>`
  ]);

  if (dtVisitantes) { dtVisitantes.destroy(); }
  document.querySelector('#tablaVisitantes tbody').innerHTML = '';

  dtVisitantes = $('#tablaVisitantes').DataTable({
    language: { url: DT_LANG_URL },
    responsive: false,
    autoWidth: false,
    pageLength: 15,
    lengthMenu: [10, 15, 25, 50],
    dom: '<"dt-top"lf>rt<"dt-bottom"ip>',
    data: rows,
    columns: [
      { title: 'Nombre' },
      { title: 'Folio' },
      { title: 'Placas' },
      { title: 'Vehículo' },
      { title: 'Entrada' },
      { title: 'Acción', orderable: false, searchable: false }
    ],
    order: [[4, 'desc']],
    columnDefs: [
      { width: '25%', targets: 0 },
      { width: '14%', targets: 1 },
      { width: '12%', targets: 2 },
      { width: '18%', targets: 3 },
      { width: '20%', targets: 4 },
      { width: '11%', targets: 5 },
    ]
  });
}

// ── MODAL VISITANTES ──
const DOCS_SALIDA = [
  { key: 'pertenencias', label: 'Pertenencias personales', desc: 'Bolsos, mochilas, documentos personales.' },
  { key: 'equipo', label: 'Equipo o herramientas', desc: 'Laptop, cámara, equipo técnico traído.' },
  { key: 'documentos', label: 'Documentación entregada', desc: 'Acuses, contratos, copias de documentos.' },
  { key: 'gafete', label: 'Gafete de visitante', desc: 'Devolver gafete o pase de acceso.' },
];

function abrirModalVisitante(rJson) {
  regSeleccionado = JSON.parse(rJson);
  setFechaHoraActual('v');
  renderChecklistVisitante();
  vIrPaso(1);
  abrirModalEl('modalVisitante');
}

function vIrPaso(n) {
  if (n === 2) renderResumenVisitante();

  ['vstep1', 'vstep2', 'vstep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i + 1 < n) el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });

  document.querySelectorAll('#modalVisitante .modal-step').forEach(p => p.classList.remove('active'));
  document.getElementById({ 1: 'vPanel1', 2: 'vPanel2', 3: 'vPanel3' }[n]).classList.add('active');
  scrollModalTop('modalVisitante');
}

const f = (k, v) => `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:0.85rem;">
    <span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);">${k}</span>
    <span style="font-weight:500;">${v || '—'}</span>
  </div>`;

function renderChecklistVisitante() {
  const r = regSeleccionado;
  document.getElementById('vSelectedInfo').innerHTML = `
    <div style="background:rgba(232,68,26,0.04);border:1px solid rgba(232,68,26,0.15);border-radius:var(--radius);padding:1rem 1.25rem;">
      ${f('Visitante', r.nombreConductor)}
      ${f('Folio', r.folio)}
      ${f('Empresa', r.empresa || '—')}
      ${f('Placas', r.placas !== 'N/A' ? r.placas : 'Sin vehículo')}
      ${f('Hora de entrada', `${r.fechaEntrada} ${r.horaEntrada}`)}
    </div>`;

  document.getElementById('vChecklist').innerHTML = DOCS_SALIDA.map(d => `
    <div class="check-item" data-key="${d.key}" onclick="this.classList.toggle('checked')">
      <div class="check-box"><i class="bi bi-check"></i></div>
      <div class="check-content">
        <div class="ct">${d.label}</div>
        <div class="cs">${d.desc}</div>
      </div>
    </div>`).join('');
}

function renderResumenVisitante() {
  const r = regSeleccionado;
  const chk = document.querySelectorAll('#vChecklist .check-item.checked').length;
  const tot = document.querySelectorAll('#vChecklist .check-item').length;
  document.getElementById('vResumen').innerHTML = `
    <div style="background:rgba(232,68,26,0.04);border:1px solid rgba(232,68,26,0.15);border-radius:var(--radius);padding:1rem 1.25rem;">
      ${f('Visitante', r.nombreConductor)}
      ${f('Folio', r.folio)}
      ${f('Vehículo', `${r.placas} · ${r.marca} ${r.modelo}`)}
      ${f('Ítems revisados', `${chk} / ${tot}`)}
    </div>`;
}

async function guardarVisitante() {
  const btn = document.getElementById('vBtnGuardar');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  try {
    const res = await fetch(`/api/registros/${encodeURIComponent(regSeleccionado.folio)}/salida`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({
        fechaSalida: document.getElementById('vFechaSalida').value,
        horaSalida: document.getElementById('vHoraSalida').value,
        observacionesSalida: document.getElementById('vObs').value.trim(),
      })
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar salida';
      return;
    }
    vIrPaso(3);
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar salida';
  }
}

// ══════════════════════════════════════
//  FLOTILLA — DataTables + Modal
// ══════════════════════════════════════
let todosVehiculos = [];
let dtCorp = null;

async function cargarCorp() {
  document.getElementById('loadingCorpDT').style.display = 'flex';
  document.getElementById('tablaCorpWrap').style.display = 'none';
  try {
    const res = await fetch('/api/vehiculos', { headers: { 'x-session-token': token } });
    const data = await res.json();
    todosVehiculos = (data.vehiculos || []).filter(v => v.estatus === 'DISPONIBLE');
    renderTablaFlotilla();
  } catch {
    document.getElementById('loadingCorpDT').innerHTML =
      '<i class="bi bi-wifi-off"></i> Error al cargar.';
  }
}

function renderTablaFlotilla() {
  document.getElementById('loadingCorpDT').style.display = 'none';
  document.getElementById('tablaCorpWrap').style.display = 'block';

  const rows = todosVehiculos.map(v => [
    `<span class="badge-corp">${v.placas}</span>`,
    `<span class="dt-nombre">${v.marca} ${v.modelo} · ${v.color}</span>`,
    v.anio || '—',
    v.numEcon ? `N° ${v.numEcon}` : '—',
    `<button class="btn-accion btn-accion-salida-corp" onclick="abrirModalCorp(${v.id})">
       <i class="bi bi-truck"></i> Salida
     </button>`
  ]);

  if (window.dtCorp) { window.dtCorp.destroy(); }
  $('#tablaCorp tbody').empty();

  window.dtCorp = $('#tablaCorp').DataTable({
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
      { title: 'Año', orderable: false },
      { title: 'VIN / N° de Serie', orderable: false },
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
  renderBannerCorp();
  cIrPaso(1);
  abrirModalEl('modalCorp');
}

function renderBannerCorp() {
  const v = vehSeleccionado;
  document.getElementById('cBannerModal').innerHTML = `
    <div class="selected-info" style="border-left-color:var(--corp);">
      <div class="si-name">${v.placas}</div>
      <div class="si-detail">${v.marca} ${v.modelo} · ${v.color}${v.numEcon ? ' · N° ' + v.numEcon : ''}</div>
    </div>`;
}

function cIrPaso(n) {
  if (n === 2) {
    const conductor = document.getElementById('cConductor').value.trim();
    if (!conductor) {
      document.getElementById('cConductorErr').style.display = 'flex';
      return;
    }
    document.getElementById('cConductorErr').style.display = 'none';
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

function renderResumenCorp() {
  const v = vehSeleccionado;
  const f = (k, val) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px dashed rgba(0,0,0,0.08);font-size:0.85rem;">
      <span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);">${k}</span>
      <span style="font-weight:500;">${val || '—'}</span>
    </div>`;
  document.getElementById('cResumenModal').innerHTML = `
    <div style="background:rgba(88,86,214,0.04);border:1px solid rgba(88,86,214,0.15);border-radius:var(--radius);padding:1rem 1.25rem;">
      ${f('Vehículo', `${v.placas} · ${v.marca} ${v.modelo}`)}
      ${f('Conductor', document.getElementById('cConductor').value)}
      ${f('Destino', document.getElementById('cDestino').value || '—')}
      ${f('Fecha', document.getElementById('cFechaSalida').value)}
      ${f('Hora', document.getElementById('cHoraSalida').value)}
    </div>`;
}

async function guardarCorp() {
  const btn = document.getElementById('cBtnGuardar');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  try {
    const res = await fetch(`/api/vehiculos/${vehSeleccionado.id}/salida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({
        conductor: document.getElementById('cConductor').value.trim(),
        destino: document.getElementById('cDestino').value.trim(),
        fechaSalida: document.getElementById('cFechaSalida').value,
        horaSalida: document.getElementById('cHoraSalida').value,
        observaciones: document.getElementById('cObs').value.trim(),
      })
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Registrar salida';
      return;
    }
    cIrPaso(3);
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Registrar salida';
  }
}