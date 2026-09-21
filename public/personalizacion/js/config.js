// public/personalizacion/js/config.js
(function () {
    const DEFAULT = {
        empresa: 'SISSA Monitoring Integral S.A. de C.V.',
        appNombre: 'VehiLog',
        fuente: 'Inter',
        tamano: '16',
        colorBg: '#f2f2f7',
        colorSurface: '#ffffff',
        colorAccent: '#e8441a',
        colorText: '#111111',
        colorHeader: '#111111',
        logo: null,
    };

    function inyectarVars(cfg) {
        let styleTag = document.getElementById('vehilog-vars');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'vehilog-vars';
            document.head.appendChild(styleTag);
        }

        const fuentesSistema = ['Arial', 'Georgia', 'Verdana', 'Tahoma', 'Times New Roman'];
        const importFuente = fuentesSistema.includes(cfg.fuente) ? '' :
            `@import url('https://fonts.googleapis.com/css2?family=${cfg.fuente.replace(/ /g, '+')}:wght@400;500;600;700&display=swap');`;

        styleTag.textContent = `
  ${importFuente}
  :root {
    --bg:      ${cfg.colorBg}      !important;
    --surface: ${cfg.colorSurface} !important;
    --accent:  ${cfg.colorAccent}  !important;
    --text:    ${cfg.colorText}    !important;
    --font:    '${cfg.fuente}', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  html {
    font-size: ${cfg.tamano}px !important;
  }
  body, input, select, textarea, button {
    font-family: '${cfg.fuente}', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  body {
    background: ${cfg.colorBg}  !important;
    color:      ${cfg.colorText} !important;
  }
  .field-label, .section-label, .rc-sub, .stat-label, .muted {
    color: var(--muted) !important;
  }
`;
    }

    function aplicar(cfg) {
        inyectarVars(cfg);

        // ── Cargar fuente de Google Fonts ──
        // ── Cargar fuente de Google Fonts ──
        const fuentesSistema = ['Arial', 'Georgia', 'Verdana', 'Tahoma', 'Times New Roman'];
        if (!fuentesSistema.includes(cfg.fuente)) {
            const linkId = 'vehilog-font-link';
            let link = document.getElementById(linkId);
            if (!link) {
                link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
            const nuevaHref = `https://fonts.googleapis.com/css2?family=${cfg.fuente.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
            if (link.href !== nuevaHref) {
                link.href = nuevaHref;
                // Esperar a que cargue y volver a aplicar font-family
                link.onload = () => {
                    document.fonts.ready.then(() => {
                        inyectarVars(cfg);
                    });
                };
            }
        }

        // ── Color del header ──
        document.querySelectorAll('.app-header, .drawer-header').forEach(el => {
            el.style.background = cfg.colorHeader;
            el.style.borderBottomColor = cfg.colorHeader;
            const lum = luminosidad(cfg.colorHeader);
            const textoHeader = lum > 0.4 ? '#111111' : '#ffffff';
            el.querySelectorAll('.page-title, .drawer-brand, .header-brand').forEach(t => t.style.color = textoHeader);
            el.querySelectorAll('.btn-back, .btn-back-header, .btn-menu span, .btn-icon').forEach(b => {
                b.style.color = textoHeader;
                if (b.tagName !== 'SPAN') {
                    b.style.borderColor = lum > 0.4 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
                    b.style.background = lum > 0.4 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
                }
            });
        });

        // ── Logo ──
        if (cfg.logo) {
            document.querySelectorAll('.app-logo, #loginLogo').forEach(el => {
                el.src = cfg.logo;
                el.style.display = 'block';
                // Aplicar tamaño solo al logo del login
                if (el.id === 'loginLogo' && cfg.logoSize) {
                    el.style.maxWidth = cfg.logoSize + 'px';
                    el.style.maxHeight = Math.round(cfg.logoSize * 0.75) + 'px';
                }
            });
            // Ocultar texto fallback
            document.querySelectorAll('.app-logo-fallback, #loginLogoFallback').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // Sin logo — mostrar texto
            document.querySelectorAll('.app-logo, #loginLogo').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.app-logo-fallback, #loginLogoFallback').forEach(el => {
                el.style.display = '';
            });
        }

        // ── Nombre de empresa ──
        document.querySelectorAll('.empresa-nombre').forEach(el => el.textContent = cfg.empresa);
        document.querySelectorAll('.app-nombre').forEach(el => el.textContent = cfg.appNombre);

        // ── Título de la pestaña ──
        if (document.title.includes('VehiLog')) {
            document.title = document.title.replace('VehiLog', cfg.appNombre);
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

    // ── Cargar config del servidor ──
    async function cargarConfig() {
        try {
            const res = await fetch('/api/config');
            const data = await res.json();
            if (data.ok && data.config) {
                aplicar(data.config);
                window.VehiLogConfig._cache = data.config;
            }
        } catch {
            // Si falla el fetch, usar defaults
            aplicar(DEFAULT);
        }
    }

    // Aplicar defaults inmediatamente para evitar flash
    inyectarVars(DEFAULT);

    // Cuando el DOM esté listo, cargar del servidor
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargarConfig);
    } else {
        cargarConfig();
    }

    window.VehiLogConfig = {
        _cache: DEFAULT,
        get: () => window.VehiLogConfig._cache,
        set: async function (nuevaCfg, token) {
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-token': token
                },
                body: JSON.stringify(nuevaCfg)
            });
            const data = await res.json();
            if (data.ok) {
                aplicar(data.config);
                window.VehiLogConfig._cache = data.config;
            }
            return data;
        },
        reset: async function (token) {
            return window.VehiLogConfig.set(DEFAULT, token);
        },
        DEFAULT
    };
})();