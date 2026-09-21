// public/js/flotilla.js
const token = localStorage.getItem('vehilog_token');
const rol = localStorage.getItem('vehilog_rol');
let vehiculoActual = null;

// ─── INIT ─────────────────────────────────────────────
(async () => {
  if (!token) return (window.location.href = 'login.html');
  const res = await fetch('/api/auth/verificar', {
    headers: { 'x-session-token': token }
  }).catch(() => null);
  if (!res || !res.ok) return (window.location.href = 'login.html');
  cargarVehiculos();
})();

// ─── VEHÍCULOS ────────────────────────────────────────
async function cargarVehiculos() {
  const loading = document.getElementById('loadingVeh');
  const grid = document.getElementById('vehGrid');
  const empty = document.getElementById('emptyVeh');
  loading.style.display = 'flex';
  grid.innerHTML = '';
  empty.style.display = 'none';
  try {
    const res = await fetch('/api/vehiculos', { headers: { 'x-session-token': token } });
    const data = await res.json();
    loading.style.display = 'none';
    if (!data.vehiculos.length) { empty.style.display = 'block'; return; }
    grid.innerHTML = data.vehiculos.map(renderVehiculoCard).join('');
  } catch {
    loading.innerHTML = '<i class="bi bi-wifi-off"></i> Error al cargar.';
  }
}

function renderVehiculoCard(v) {
  const esRuta = v.estatus === 'EN RUTA';
  const esMant = v.estatus === 'MANTENIMIENTO';
  const clsCard = esRuta ? 'en-ruta' : esMant ? 'mantenimiento' : 'disponible';
  const clsEst = esRuta ? 'est-en-ruta' : esMant ? 'est-mantenimiento' : 'est-disponible';
  return `
    <div class="veh-card ${clsCard}">
      ${rol === 'admin' ? `
  <button class="btn-del-veh" onclick="eliminar(${v.id}, '${v.placas}')">
    <i class="bi bi-x"></i>
  </button>` : ''}
      <div class="veh-placas">${v.placas}</div>
      <div class="veh-info">
        ${v.marca} ${v.modelo} · ${v.color}
        ${v.anio ? ' · ' + v.anio : ''}
        ${v.numEcon ? ' · ' + v.numEcon : ''}
      </div>
      <span class="veh-estatus ${clsEst}">${v.estatus}</span>
      ${esRuta ? `<div class="veh-conductor"><i class="bi bi-person-fill"></i> ${v.conductorActual}</div>` : ''}
      <button class="btn-hist" onclick='verHistorial(${v.id})'>
        <i class="bi bi-clock-history"></i> Ver historial
      </button>
    </div>`;
}

async function darDeAlta() {
  const btn = document.getElementById('btnAlta');
  const placas = document.getElementById('placas').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const color = document.getElementById('color').value.trim();
  const anio = document.getElementById('anio').value.trim();
  const numEcon = document.getElementById('numEcon').value.trim();
  hide('altaOk'); hide('altaErr');
  if (!placas || !marca || !modelo || !color) { show('altaErr', 'Completa los campos requeridos.'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  try {
    const res = await fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ placas, marca, modelo, color, anio: anio || null, numEcon: numEcon || null })
    });
    const data = await res.json();
    if (!res.ok) { show('altaErr', data.error); }
    else {
      show('altaOk', `Vehículo ${data.placas} registrado correctamente.`);
      ['placas', 'marca', 'modelo', 'color', 'anio', 'numEcon'].forEach(id => document.getElementById(id).value = '');
      cargarVehiculos();
    }
  } catch { show('altaErr', 'No se pudo conectar.'); }
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-plus-lg"></i> Registrar';
}

