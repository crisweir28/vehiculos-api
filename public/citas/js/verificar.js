// public/citas/js/verificar.js
let cita = {};

window.addEventListener('DOMContentLoaded', () => {
  cita = getCita();
  if (!cita.fecha) { window.location.href = 'agenda.html'; return; }
  delete cita.ineBase64; delete cita.ineNombre; delete cita.ineType;
  delete cita.veh_licBase64; delete cita.veh_licNombre; delete cita.veh_licType;

  // Si no tiene vehículo, marcar step 3 como N/A en el progress
  if (cita.tipo === 'visita') {
    const steps = document.querySelectorAll('.step-item');
    if (steps[2]) {
      steps[2].classList.remove('done');
      steps[2].querySelector('.step-circle').textContent = '—';
      steps[2].querySelector('.step-label').style.color = 'var(--muted)';
    }
  }

  renderResumen();
});

function fila(key, label, valor, editable = true) {
  const valHtml = editable
    ? `<span class="res-val editable" onclick="editarCampo(this,'${key}')">${valor || '<span style="color:var(--muted);font-style:italic">—</span>'}</span>`
    : `<span class="res-val">${valor || '—'}</span>`;
  return `<div class="res-row"><span class="res-key">${label}</span>${valHtml}</div>`;
}

function renderResumen() {
  const c = cita;
  const conVeh = c.tipo === 'vehiculo' || c.tipo === 'ambos';
  const [fa, fm, fd] = (c.fecha || '').split('-');
  const fechaLegible = c.fecha ? `${fd}/${fm}/${fa}` : '—';

  let html = '';

  html += `<div class="res-section">
    <div class="res-section-header">
      <div class="res-section-title">📅 Agenda</div>
      <a class="btn-edit-section" href="agenda.html">Editar</a>
    </div>
    ${fila('fecha', 'Fecha de Cita', fechaLegible, false)}
    ${fila('hora', 'Hora de Entrada', c.hora, false)}
  </div>`;

  html += `<div class="res-section">
    <div class="res-section-header">
      <div class="res-section-title">🪪 Datos Personales</div>
      <a class="btn-edit-section" href="datos.html">Editar</a>
    </div>
    ${fila('nombres', 'Nombre(s)', c.nombres)}
    ${fila('apPaterno', 'Apellido Paterno', c.apPaterno)}
    ${fila('apMaterno', 'Apellido Materno', c.apMaterno)}
    ${fila('area', 'Área a dirigirse', c.area)}
    ${fila('telefono', 'Teléfono', c.telefono)}
    ${fila('emailVisitante', 'Correo electrónico', c.emailVisitante, false)}
    <div class="res-row">
      <span class="res-key">Ingresa con vehículo</span>
      <span class="res-val">${conVeh ? '🚗 Sí' : '🚶 No'}</span>
    </div>
    <div class="res-row">
      <span class="res-key">Documentos que lleva</span>
      <span class="res-val">${(c.documentos || []).length ? c.documentos.map(d => `<span class="doc-chip">📄 ${d}</span>`).join('') : '<span style="color:var(--muted)">Ninguno</span>'}</span>
    </div>
  </div>`;

  if (conVeh) {
    html += `<div class="res-section">
      <div class="res-section-header">
        <div class="res-section-title">🚗 Vehículo</div>
        <a class="btn-edit-section" href="vehiculo.html">Editar</a>
      </div>
      ${fila('veh_placas', 'Placas', c.veh_placas)}
      ${fila('veh_marca', 'Marca', c.veh_marca)}
      ${fila('veh_modelo', 'Modelo', c.veh_modelo)}
      ${fila('veh_color', 'Color', c.veh_color)}
      ${fila('veh_anio', 'Año', c.veh_anio)}
      ${fila('veh_numSerie', 'Núm. de Serie', c.veh_numSerie)}
      ${fila('veh_obs', 'Observaciones', c.veh_obs)}
    </div>`;
  }

  const docsLabels = { oficio: 'N° de Oficio', licencia: 'Licencia de Conducir', ine: 'INE / Documento Oficial' };
  html += `<div class="res-section">
    <div class="res-section-header">
      <div class="res-section-title">📋 Documentación</div>
      <a class="btn-edit-section" href="documentacion.html">Editar</a>
    </div>
    ${(c.docsCheck || []).map(k => `<div class="res-row"><span class="res-key">${docsLabels[k] || k}</span><span class="res-val" style="color:var(--success);">✓ Confirmado</span></div>`).join('')}
  </div>`;

  document.getElementById('resumenContenido').innerHTML = html;
}

function editarCampo(el, key) {
  if (el.querySelector('input')) return;
  const valorActual = cita[key] || '';
  const input = document.createElement('input');
  input.value = valorActual;
  input.style.cssText = 'background:var(--surface2);border:1px solid var(--accent);color:var(--text);border-radius:4px;padding:2px 8px;font-size:0.88rem;width:100%;outline:none;';
  el.replaceWith(input);
  input.focus(); input.select();
  const guardarEdicion = () => {
    const nuevoVal = input.value.trim();
    cita[key] = nuevoVal;
    setCita(cita);
    const span = document.createElement('span');
    span.className = 'res-val editable';
    span.onclick = () => editarCampo(span, key);
    span.textContent = nuevoVal || '—';
    input.replaceWith(span);
  };
  input.addEventListener('blur', guardarEdicion);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') guardarEdicion(); });
}

function generarOficio() {
  const ahora = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `OF-${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

async function guardar() {
  const btn = document.getElementById('btnGuardar');
  btn.disabled = true; btn.textContent = 'Guardando...';
  const oficio = generarOficio();
  const payload = {
    oficio,
    creadoEn:       new Date().toISOString(),
    tipo:           cita.tipo,
    fecha:          cita.fecha,
    hora:           cita.hora,
    nombres:        cita.nombres,
    apPaterno:      cita.apPaterno,
    apMaterno:      cita.apMaterno,
    area:           cita.area,
    telefono:       cita.telefono,
    documentos:     cita.documentos     || [],
    docsCheck:      cita.docsCheck      || [],
    veh_placas:     cita.veh_placas     || null,
    veh_marca:      cita.veh_marca      || null,
    veh_modelo:     cita.veh_modelo     || null,
    veh_color:      cita.veh_color      || null,
    veh_anio:       cita.veh_anio       || null,
    veh_numSerie:   cita.veh_numSerie   || null,
    veh_obs:        cita.veh_obs        || null,
    emailVisitante: cita.emailVisitante || null,
    emailAnfitrion: cita.emailAnfitrion || null,
  };
  try {
    const res  = await fetch('/api/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false; btn.textContent = '✓ Guardar y Generar Oficio';
      return;
    }

    sessionStorage.removeItem('cita_draft');
    document.getElementById('areaDisplay').textContent = cita.area || '—';
    document.getElementById('successCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'none';
    document.querySelector('.progress-wrap').style.display = 'none';
    document.querySelector('.step-indicator').style.display = 'none';

    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
      history.pushState(null, '', location.href);
      window.location.href = 'agenda.html';
    });

  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false; btn.textContent = '✓ Guardar y Generar Oficio';
  }
}

function getCita() { try { return JSON.parse(sessionStorage.getItem('cita_draft') || '{}'); } catch { return {}; } }
function setCita(d) { sessionStorage.setItem('cita_draft', JSON.stringify(d)); }