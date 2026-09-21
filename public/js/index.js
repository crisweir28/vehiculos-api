// public/js/index.js
(async () => {
  const token = localStorage.getItem('vehilog_token');
  if (!token) { localStorage.setItem('vehilog_redirect', 'index.html'); window.location.href = 'login.html'; return; }
  try {
    const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } });
    if (!res.ok) { localStorage.setItem('vehilog_redirect', 'index.html'); window.location.href = 'login.html'; }
  } catch { localStorage.setItem('vehilog_redirect', 'index.html'); window.location.href = 'login.html'; }
})();

let currentBlock = 0;
let conVehiculo  = false;   // controla si el bloque 2 se muestra o se salta

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('fechaEntrada').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('horaEntrada').value  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const folio = `ENT-${String(Math.floor(Math.random()*90000)+10000)}`;
  document.getElementById('folio').value = folio;
  document.getElementById('folioHint').textContent = '✓ Folio generado automáticamente';
  updateHeaderFolio(folio);
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('folio').addEventListener('input', e => updateHeaderFolio(e.target.value || '—'));
});

function updateHeaderFolio(val) {
  const hf = document.getElementById('headerFolio');
  hf.textContent = `Folio: ${val}`;
  hf.style.display = 'block';
}

// ── TOGGLE VEHÍCULO ──
function setVehiculo(valor) {
  conVehiculo = valor;
  document.getElementById('toggleSi').classList.toggle('active', valor);
  document.getElementById('toggleNo').classList.toggle('active', !valor);
  // Actualizar step 3 (vehículo) visualmente
  const stepVeh = document.querySelector('[data-step="2"]');
  if (valor) {
    stepVeh.style.opacity = '1';
  } else {
    stepVeh.style.opacity = '0.35';
    stepVeh.querySelectorAll('.step-circle, .step-label').forEach(el => el.style.color = '');
  }
}

// ── VALIDADORES POR BLOQUE ──
const validators = {
  0: () => validateFields(['fechaEntrada','horaEntrada','folio']),
  1: () => validateFields(['nombreConductor','empresa','telefono','identificacion']),
  2: () => validateFields(['placas','marca','modelo','color']),
};

function validateFields(ids) {
  let ok = true;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-invalid');
    const prev = el.parentNode.querySelector('.invalid-feedback');
    if (prev) prev.remove();
    if (!el.value.trim()) {
      el.classList.add('is-invalid');
      const msg = document.createElement('div');
      msg.className = 'invalid-feedback';
      msg.textContent = 'Este campo es requerido.';
      el.after(msg);
      ok = false;
    }
  });
  return ok;
}

// ── NAVEGACIÓN ──
function goNext(fromBlock) {
  if (validators[fromBlock] && !validators[fromBlock]()) return;

  let nextBlock;
  if (fromBlock === 1) {
    // Después de conductor: si viene con vehículo → bloque 2, si no → bloque 3 (resumen)
    nextBlock = conVehiculo ? 2 : 3;
  } else if (fromBlock === 2) {
    nextBlock = 3;
  } else {
    nextBlock = fromBlock + 1;
  }

  if (nextBlock === 3) buildSummary();
  setBlock(nextBlock, false);
}

function goBack(fromBlock) {
  let prevBlock;
  if (fromBlock === 3) {
    // Si venía del resumen: si no hay vehículo → bloque 1, si hay → bloque 2
    prevBlock = conVehiculo ? 2 : 1;
  } else {
    prevBlock = fromBlock - 1;
  }
  setBlock(prevBlock, true);
}