async function eliminar(id, placas) {
  const conf = await Swal.fire({
  title: `¿Eliminar ${placas}?`,
  text: 'Esta acción no se puede deshacer.',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar',
  confirmButtonColor: '#e8441a',
  cancelButtonColor: '#8a8a8e',
});
if (!conf.isConfirmed) return;
  try {
    const res = await fetch(`/api/vehiculos/${id}`, { method: 'DELETE', headers: { 'x-session-token': token } });
    const data = await res.json();
    if (!res.ok) { Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' }); }
    else cargarVehiculos();
  } catch { Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' }); }
}

// ─── HISTORIAL PANEL ──────────────────────────────────
async function verHistorial(id) {
  const res = await fetch(`/api/vehiculos/${id}`, { headers: { 'x-session-token': token } });
  const data = await res.json();
  const v = data.vehiculo;
  vehiculoActual = v;
  abrirPanelHistorial();
  renderInfoVehiculo(v);
  cambiarTab('usuarios');
  setLoader();

  try {
    const resMov = await fetch(`/api/vehiculos/${v.id}/movimientos`, { headers: { 'x-session-token': token } });
    const dataMov = await resMov.json();
    renderMovimientos(dataMov.movimientos || []);
  } catch {
    document.getElementById('histUsuarios').innerHTML =
      '<div style="color:var(--danger);padding:1rem;">Error al cargar historial.</div>';
  }

  cargarMantenimientos(v);
}

function abrirPanelHistorial() {
  document.getElementById('histPanel').classList.add('open');
  document.getElementById('histOverlay').classList.add('open');
  document.body.classList.add('no-scroll');
}

function setLoader() {
  document.getElementById('histUsuarios').innerHTML =
    '<div style="color:var(--muted);padding:1rem;text-align:center;"><i class="bi bi-hourglass-split"></i> Cargando...</div>';
  document.getElementById('histMantenimiento').innerHTML = '';
}

// ─── MOVIMIENTOS ──────────────────────────────────────
function renderMovimientos(movimientos) {
  const cont = document.getElementById('histUsuarios');
  if (!movimientos.length) {
    cont.innerHTML = `<div class="hist-empty"><i class="bi bi-inbox"></i><p>Sin movimientos registrados.</p></div>`;
    return;
  }
  cont.innerHTML = movimientos.map(m => {
    const completado = m.tipo === 'COMPLETADO';
    return `
      <div class="mov-item ${completado ? 'completado' : 'en-ruta'}">
        <div class="mov-tipo">
          <span class="mov-tipo-badge ${completado ? 'badge-comp' : 'badge-ruta'}">
            <i class="bi bi-${completado ? 'check-circle-fill' : 'truck'}"></i>
               ${completado ? 'Completado' : 'En ruta'}
            </span>
        ${m.destino ? `<span class="mov-tiempo"><i class="bi bi-geo-alt-fill"></i> ${m.destino}</span>` : ''}
        </div>
        <div class="mov-conductor">
          <i class="bi bi-person"></i> <strong>${m.conductor}</strong>
        </div>
        <div class="mov-fechas">
          <span><strong>Salida: </strong> ${m.fechaSalida} ${m.horaSalida}</span>
          ${completado
        ? `<span><strong>Entrada: </strong>${m.fechaEntrada} ${m.horaEntrada}</span>`
        : ``
      }
        </div>
        ${m.observaciones ? `<div class="mov-obs"> <strong> Comentario: </strong> ${m.observaciones}</div>` : ''}
      </div>`;
  }).join('');
}

// ─── MANTENIMIENTOS ───────────────────────────────────
function cargarMantenimientos(v) {
  const cont = document.getElementById('histMantenimiento');
  const lista = v.mantenimientos || (v.mantenimiento ? [v.mantenimiento] : []);

  if (!lista.length) {
    cont.innerHTML = `<div class="hist-empty"><i class="bi bi-tools"></i><p>Sin mantenimientos registrados.</p></div>`;
    return;
  }

  cont.innerHTML = [...lista].reverse().map(m => `
    <div class="mov-item" style="border-left:3px solid #f5a623;">
      <div class="mov-tipo">
        <span class="mov-tipo-badge" style="background:rgba(245,166,35,0.1);color:#f5a623;border:1px solid rgba(245,166,35,0.3);">
          <i class="bi bi-tools"></i> Mantenimiento
        </span>
      </div>
      <div class="mov-det"><strong>Razón:</strong> ${m.razon}</div>
      <div class="mov-fechas">
        <span><strong>Entrada Mantenimiento: </strong>${new Date(m.fechaEntrada || m.fecha).toLocaleString('es-MX')}</span>
      ${m.fechaSalida
      ? `<span><strong>Salida Mantenimiento: </strong>${new Date(m.fechaSalida).toLocaleString('es-MX')}</span>`
      : `<span style="color:#f5a623;">EN MANTENIMIENTO</span>`}
      </div>
    </div>`).join('');
}

// ─── TABS ─────────────────────────────────────────────
function cambiarTab(tab) {
  document.getElementById('tabUsuarios').classList.toggle('active', tab === 'usuarios');
  document.getElementById('tabMantenimiento').classList.toggle('active', tab === 'mantenimiento');
  document.getElementById('histUsuarios').style.display = tab === 'usuarios' ? 'block' : 'none';
  document.getElementById('histMantenimiento').style.display = tab === 'mantenimiento' ? 'block' : 'none';
}

// ─── INFO VEHÍCULO + BOTONES ESTATUS ─────────────────
function renderInfoVehiculo(v) {
  const esRuta = v.estatus === 'EN RUTA';
  const esMant = v.estatus === 'MANTENIMIENTO';
  const esDisp = v.estatus === 'DISPONIBLE';
  const clsEst = esRuta ? 'est-en-ruta' : esMant ? 'est-mantenimiento' : 'est-disponible';

  document.getElementById('histVehInfo').innerHTML = `
    <div class="hist-veh-banner">
      <div class="hvb-datos">
        <div class="hvb-placas">${v.placas}</div>
        <div class="hvb-det">${v.marca} ${v.modelo} · ${v.color}${v.anio ? ' · ' + v.anio : ''}</div>
        ${v.numEcon ? `<div class="hvb-det">VIN: ${v.numEcon}</div>` : ''}
      </div>
      <span class="veh-estatus ${clsEst}">${v.estatus}</span>
    </div>
    ${esRuta ? `
    <div class="hvb-ruta-info">
      <i class="bi bi-person-fill"></i> En ruta con <strong>${v.conductorActual}</strong>
    </div>` : ''}
    ${esMant && v.mantenimiento ? `
    <div class="hvb-mant-info">
      <div><i class="bi bi-tools"></i> <strong>Razón actual:</strong> ${v.mantenimiento.razon}</div>
      <div>Entrada Mantenimiento: ${new Date(v.mantenimiento.fechaEntrada || v.mantenimiento.fecha).toLocaleString('es-MX')}</div>
    </div>` : ''}
    <div class="hist-estatus-btns">
      ${esDisp ? `
        <button class="btn-est-mant" onclick="iniciarMantenimiento()">
          <i class="bi bi-tools"></i> Enviar a mantenimiento
        </button>
        <div id="formMantenimiento" style="display:none;margin-top:0.5rem;">
          <textarea id="mantRazon" class="field-input" rows="2"
            placeholder="Razón del mantenimiento (requerido)..."
            style="resize:none;font-size:0.82rem;width:100%;"></textarea>
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem;">
            <button class="btn-est-mant" onclick="confirmarMantenimiento()" style="flex:1;justify-content:center;">
              <i class="bi bi-check-lg"></i> Confirmar
            </button>
            <button onclick="cancelarMantenimiento()"
              style="flex:1;background:var(--bg);border:1px solid var(--border);
                     border-radius:var(--radius-sm);padding:0.5rem;cursor:pointer;
                     font-size:0.8rem;font-family:var(--font);">
              Cancelar
            </button>
          </div>
        </div>` : ''}
      ${esMant ? `
        <button class="btn-est-disp" onclick="guardarEstatus('DISPONIBLE', '')">
          <i class="bi bi-check-circle"></i> Marcar como disponible
        </button>` : ''}
      ${esRuta ? `
        <div style="font-size:0.75rem;color:var(--muted);padding:0.35rem 0;">
          <i class="bi bi-info-circle"></i> No se puede cambiar el estatus mientras está en ruta.
        </div>` : ''}
    </div>`;
}

function iniciarMantenimiento() {
  document.getElementById('formMantenimiento').style.display = 'block';
  document.getElementById('mantRazon').focus();
}

function cancelarMantenimiento() {
  document.getElementById('formMantenimiento').style.display = 'none';
  document.getElementById('mantRazon').value = '';
}

async function confirmarMantenimiento() {
  const razon = document.getElementById('mantRazon').value.trim();
  if (!razon) {
    document.getElementById('mantRazon').style.borderColor = 'var(--danger)';
    return;
  }
  document.getElementById('mantRazon').style.borderColor = '';
  await guardarEstatus('MANTENIMIENTO', razon);
}

async function guardarEstatus(nuevoEstatus, razon) {
  const v = vehiculoActual;
  try {
    const res = await fetch(`/api/vehiculos/${v.id}/estatus`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-token': token },
      body: JSON.stringify({ estatus: nuevoEstatus, razon })
    });
    const data = await res.json();
    if (!res.ok) { Swal.fire({ icon: 'error', title: 'Error', text: data.error, confirmButtonColor: '#e8441a' }); return; }
    vehiculoActual = data.vehiculo || { ...v, estatus: nuevoEstatus };
    renderInfoVehiculo(vehiculoActual);
    cargarMantenimientos(vehiculoActual);
    cargarVehiculos();
    if (nuevoEstatus === 'MANTENIMIENTO') cambiarTab('mantenimiento');
  } catch { Swal.fire({ icon: 'error', title: 'Sin conexión', text: 'No se pudo conectar con el servidor.', confirmButtonColor: '#e8441a' }); }
}

// ─── CERRAR ───────────────────────────────────────────
function cerrarHistorial() {
  document.getElementById('histPanel').classList.remove('open');
  document.getElementById('histOverlay').classList.remove('open');
  document.body.classList.remove('no-scroll');
  vehiculoActual = null;
}

function show(id, msg) {
  const el = document.getElementById(id);
  el.innerHTML = `<i class="bi bi-${id.includes('Ok') ? 'check' : 'exclamation'}-circle"></i> ${msg}`;
  el.style.display = 'flex';
}
function hide(id) { document.getElementById(id).style.display = 'none'; }