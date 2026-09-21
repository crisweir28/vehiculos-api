
let fechaSeleccionada = null;
let horaSeleccionada = null;
let vistaAnio, vistaMes;
let horasOcupadas = [];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const HORAS = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

window.addEventListener('DOMContentLoaded', () => {
  const hoy = new Date();
  vistaAnio = hoy.getFullYear();
  vistaMes = hoy.getMonth();
  renderCalendario();
  renderHoras();

  // Recuperar si vino de atrás
  const cita = getCita();
  if (cita.fecha) {
    const [a, m, d] = cita.fecha.split('-').map(Number);
    fechaSeleccionada = cita.fecha;
    vistaAnio = a; vistaMes = m - 1;
    renderCalendario();
  }
  if (cita.hora) {
    horaSeleccionada = cita.hora;
    renderHoras();
  }
  actualizarResumen();
});

function renderCalendario() {
  const grid = document.getElementById('calGrid');
  // Limpiar días anteriores
  grid.querySelectorAll('.cal-day').forEach(el => el.remove());
  document.getElementById('calMes').textContent = `${MESES[vistaMes]} ${vistaAnio}`;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const primer = new Date(vistaAnio, vistaMes, 1).getDay();
  const total = new Date(vistaAnio, vistaMes + 1, 0).getDate();

  for (let i = 0; i < primer; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }
  for (let d = 1; d <= total; d++) {
    const fecha = new Date(vistaAnio, vistaMes, d);
    const key = `${vistaAnio}-${String(vistaMes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    if (fecha < hoy) { el.classList.add('disabled'); }
    else {
      if (fecha.toDateString() === hoy.toDateString()) el.classList.add('today');
      if (fechaSeleccionada === key) el.classList.add('selected');
      el.onclick = () => seleccionarFecha(key, el);
    }
    grid.appendChild(el);
  }
}

async function seleccionarFecha(key, el) {
  document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  fechaSeleccionada = key;
  horaSeleccionada = null;
  document.getElementById('fechaError').style.display = 'none';

  // Traer TODAS las citas y filtrar por fecha en el cliente
  try {
    const res = await fetch(`/api/citas/fecha?fecha=${key}`);
    const data = await res.json();
    horasOcupadas = (data.citas || [])
      .filter(c => c.estatus !== 'RECHAZADA' && c.estatus !== 'CANCELADA')
      .map(c => c.hora ? String(c.hora).slice(0, 5) : null)
      .filter(Boolean);
    console.log('[AGENDA] Horas ocupadas en', key, ':', horasOcupadas);
  } catch {
    horasOcupadas = [];
  }

  renderHoras();
  actualizarResumen();
}

function cambiarMes(dir) {
  vistaMes += dir;
  if (vistaMes > 11) { vistaMes = 0; vistaAnio++; }
  if (vistaMes < 0) { vistaMes = 11; vistaAnio--; }
  renderCalendario();
}

function renderHoras() {
  const grid = document.getElementById('horaGrid');
  grid.innerHTML = '';

  const ahora = new Date();
  const esHoy = fechaSeleccionada === `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

  HORAS.forEach(h => {
    const btn = document.createElement('div');
    const ocupada = horasOcupadas.includes(h);

    // Bloquear horas pasadas si es hoy
    const [hh, mm] = h.split(':').map(Number);
    const minutos = hh * 60 + mm;
    const pasada = esHoy && minutos <= horaActual;

    btn.className = 'hora-btn' +
      (horaSeleccionada === h ? ' selected' : '') +
      (ocupada ? ' ocupada' : '') +
      (pasada ? ' pasada' : '');
    btn.textContent = h;

    if (!ocupada && !pasada) {
      btn.onclick = () => seleccionarHora(h, btn);
    }
    grid.appendChild(btn);
  });
}

function seleccionarHora(h, el) {
  document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  horaSeleccionada = h;
  document.getElementById('horaError').style.display = 'none';
  actualizarResumen();
}

function actualizarResumen() {
  const div = document.getElementById('seleccionResumen');
  if (fechaSeleccionada && horaSeleccionada) {
    const [a, m, d] = fechaSeleccionada.split('-');
    document.getElementById('resumenTexto').textContent =
      `${d}/${m}/${a} · ${horaSeleccionada} hrs`;
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }
}

function continuar() {
  let ok = true;
  if (!fechaSeleccionada) { document.getElementById('fechaError').style.display = 'block'; ok = false; }
  if (!horaSeleccionada) { document.getElementById('horaError').style.display = 'block'; ok = false; }
  if (!ok) return;
  const cita = getCita();
  cita.fecha = fechaSeleccionada;
  cita.hora = horaSeleccionada;
  setCita(cita);
  window.location.href = 'datos.html';
}

function getCita() { try { return JSON.parse(sessionStorage.getItem('cita_draft') || '{}'); } catch { return {}; } }
function setCita(d) { sessionStorage.setItem('cita_draft', JSON.stringify(d)); }
