
let logoBase64 = null;
let logoSize = 120; // px por defecto

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('vehilog_token');
    if (!token) { window.location.href = '../login.html'; return; }
    try {
        const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } });
        const data = await res.json();
        if (!data.ok || data.rol !== 'admin') { window.location.href = '../acceso.html'; return; }
    } catch { window.location.href = '../acceso.html'; return; }

    const cfg = window.VehiLogConfig.get();
    document.getElementById('cfgAppNombre').value = cfg.appNombre;
    document.getElementById('cfgEmpresa').value = cfg.empresa;
    document.getElementById('cfgColorBg').value = cfg.colorBg;
    document.getElementById('cfgColorBgText').value = cfg.colorBg;
    document.getElementById('cfgColorSurface').value = cfg.colorSurface;
    document.getElementById('cfgColorSurfaceText').value = cfg.colorSurface;
    document.getElementById('cfgColorAccent').value = cfg.colorAccent;
    document.getElementById('cfgColorAccentText').value = cfg.colorAccent;
    document.getElementById('cfgColorText').value = cfg.colorText;
    document.getElementById('cfgColorTextText').value = cfg.colorText;
    document.getElementById('cfgColorHeader').value = cfg.colorHeader;
    document.getElementById('cfgColorHeaderText').value = cfg.colorHeader;
    document.getElementById('cfgFuente').value = cfg.fuente;
    document.getElementById('cfgTamano').value = cfg.tamano;
    document.getElementById('tamanoValor').textContent = cfg.tamano;

    if (cfg.logoSize) {
        logoSize = cfg.logoSize;
        document.getElementById('cfgLogoSize').value = logoSize;
        document.getElementById('logoSizeValor').textContent = logoSize;
    }

    if (cfg.logo) {
        logoBase64 = cfg.logo;
        document.getElementById('logoPreview').src = cfg.logo;
        document.getElementById('logoPreview').style.display = 'block';
        document.getElementById('logoPlaceholder').style.display = 'none';
        document.getElementById('btnRemoveLogo').style.display = 'flex';
    }

    actualizarPreview();
});

// ── SINCRONIZAR COLORES ──
function sincronizarColor(colorId, textId) {
    const val = document.getElementById(textId).value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        document.getElementById(colorId).value = val;
        actualizarPreview();
    }
}

// ── TAMAÑO LOGO ──
function actualizarTamanoLogo(val) {
    logoSize = parseInt(val);
    document.getElementById('logoSizeValor').textContent = val;
    actualizarPreviewLogin();
}

// ── PREVIEW DASHBOARD ──
function actualizarPreview() {
    const bg = document.getElementById('cfgColorBg').value;
    const surface = document.getElementById('cfgColorSurface').value;
    const accent = document.getElementById('cfgColorAccent').value;
    const text = document.getElementById('cfgColorText').value;
    const header = document.getElementById('cfgColorHeader').value;
    const fuente = document.getElementById('cfgFuente').value;
    const tamano = parseInt(document.getElementById('cfgTamano').value);
    const empresa = document.getElementById('cfgEmpresa').value || 'SISSA Monitoring';
    const appNombre = document.getElementById('cfgAppNombre').value || 'VehiLog';

    // Sync textos color
    document.getElementById('cfgColorBgText').value = bg;
    document.getElementById('cfgColorSurfaceText').value = surface;
    document.getElementById('cfgColorAccentText').value = accent;
    document.getElementById('cfgColorTextText').value = text;
    document.getElementById('cfgColorHeaderText').value = header;

    // Preview dashboard
    const preview = document.getElementById('previewCard');
    preview.style.background = bg;
    preview.style.fontFamily = `'${fuente}', sans-serif`;
    preview.style.fontSize = tamano + 'px';

    const previewHeader = document.getElementById('previewHeader');
    previewHeader.style.background = header;
    previewHeader.style.fontFamily = `'${fuente}', sans-serif`;

    const lum = luminosidad(header);
    const tc = lum > 0.4 ? '#111' : '#fff';

    const appNombreEl = document.getElementById('previewAppNombre');
    appNombreEl.style.color = tc;
    appNombreEl.style.fontSize = (tamano * 0.95) + 'px';
    appNombreEl.style.fontFamily = `'${fuente}', sans-serif`;
    appNombreEl.textContent = appNombre;

    const empresaEl = document.getElementById('previewEmpresa');
    empresaEl.style.color = tc + 'aa';
    empresaEl.style.fontSize = (tamano * 0.7) + 'px';
    empresaEl.style.fontFamily = `'${fuente}', sans-serif`;
    empresaEl.textContent = empresa;

    document.getElementById('previewBody').style.background = bg;
    document.getElementById('previewBody').style.fontFamily = `'${fuente}', sans-serif`;
    document.querySelectorAll('.preview-card-inner').forEach(el => el.style.background = surface);

    const titleEl = document.querySelector('.preview-title');
    const subEl = document.querySelector('.preview-sub');
    if (titleEl) { titleEl.style.color = text; titleEl.style.fontSize = (tamano * 0.88) + 'px'; titleEl.style.fontFamily = `'${fuente}', sans-serif`; }
    if (subEl) { subEl.style.color = text + '88'; subEl.style.fontSize = (tamano * 0.75) + 'px'; subEl.style.fontFamily = `'${fuente}', sans-serif`; }

    const badgeEl = document.getElementById('previewBadge');
    badgeEl.style.background = accent + '22';
    badgeEl.style.color = accent;
    badgeEl.style.borderColor = accent + '44';
    badgeEl.style.fontSize = (tamano * 0.68) + 'px';

    const btnEl = document.getElementById('previewBtn');
    btnEl.style.background = accent;
    btnEl.style.fontSize = (tamano * 0.85) + 'px';
    btnEl.style.fontFamily = `'${fuente}', sans-serif`;

    // Logo en preview dashboard (pequeño en navbar)
    const pLogo = document.getElementById('previewLogo');
    if (logoBase64) {
        pLogo.src = logoBase64;
        pLogo.style.display = 'block';
    } else {
        pLogo.style.display = 'none';
    }

    // También actualizar preview login
    actualizarPreviewLogin();
}

