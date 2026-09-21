
    const token = localStorage.getItem('vehilog_token');
    const rol = localStorage.getItem('vehilog_rol');

    cargarNavbar({ titulo: 'Administración' }).then(() => {
      if (rol !== 'admin') { window.location.href = 'dashboard.html'; return; }
      cargarUsuarios();
      cargarAreas();
    });

    // ══════════════════════════════════════
    //  USUARIOS
    // ══════════════════════════════════════
    async function cargarUsuarios() {
      try {
        const res = await fetch('/api/usuarios', { headers: { 'x-session-token': token } });
        if (res.status === 401) { window.location.href = 'login.html'; return; }
        const data = await res.json();
        document.getElementById('loadingUsers').style.display = 'none';
        document.getElementById('usersList').innerHTML = data.usuarios.map(u => `
          <div class="user-row">
            <div class="user-info">
              <div class="user-name"><i class="bi bi-person-circle"></i> ${u.usuario}</div>
              <div class="user-meta">
                ${new Date(u.creadoEn).toLocaleDateString('es-MX')} ·
                <span class="rol-badge rol-${u.rol}">${u.rol}</span>
                ${u.email ? `· <span>${u.email}</span>` : ''}
              </div>
            </div>
            <div class="row-actions">
              <button class="btn-edit" onclick='abrirEditUsuario(${JSON.stringify(u)})' title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              ${u.usuario !== 'admin'
            ? `<button class="btn-del" onclick="eliminarUsuario('${u.usuario}')" title="Eliminar">
                     <i class="bi bi-trash3"></i>
                   </button>`
            : '<span class="admin-lock"><i class="bi bi-shield-check"></i></span>'}
            </div>
          </div>`).join('');
      } catch { document.getElementById('loadingUsers').textContent = 'Error al cargar usuarios.'; }
    }

    async function agregarUsuario() {
      const usuario = document.getElementById('nuevoUsuario').value.trim();
      const password = document.getElementById('nuevoPassword').value;
      const rolNuevo = document.getElementById('nuevoRol').value;
      const email = document.getElementById('nuevoEmail').value.trim();
      const btn = document.getElementById('btnAgregar');
      hide('alertOk'); hide('alertErr');

      if (!usuario || !password) { showMsg('alertErr', 'Ingresa usuario y contraseña.'); return; }
      if (!email) { showMsg('alertErr', 'Ingresa el correo electrónico.'); return; }
      if (password.length < 6) { showMsg('alertErr', 'La contraseña debe tener al menos 6 caracteres.'); return; }

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
      try {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': token },
          body: JSON.stringify({ usuario, password, rol: rolNuevo, email })
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErr', data.error); }
        else {
          showMsg('alertOk', `Usuario "${usuario}" creado.`);
          document.getElementById('nuevoUsuario').value = '';
          document.getElementById('nuevoPassword').value = '';
          document.getElementById('nuevoRol').value = 'operador';
          document.getElementById('nuevoEmail').value = '';
          cargarUsuarios();
        }
      } catch { showMsg('alertErr', 'No se pudo conectar.'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-plus-lg"></i> Agregar';
    }

    async function eliminarUsuario(usuario) {
      const conf = await Swal.fire({
        title: `¿Eliminar "${usuario}"?`,
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
        const res = await fetch(`/api/usuarios/${usuario}`, {
          method: 'DELETE', headers: { 'x-session-token': token }
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErr', data.error); }
        else { showMsg('alertOk', `Usuario "${usuario}" eliminado.`); cargarUsuarios(); }
      } catch { showMsg('alertErr', 'Error al eliminar.'); }
    }

    function abrirEditUsuario(u) {
      document.getElementById('editUsuarioId').value = u.usuario;
      document.getElementById('editUsuarioNombre').value = u.usuario;
      document.getElementById('editUsuarioEmail').value = u.email || '';
      document.getElementById('editUsuarioRol').value = u.rol;
      document.getElementById('editUsuarioPassword').value = '';
      hide('alertOkEditU'); hide('alertErrEditU');
      abrirModal('modalUsuario');
    }

    async function guardarUsuario() {
      const usuario = document.getElementById('editUsuarioId').value;
      const email = document.getElementById('editUsuarioEmail').value.trim();
      const rolEdit = document.getElementById('editUsuarioRol').value;
      const password = document.getElementById('editUsuarioPassword').value;
      const btn = document.getElementById('btnGuardarUsuario');
      hide('alertOkEditU'); hide('alertErrEditU');

      if (!email) { showMsg('alertErrEditU', 'El correo es requerido.'); return; }
      const body = { email, rol: rolEdit };
      if (password) {
        if (password.length < 6) { showMsg('alertErrEditU', 'Mínimo 6 caracteres.'); return; }
        body.password = password;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
      try {
        const res = await fetch(`/api/usuarios/${usuario}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-session-token': token },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErrEditU', data.error); }
        else {
          showMsg('alertOkEditU', 'Cambios guardados.');
          cargarUsuarios();
          setTimeout(() => cerrarModal('modalUsuario'), 1200);
        }
      } catch { showMsg('alertErrEditU', 'No se pudo conectar.'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
    }

    // ══════════════════════════════════════
    //  ÁREAS
    // ══════════════════════════════════════
    async function cargarAreas() {
      try {
        const res = await fetch('/api/areas', { headers: { 'x-session-token': token } });
        const data = await res.json();
        document.getElementById('loadingAreas').style.display = 'none';
        if (!data.areas.length) {
          document.getElementById('areasList').innerHTML =
            '<p style="color:var(--muted);font-size:0.85rem;padding:0.5rem 0;">No hay áreas registradas.</p>';
          return;
        }
        document.getElementById('areasList').innerHTML = data.areas.map(a => `
          <div class="user-row">
            <div class="user-info">
              <div class="user-name"><i class="bi bi-building"></i> ${a.nombre}</div>
              <div class="user-meta"><i class="bi bi-envelope" style="font-size:0.7rem;"></i> ${a.email}</div>
            </div>
            <div class="row-actions">
              <button class="btn-edit" onclick='abrirEditArea(${JSON.stringify(a)})' title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn-del" onclick="eliminarArea(${a.id},'${a.nombre.replace(/'/g, "\\'")}')">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>`).join('');
      } catch { document.getElementById('loadingAreas').textContent = 'Error al cargar áreas.'; }
    }

    async function agregarArea() {
      const nombre = document.getElementById('nuevaArea').value.trim();
      const email = document.getElementById('nuevaAreaEmail').value.trim();
      const btn = document.getElementById('btnAgregarArea');
      hide('alertOkArea'); hide('alertErrArea');

      if (!nombre) { showMsg('alertErrArea', 'Ingresa el nombre del área.'); return; }
      if (!email) { showMsg('alertErrArea', 'Ingresa el correo del responsable.'); return; }

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
      try {
        const res = await fetch('/api/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-session-token': token },
          body: JSON.stringify({ nombre, email })
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErrArea', data.error); }
        else {
          showMsg('alertOkArea', `Área "${nombre}" creada.`);
          document.getElementById('nuevaArea').value = '';
          document.getElementById('nuevaAreaEmail').value = '';
          cargarAreas();
        }
      } catch { showMsg('alertErrArea', 'No se pudo conectar.'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-plus-lg"></i> Agregar';
    }

    async function eliminarArea(id, nombre) {
      const conf = await Swal.fire({
        title: `¿Eliminar "${nombre}"?`,
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
        const res = await fetch(`/api/areas/${id}`, {
          method: 'DELETE', headers: { 'x-session-token': token }
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErrArea', data.error); }
        else { showMsg('alertOkArea', `Área "${nombre}" eliminada.`); cargarAreas(); }
      } catch { showMsg('alertErrArea', 'Error al eliminar.'); }
    }

    function abrirEditArea(a) {
      document.getElementById('editAreaId').value = a.id;
      document.getElementById('editAreaNombre').value = a.nombre;
      document.getElementById('editAreaEmail').value = a.email;
      hide('alertOkEditA'); hide('alertErrEditA');
      abrirModal('modalArea');
    }

    async function guardarArea() {
      const id = document.getElementById('editAreaId').value;
      const nombre = document.getElementById('editAreaNombre').value.trim();
      const email = document.getElementById('editAreaEmail').value.trim();
      const btn = document.getElementById('btnGuardarArea');
      hide('alertOkEditA'); hide('alertErrEditA');

      if (!nombre) { showMsg('alertErrEditA', 'El nombre es requerido.'); return; }
      if (!email) { showMsg('alertErrEditA', 'El correo es requerido.'); return; }

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
      try {
        const res = await fetch(`/api/areas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-session-token': token },
          body: JSON.stringify({ nombre, email })
        });
        const data = await res.json();
        if (!res.ok) { showMsg('alertErrEditA', data.error); }
        else {
          showMsg('alertOkEditA', 'Área actualizada.');
          cargarAreas();
          setTimeout(() => cerrarModal('modalArea'), 1200);
        }
      } catch { showMsg('alertErrEditA', 'No se pudo conectar.'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar cambios';
    }

    // ── MODALES ──
    function abrirModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
    function cerrarModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }
    function cerrarModalSiFondo(e, id) { if (e.target === document.getElementById(id)) cerrarModal(id); }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { cerrarModal('modalUsuario'); cerrarModal('modalArea'); }
    });

    // ── UTILS ──
    function showMsg(id, msg) {
      const el = document.getElementById(id);
      const isOk = id.toLowerCase().includes('ok');
      el.innerHTML = `<i class="bi bi-${isOk ? 'check' : 'exclamation'}-circle"></i> ${msg}`;
      el.style.display = 'flex';
    }
    function hide(id) { document.getElementById(id).style.display = 'none'; }
