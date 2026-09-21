
  // Si ya hay sesión válida, redirigir
  window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('vehilog_token');
    const dest  = localStorage.getItem('vehilog_redirect') || 'acceso.html';
    if (token) {
      try {
        const res = await fetch('/api/auth/verificar', { headers: { 'x-session-token': token } });
        if (res.ok) { window.location.href = dest; return; }
      } catch {}
      localStorage.removeItem('vehilog_token');
    }
  });

  function togglePass() {
    const inp = document.getElementById('password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }

  async function login() {
    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;
    const err      = document.getElementById('errorMsg');
    const btn      = document.getElementById('btnLogin');
    err.style.display = 'none';

    if (!usuario || !password) { showError('Ingresa usuario y contraseña.'); return; }

    btn.disabled = true; btn.textContent = 'Verificando...';

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || 'Error al iniciar sesión.'); btn.disabled=false; btn.textContent='Entrar'; return; }

      localStorage.setItem('vehilog_token', data.token);
      localStorage.setItem('vehilog_usuario', data.usuario);
      localStorage.setItem('vehilog_rol', data.rol);

      const dest = localStorage.getItem('vehilog_redirect') || 'acceso.html';
      localStorage.removeItem('vehilog_redirect');
      window.location.href = dest;

    } catch { showError('No se pudo conectar con el servidor.'); btn.disabled=false; btn.textContent='Entrar'; }
  }

  function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg; el.style.display = 'block';
  }