// ── PREVIEW LOGIN ──
function actualizarPreviewLogin() {
    const bg = document.getElementById('cfgColorBg').value;
    const accent = document.getElementById('cfgColorAccent').value;
    const text = document.getElementById('cfgColorText').value;
    const fuente = document.getElementById('cfgFuente').value;
    const empresa = document.getElementById('cfgEmpresa').value || 'SISSA Monitoring Integral S.A. de C.V.';
    const appNombre = document.getElementById('cfgAppNombre').value || 'VehiLog';

    const body = document.getElementById('previewLoginBody');
    body.style.background = bg;
    body.style.fontFamily = `'${fuente}', sans-serif`;

    document.getElementById('plbAppNombre').textContent = appNombre;
    document.getElementById('plbAppNombre').style.color = text;
    document.getElementById('plbAppNombre').style.fontFamily = `'${fuente}', sans-serif`;

    document.getElementById('plbEmpresa').textContent = empresa;
    document.getElementById('plbEmpresa').style.color = text + '88';
    document.getElementById('plbEmpresa').style.fontFamily = `'${fuente}', sans-serif`;

    document.getElementById('plbBtn').style.background = accent;
    document.getElementById('plbBtn').style.fontFamily = `'${fuente}', sans-serif`;

    // Logo en login preview
    const logoWrap = document.getElementById('plbLogoWrap');
    const plbLogo = document.getElementById('plbLogo');
    const sizeWrap = document.getElementById('logoSizeWrap');

    if (logoBase64) {
        plbLogo.src = logoBase64;
        plbLogo.style.maxWidth = logoSize + 'px';
        logoWrap.style.display = 'flex';
        sizeWrap.style.display = 'block';
    } else {
        logoWrap.style.display = 'none';
        sizeWrap.style.display = 'none';
    }
}

function luminosidad(hex) {
    try {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch { return 0; }
}

function aplicarPaleta(btn) {
    const p = JSON.parse(btn.dataset.paleta);
    document.getElementById('cfgColorBg').value = p.colorBg;
    document.getElementById('cfgColorSurface').value = p.colorSurface;
    document.getElementById('cfgColorAccent').value = p.colorAccent;
    document.getElementById('cfgColorText').value = p.colorText;
    document.getElementById('cfgColorHeader').value = p.colorHeader;
    actualizarPreview();
}

function cargarLogo(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        logoBase64 = e.target.result;
        document.getElementById('logoPreview').src = logoBase64;
        document.getElementById('logoPreview').style.display = 'block';
        document.getElementById('logoPlaceholder').style.display = 'none';
        document.getElementById('btnRemoveLogo').style.display = 'flex';
        actualizarPreview();
    };
    reader.readAsDataURL(file);
}

function removerLogo() {
    logoBase64 = null;
    document.getElementById('logoPreview').src = '';
    document.getElementById('logoPreview').style.display = 'none';
    document.getElementById('logoPlaceholder').style.display = 'flex';
    document.getElementById('btnRemoveLogo').style.display = 'none';
    document.getElementById('logoInput').value = '';
    document.getElementById('previewLogo').style.display = 'none';
    document.getElementById('plbLogoWrap').style.display = 'none';
    document.getElementById('logoSizeWrap').style.display = 'none';
}

async function guardarConfig() {
    const token = localStorage.getItem('vehilog_token');
    const cfg = {
        appNombre: document.getElementById('cfgAppNombre').value.trim() || 'VehiLog',
        empresa: document.getElementById('cfgEmpresa').value.trim() || 'SISSA Monitoring Integral S.A. de C.V.',
        fuente: document.getElementById('cfgFuente').value,
        tamano: document.getElementById('cfgTamano').value,
        colorBg: document.getElementById('cfgColorBg').value,
        colorSurface: document.getElementById('cfgColorSurface').value,
        colorAccent: document.getElementById('cfgColorAccent').value,
        colorText: document.getElementById('cfgColorText').value,
        colorHeader: document.getElementById('cfgColorHeader').value,
        logo: logoBase64,
        logoSize: logoSize,
    };
    const data = await window.VehiLogConfig.set(cfg, token);
    if (!data.ok) { alert('Error: ' + data.error); return; }
    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardado';
    btn.style.background = '#34c759';
    setTimeout(() => { window.location.href = '../acceso.html'; }, 1200);
}

async function resetConfig() {
    if (!confirm('¿Restaurar todos los valores por defecto?')) return;
    const token = localStorage.getItem('vehilog_token');
    await window.VehiLogConfig.reset(token);
    window.location.reload();
}