function setBlock(idx, goingBack) {
  document.getElementById(`block-${currentBlock}`).classList.remove('active');
  currentBlock = idx;
  const next = document.getElementById(`block-${currentBlock}`);
  next.classList.toggle('going-back', goingBack);
  next.classList.add('active');
  setTimeout(() => next.classList.remove('going-back'), 400);
  updateSteps();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSteps() {
  // Mapeo visual: bloque 0→step0, bloque 1→step1, bloque 2→step2, bloque 3→step3
  // Si no hay vehículo, step2 se "salta" visualmente
  const stepMap = conVehiculo
    ? [0, 1, 2, 3]   // con vehículo: 4 pasos normales
    : [0, 1, 3];      // sin vehículo: salta step2

  document.querySelectorAll('.step-item').forEach((el, i) => {
    const stepIdx = parseInt(el.dataset.step);
    el.classList.remove('active','done');

    if (!conVehiculo && stepIdx === 2) {
      // Step de vehículo: tenue si no aplica
      el.style.opacity = '0.3';
      return;
    }
    el.style.opacity = '1';

    if (stepIdx < currentBlock) el.classList.add('done');
    if (stepIdx === currentBlock) el.classList.add('active');
    // Si saltamos vehículo y estamos en resumen (bloque 3), marcar step1 como done
    if (!conVehiculo && currentBlock === 3 && stepIdx === 1) el.classList.add('done');
  });

  // Conectores
  for (let i = 0; i < 3; i++) {
    const conn = document.getElementById(`conn-${i}`);
    if (!conn) continue;
    conn.classList.toggle('done', i < currentBlock);
  }
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ── RESUMEN ──
function buildSummary() {
  const sections = [
    {
      title: 'Datos de Entrada',
      rows: [
        ['Fecha', val('fechaEntrada')],
        ['Hora de Entrada', val('horaEntrada')],
        ['Folio', val('folio')],
      ]
    },
    {
      title: 'Persona',
      rows: [
        ['Nombre', val('nombreConductor')],
        ['Empresa / Área', val('empresa')],
        ['Teléfono', val('telefono')],
        ['Identificación', val('identificacion')],
        ['Ingresa con vehículo', conVehiculo ? '🚗 Sí' : '🚶 No'],
      ]
    },
  ];

  if (conVehiculo) {
    sections.push({
      title: 'Vehículo',
      rows: [
        ['Placas', val('placas')],
        ['Marca', val('marca')],
        ['Modelo', val('modelo')],
        ['Color', val('color')],
        ['Año', val('anio') || '—'],
        ['VIN / Serie', val('vin') || '—'],
      ]
    });
  }

  let html = '';
  sections.forEach(sec => {
    html += `<div class="summary-section"><div class="summary-section-title">${sec.title}</div>`;
    sec.rows.forEach(([k, v]) => {
      html += `<div class="summary-row"><span class="key">${k}</span><span class="val">${v || '—'}</span></div>`;
    });
    html += `</div>`;
  });
  document.getElementById('summaryContent').innerHTML = html;
}

// ── GUARDAR ──
async function submitForm() {
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

  const payload = {
    fechaEntrada:    val('fechaEntrada'),
    horaEntrada:     val('horaEntrada'),
    folio:           val('folio'),
    tipoMovimiento:  'ENTRADA',
    nombreConductor: val('nombreConductor'),
    empresa:         val('empresa'),
    numEmpleado:     val('numEmpleado'),
    telefono:        val('telefono'),
    identificacion:  val('identificacion'),
    conVehiculo,
    placas:          conVehiculo ? val('placas')  : 'N/A',
    marca:           conVehiculo ? val('marca')   : 'N/A',
    modelo:          conVehiculo ? val('modelo')  : 'N/A',
    color:           conVehiculo ? val('color')   : 'N/A',
    anio:            conVehiculo ? val('anio')    : null,
    vin:             conVehiculo ? val('vin')     : null,
    estatus:         'ACTIVO',
  };

  try {
    const res = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': localStorage.getItem('vehilog_token') || '' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' });
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar Entrada';
      return;
    }
    for (let i = 0; i < 4; i++) {
      const b = document.getElementById(`block-${i}`);
      if (b) b.classList.remove('active');
    }
    document.getElementById('successFolio').textContent = `Folio: ${data.folio}`;
    document.getElementById('successScreen').classList.add('active');
    document.querySelectorAll('.step-item').forEach(el => {
      el.classList.remove('active');
      if (el.style.opacity !== '0.3') el.classList.add('done');
    });
  } catch {
    Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' });
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar Entrada';
  }
}

// ── RESET ──
function resetForm() {
  document.querySelectorAll('.field-input, .form-control').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
  conVehiculo = false;
  setVehiculo(false);
  document.getElementById('successScreen').classList.remove('active');
  document.getElementById('btnSubmit').disabled = false;
  document.getElementById('btnSubmit').innerHTML = '<i class="bi bi-check-lg"></i> Guardar Entrada';
  currentBlock = 0;
  document.getElementById('block-0').classList.add('active');

  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  document.getElementById('fechaEntrada').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('horaEntrada').value  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const folio = `ENT-${String(Math.floor(Math.random()*90000)+10000)}`;
  document.getElementById('folio').value = folio;
  document.getElementById('folioHint').textContent = '✓ Folio generado automáticamente';
  updateHeaderFolio(folio);
  updateSteps();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}