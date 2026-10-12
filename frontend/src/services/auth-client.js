// Contrato de solicitudes: contracts/openapi.json. Los esquemas de respuesta
// están vacíos allí; las variantes admitidas se documentan en API.md.
export function createAuthClient({ baseUrl, fetcher = fetch, storage, onExpired = () => {} }) {
  const key = 'chokxen:session';
  let tokens = null;
  let renewal = null;
  let restoration = null;
  let generation = 0;
  try {
    const saved = JSON.parse(storage?.getItem(key) || 'null');
    if (typeof saved?.accessToken === 'string' && saved.accessToken) tokens = saved;
  } catch { /* El almacenamiento es opcional. */ }
  function save(next) {
    tokens = next;
    try { if (next) storage?.setItem(key, JSON.stringify(next)); else storage?.removeItem(key); } catch { /* Sesión en memoria. */ }
  }
  function clear() { generation++; save(null); }
  function expired() { clear(); onExpired(); }
  function tokenResponse(body, previousRefresh) {
    const accessToken = body?.access_token ?? body?.accessToken;
    const refreshToken = body?.refresh_token ?? body?.refreshToken ?? previousRefresh;
    if (typeof accessToken !== 'string' || !accessToken) throw new Error('El servidor no devolvió un token de acceso válido. Revisa el contrato de respuestas.');
    return { accessToken, refreshToken: typeof refreshToken === 'string' ? refreshToken : null };
  }
  async function send(path, options = {}) {
    let response;
    try { response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, { ...options, headers: { ...options.headers, Heart: 'CHOKXEN SPORT', 'Chokxen-SPORT': 'true' }, signal: AbortSignal.timeout(12000) }); }
    catch { throw new Error('No pudimos conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.'); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      let message = 'No se pudo completar la solicitud. Inténtalo de nuevo.';
      if (response.status >= 500) message = 'El servidor no está disponible. Comprueba que el backend esté encendido e inténtalo de nuevo.';
      if (response.status === 429) message = 'Has realizado varios intentos. Espera un minuto y vuelve a intentarlo.';
      if (response.status === 401) message = path === '/auth/login' ? 'Correo o contraseña incorrectos.' : 'Tu sesión terminó. Inicia sesión de nuevo.';
      else if (response.status === 409 && path === '/auth/register') message = 'Este correo ya está registrado. Inicia sesión con tu cuenta.';
      else if (response.status === 422 && Array.isArray(body?.detail)) {
        const labels = { correo: 'correo', username: 'correo', password: 'contraseña', nombreUsuario: 'nombre', plan: 'plan' };
        const fields = [...new Set(body.detail.map(item => labels[item.loc?.at(-1)]).filter(Boolean))];
        message = fields.length ? `Revisa estos campos: ${fields.join(', ')}.` : 'Revisa los datos del formulario.';
      } else if (response.status < 500 && response.status !== 429 && typeof body?.detail === 'string') message = body.detail;
      const error = new Error(message); error.status = response.status; throw error;
    }
    return body;
  }
  async function refresh() {
    if (renewal) return renewal;
    if (!tokens?.refreshToken) { expired(); throw new Error('Tu sesión terminó. Inicia sesión de nuevo.'); }
    const version = generation;
    const previousRefresh = tokens.refreshToken;
    renewal = (async () => {
      try {
        const body = await send('/auth/refresh', { method: 'POST', headers: { refreshToken: previousRefresh } });
        if (version !== generation) throw new Error('La sesión se cerró.');
        const next = tokenResponse(body, previousRefresh);
        const response = await send('/usuarios/me', { headers: { Authorization: `Bearer ${next.accessToken}` } });
        if (version !== generation) throw new Error('La sesión se cerró.');
        const verified = response?.usuario ?? response;
        if (!Number.isInteger(verified?.id ?? verified?.clienteId) || (verified.id ?? verified.clienteId) < 1) {
          expired(); throw new Error('No pudimos renovar tu sesión. Inicia sesión de nuevo.');
        }
        save(next);
      } catch (error) { if (version === generation && (error.status === 401 || error.status === 403)) expired(); throw error; }
      finally { renewal = null; }
    })();
    return renewal;
  }
  async function authorized(path, options = {}) {
    if (!tokens) throw new Error('Inicia sesión para continuar.');
    const version = generation;
    const attempt = () => {
      if (version !== generation || !tokens) throw new Error('La sesión cambió. Inicia sesión de nuevo.');
      return send(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${tokens.accessToken}` } });
    };
    try { return await attempt(); }
    catch (error) {
      if (error.status !== 401 || version !== generation) throw error;
      await refresh();
      try { return await attempt(); } catch (retryError) { if (retryError.status === 401 && version === generation) expired(); throw retryError; }
    }
  }
  async function profile() {
    const response = await authorized('/usuarios/me');
    const body = response?.usuario ?? response;
    const email = body?.correo ?? body?.email;
    if (typeof email !== 'string' || !email) throw new Error('El perfil recibido no incluye el correo. Revisa el contrato de respuestas.');
    if (!Number.isInteger(body.id ?? body.clienteId) || (body.id ?? body.clienteId) < 1) throw new Error('El perfil recibido no incluye un ID de usuario válido. Inicia sesión de nuevo.');
    const role = body.rol ?? body.role;
    return {
      id: body.id ?? body.clienteId, email, name: [body.nombreUsuario, body.name].find(value => typeof value === 'string' && value.trim()) || email.split('@')[0],
      role: role === 'Administrador' ? role : 'Cliente',
      plan: body.plan === 'Premium' ? 'Premium' : 'Basico', onboarded: false,
    };
  }
  async function login(email, password) {
    clear(); const version = generation;
    const body = await send('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email.trim().toLowerCase(), password, grant_type: 'password' }),
    });
    if (version !== generation) throw new Error('La sesión se cerró.');
    save(tokenResponse(body));
    try {
      const user = await profile();
      if (version !== generation) throw new Error('La sesión cambió. Inicia sesión de nuevo.');
      return user;
    } catch (error) { if (version === generation) clear(); throw error; }
  }
  async function register({ name, email, password }) {
    await send('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email.trim().toLowerCase(), password, nombreUsuario: name.trim(), rol: 'Cliente', plan: 'Basico' }),
    });
    try { return { ...await login(email, password), onboarded: false }; }
    catch { const error = new Error('Tu cuenta se creó, pero no pudimos iniciar sesión. Entra con tu correo y contraseña.'); error.registered = true; throw error; }
  }
  async function restore() {
    if (!tokens) return null;
    if (restoration) return restoration;
    const version = generation;
    restoration = (async () => {
      try { const user = await profile(); return version === generation ? user : null; }
      catch (error) { if (version === generation) clear(); throw error; }
      finally { restoration = null; }
    })();
    return restoration;
  }
  async function logout() {
    try { if (tokens) await authorized('/auth/logout', { method: 'POST' }); }
    finally { clear(); }
  }
  return { login, register, restore, logout, authorized, clear };
}
