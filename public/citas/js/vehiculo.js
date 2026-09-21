//public/citas/js/vehiculo.js
const COLORES = [
  { nombre: 'Blanco', hex: '#f0f0f0' }, { nombre: 'Negro', hex: '#1a1a1a' },
  { nombre: 'Gris', hex: '#808080' }, { nombre: 'Plata', hex: '#c0c0c0' },
  { nombre: 'Rojo', hex: '#cc2200' }, { nombre: 'Azul', hex: '#1a4fa0' },
  { nombre: 'Verde', hex: '#2d7a2d' }, { nombre: 'Amarillo', hex: '#e6c800' },
  { nombre: 'Naranja', hex: '#e06000' }, { nombre: 'Café', hex: '#7a4a1a' },
  { nombre: 'Beige', hex: '#d4b896' }, { nombre: 'Morado', hex: '#6a1a8a' },
];

let licBase64 = null, licNombre = null, licType = null;
let colorSeleccionado = null;

window.addEventListener('DOMContentLoaded', () => {
  renderColores();
  const cita = getCita();
  if (cita.veh_licBase64) { licBase64 = cita.veh_licBase64; licNombre = cita.veh_licNombre; licType = cita.veh_licType; mostrarLic(); }
  if (cita.veh_placas) document.getElementById('placas').value = cita.veh_placas;
  if (cita.veh_marca) document.getElementById('marca').value = cita.veh_marca;
  if (cita.veh_modelo) document.getElementById('modelo').value = cita.veh_modelo;
  if (cita.veh_anio) document.getElementById('anio').value = cita.veh_anio;
  if (cita.veh_color) { colorSeleccionado = cita.veh_color; document.getElementById('colorTexto').value = cita.veh_color; renderColores(); }
  if (cita.veh_numSerie) document.getElementById('numSerie').value = cita.veh_numSerie;
  if (cita.veh_obs) document.getElementById('observaciones').value = cita.veh_obs;
});

function renderColores() {
  const grid = document.getElementById('colorGrid');
  grid.innerHTML = COLORES.map(c =>
    `<div class="color-chip ${colorSeleccionado === c.nombre ? 'selected' : ''}" style="background:${c.hex};" title="${c.nombre}" onclick="selColor('${c.nombre}', this)"></div>`
  ).join('');
}

function selColor(nombre, el) {
  colorSeleccionado = nombre;
  document.getElementById('colorTexto').value = nombre;
  document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('colorError').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('colorTexto').addEventListener('input', e => {
    colorSeleccionado = e.target.value.trim();
    document.querySelectorAll('.color-chip').forEach(c => c.classList.remove('selected'));
  });
});

function handleLic(input) { if (input.files[0]) procesarLic(input.files[0]); }

function procesarLic(file) {
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'Archivo muy grande', text: 'El archivo no debe superar 5 MB.', confirmButtonColor: '#e8441a' });
    return;
  }
  licNombre = file.name; licType = file.type;
  const r = new FileReader();
  r.onload = e => { licBase64 = e.target.result; mostrarLic(); document.getElementById('licError').style.display = 'none'; };
  r.readAsDataURL(file);
}

function mostrarLic() {
  const zone = document.getElementById('licZone');
  const prev = document.getElementById('licPreview');
  document.getElementById('licName').textContent = licNombre;
  zone.classList.add('has-file');
  zone.querySelector('.up-icon').textContent = '✅';
  zone.querySelector('.up-label').textContent = 'Licencia cargada';
  const img = document.getElementById('licImg');
  if (licType && licType.startsWith('image/')) { img.src = licBase64; img.style.display = 'block'; }
  else img.style.display = 'none';
  prev.style.display = 'block';
}

function removeLic() {
  licBase64 = null; licNombre = null; licType = null;
  const zone = document.getElementById('licZone');
  zone.classList.remove('has-file');
  zone.querySelector('.up-icon').textContent = '🪪';
  zone.querySelector('.up-label').textContent = 'Arrastra o haz clic para subir';
  document.getElementById('licPreview').style.display = 'none';
  document.getElementById('licFile').value = '';
}

function v(id) { return document.getElementById(id).value.trim(); }

function continuar() {
  let ok = true;
  if (!licBase64) { document.getElementById('licError').style.display = 'block'; ok = false; }
  ['placas', 'marca', 'modelo'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('is-invalid');
    const prev = el.nextElementSibling;
    if (prev && prev.classList.contains('invalid-msg')) prev.remove();
    if (!el.value.trim()) {
      el.classList.add('is-invalid');
      const m = document.createElement('div'); m.className = 'invalid-msg'; m.textContent = 'Campo requerido.'; el.after(m); ok = false;
    }
  });
  const color = document.getElementById('colorTexto').value.trim() || colorSeleccionado;
  if (!color) { document.getElementById('colorError').style.display = 'block'; ok = false; }
  if (!ok) return;

  const cita = getCita();
  cita.veh_licBase64 = licBase64;
  cita.veh_licNombre = licNombre;
  cita.veh_licType = licType;
  cita.veh_placas = v('placas');
  cita.veh_marca = v('marca');
  cita.veh_modelo = v('modelo');
  cita.veh_anio = v('anio');
  cita.veh_color = color;
  cita.veh_numSerie = v('numSerie');
  cita.veh_obs = v('observaciones');
  setCita(cita);
  window.location.href = 'documentacion.html';
}

function getCita() { try { return JSON.parse(sessionStorage.getItem('cita_draft') || '{}'); } catch { return {}; } }
function setCita(d) { sessionStorage.setItem('cita_draft', JSON.stringify(d)); }
