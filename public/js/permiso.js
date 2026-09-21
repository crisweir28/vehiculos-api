  // Invalidar bfcache del navegador
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      // La página viene del bfcache
      const token = localStorage.getItem('vehilog_token');
      if (!token) { window.location.replace('login.html'); }
      // Verificar con el servidor
      fetch('/api/auth/verificar', {
        headers: { 'x-session-token': token }
      }).then(res => {
        if (!res.ok) {
          localStorage.removeItem('vehilog_token');
          localStorage.removeItem('vehilog_usuario');
          localStorage.removeItem('vehilog_rol');
          window.location.replace('login.html');
        }
      }).catch(() => window.location.replace('login.html'));
    }
  });