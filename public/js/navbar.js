// public/js/navbar.js

const _base = window.location.pathname.startsWith('/personalizacion/') ? '../' : '';

// Verificar sesión al cargar cualquier página
(async () => {
  const token = localStorage.getItem('vehilog_token');
  if (!token) { window.location.replace(`${_base}login.html`); return; }
  try {
    const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } });
    if (!res.ok) {
      localStorage.removeItem('vehilog_token');
      localStorage.removeItem('vehilog_usuario');
      localStorage.removeItem('vehilog_rol');
      window.location.replace(`${_base}login.html`);
    }
  } catch {
    window.location.replace(`${_base}login.html`);
  }
})();

function _lum(hex) {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch { return 0; }
}

function aplicarColorNavbar(colorHeader) {
  const lum = _lum(colorHeader);
  const tc = lum > 0.4 ? '#111111' : '#ffffff';
  const borderBtn = lum > 0.4 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)';
  const bgBtn = lum > 0.4 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
  const borderBadge = lum > 0.4 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.35)';
  const bgBadge = lum > 0.4 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)';

  document.querySelectorAll('.app-header, .drawer-header').forEach(el => {
    el.style.background = colorHeader;
    el.style.borderBottomColor = colorHeader;

    el.querySelectorAll('.page-title, .drawer-brand, .header-brand').forEach(t => {
      t.style.color = tc;
    });

    el.querySelectorAll('.btn-menu span').forEach(s => {
      s.style.background = tc;
    });

    el.querySelectorAll('.btn-back, .btn-back-header, .btn-menu, .btn-icon').forEach(b => {
      b.style.color = tc;
      b.style.borderColor = borderBtn;
      b.style.background = bgBtn;
    });

    // Badge usuario — siempre visible con borde y fondo adaptativo
    el.querySelectorAll('.user-badge').forEach(b => {
      b.style.color = tc;
      b.style.borderColor = borderBadge;
      b.style.background = bgBadge;
    });
  });
}

async function cargarNavbar(opciones = {}) {
  const {
    backUrl = null,
    titulo = '',
    showMenu = true,
    esPublica = false,
  } = opciones;

  const token = localStorage.getItem('vehilog_token');
  let usuario = '—';
  let rol = '';
  let esAdmin = false;

  if (token && !esPublica) {
    try {
      const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } });
      const data = await res.json();
      if (data.ok) {
        usuario = data.usuario;
        rol = data.rol;
        esAdmin = data.rol === 'admin';
      } else {
        window.location.href = `${_base}login.html`;
        return;
      }
    } catch {
      window.location.href = `${_base}login.html`;
      return;
    }
  }

  const logoHtml = `
    <img class="app-logo" src="" alt=""
      style="display:none;width:32px;height:32px;object-fit:contain;border-radius:6px;"/>
  `;

  // Badge con usuario y rol
  const badgeHtml = `
    <div class="header-right">
      <span class="user-badge" id="userBadge">
        <i class="bi bi-person-fill" style="font-size:0.7rem;margin-right:3px;"></i><span class="badge-txt">${usuario}</span>
        ${rol ? `<span class="badge-rol" style="opacity:0.7;font-size:0.65rem;margin-left:4px;">(${rol})</span>` : ''}
      </span>
    </div>`;

  const headerHtml = `
    <header class="app-header">
      ${backUrl
      ? `<a class="btn-back-header" href="${backUrl}" aria-label="Regresar">
             <i class="bi bi-chevron-left"></i>
           </a>`
      : `<button class="btn-menu" aria-label="Menú" onclick="toggleDrawer()">
             <span></span><span></span><span></span>
           </button>`
    }
      ${titulo ? `<span class="page-title">${titulo}</span>`
      : `<span class="page-title app-logo-fallback app-nombre">VehiLog</span>`
    }
      ${showMenu && !backUrl ? badgeHtml : ''}
    </header>
  `;

  const drawerHtml = !backUrl ? `
    <div class="drawer-overlay" id="drawerOverlay" onclick="toggleDrawer()"></div>
    <nav class="drawer" id="drawer">
      <div class="drawer-header">
        ${logoHtml}
        <span class="drawer-brand app-logo-fallback app-nombre">VehiLog</span>
        <button class="drawer-close" onclick="toggleDrawer()">✕</button>
      </div>
      <a class="drawer-link" href="${_base}acceso.html"><i class="bi bi-house"></i> Inicio</a>
      <a class="drawer-link" href="${_base}dashboard.html"><i class="bi bi-bar-chart-line"></i> Dashboard</a>
      <a class="drawer-link" href="${_base}index.html"><i class="bi bi-clipboard-plus"></i> Registro Manual</a>
      <a class="drawer-link" href="${_base}flotilla.html"><i class="bi bi-truck"></i> Flotilla Corporativa</a>
      ${esAdmin ? `<a class="drawer-link" href="${_base}admin.html"><i class="bi bi-gear"></i> Administracion</a>` : ''}
      ${esAdmin ? `<a class="drawer-link" href="${_base}personalizacion/ajustes.html"><i class="bi bi-sliders"></i> Personalización</a>` : ''}
      <div class="drawer-divider"></div>
      <button class="drawer-link danger" onclick="logout()">
        <i class="bi bi-box-arrow-left"></i> Cerrar sesión
      </button>
    </nav>
  ` : '';

  const el = document.getElementById('navbar');
  if (el) el.innerHTML = headerHtml + drawerHtml;

  // Re-aplicar personalización al header recién inyectado
  setTimeout(() => {
    const cfg = window.VehiLogConfig?._cache;
    if (cfg?.colorHeader) {
      aplicarColorNavbar(cfg.colorHeader);
      if (cfg.logo) {
        document.querySelectorAll('.app-logo').forEach(img => {
          img.src = cfg.logo;
          img.style.display = 'block';
        });
        document.querySelectorAll('.app-logo-fallback').forEach(el => {
          el.style.display = 'none';
        });
      }
    }
  }, 0);
}

function toggleDrawer() {
  document.getElementById('drawer')?.classList.toggle('open');
  document.getElementById('drawerOverlay')?.classList.toggle('open');
  document.body.classList.toggle('no-scroll');
}

async function logout() {
  const token = localStorage.getItem('vehilog_token');
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'x-session-token': token }
  }).catch(() => { });
  localStorage.removeItem('vehilog_token');
  localStorage.removeItem('vehilog_usuario');
  localStorage.removeItem('vehilog_rol');
  window.location.href = `${_base}login.html`;
}