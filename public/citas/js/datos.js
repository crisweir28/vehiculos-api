
    let documentos = [];
    let conVehiculo = 'no';

    window.addEventListener('DOMContentLoaded', async() => {
      await cargarAreas();
      const cita = getCita();
      if (cita.emailVisitante) document.getElementById('emailVisitante').value = cita.emailVisitante;
      if (cita.nombres) document.getElementById('nombres').value = cita.nombres;
      if (cita.apPaterno) document.getElementById('apPaterno').value = cita.apPaterno;
      if (cita.apMaterno) document.getElementById('apMaterno').value = cita.apMaterno;
      if (cita.area) document.getElementById('area').value = cita.area;
      if (cita.telefono) document.getElementById('telefono').value = cita.telefono;
      if (cita.documentos) { documentos = cita.documentos; renderDocs(); }
      if (cita.tipo === 'vehiculo' || cita.tipo === 'ambos') {
        document.getElementById('checkVehiculo').classList.add('checked');
        conVehiculo = 'si';
      }
    });

    async function cargarAreas() {
    try {
      const res  = await fetch('/api/areas');
      const data = await res.json();
      const sel  = document.getElementById('area');
      const valorActual = sel.value; // preservar si ya había selección (volver atrás)
      sel.innerHTML = '<option value="">— Seleccionar área —</option>' +
        (data.areas || []).map(a =>
          `<option value="${a.nombre}">${a.nombre}</option>`
        ).join('');
      if (valorActual) sel.value = valorActual;
    } catch {
      document.getElementById('area').innerHTML =
        '<option value="">— Error al cargar áreas —</option>';
    }
  }

    function addDoc() {
      const input = document.getElementById('docInput');
      const val = input.value.trim();
      if (!val) return;
      documentos.push(val);
      input.value = '';
      renderDocs();
    }

    function removeDoc(i) {
      documentos.splice(i, 1);
      renderDocs();
    }

    function toggleVehiculo(el) {
      el.classList.toggle('checked');
      conVehiculo = el.classList.contains('checked') ? 'si' : 'no';
    }

    function renderDocs() {
      document.getElementById('docsWrap').innerHTML = documentos.map((d, i) =>
        `<div class="doc-tag"><i class="bi bi-file-earmark"></i> ${d}
          <button class="remove-doc" onclick="removeDoc(${i})"><i class="bi bi-x"></i></button>
        </div>`
      ).join('');
    }

    function continuar() {
      if (!validar()) return;
      const cita = getCita();
      cita.emailVisitante = document.getElementById('emailVisitante').value.trim();
      cita.nombres = document.getElementById('nombres').value.trim();
      cita.apPaterno = document.getElementById('apPaterno').value.trim();
      cita.apMaterno = document.getElementById('apMaterno').value.trim();
      cita.area = document.getElementById('area').value.trim();
      cita.telefono = document.getElementById('telefono').value.trim();
      cita.documentos = documentos;
      cita.tipo = conVehiculo === 'si' ? 'vehiculo' : 'visita';
      delete cita.ineBase64; delete cita.ineNombre; delete cita.ineType;
      setCita(cita);
      window.location.href = conVehiculo === 'si' ? 'vehiculo.html' : 'documentacion.html';
    }

    function validar() {
      let ok = true;
      ['nombres', 'apPaterno', 'area', 'telefono', 'emailVisitante'].forEach(id => {
        const el = document.getElementById(id);
        const prev = el.nextElementSibling;
        el.classList.remove('is-invalid');
        if (prev && prev.classList.contains('invalid-msg')) prev.remove();
        if (!el.value.trim()) {
          el.classList.add('is-invalid');
          const msg = document.createElement('div');
          msg.className = 'invalid-msg';
          msg.textContent = 'Campo requerido.';
          el.after(msg);
          ok = false;
        }
      });
      if (!ok) document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return ok;
    }

    function getCita() { try { return JSON.parse(sessionStorage.getItem('cita_draft') || '{}'); } catch { return {}; } }
    function setCita(d) { sessionStorage.setItem('cita_draft', JSON.stringify(d)); }
