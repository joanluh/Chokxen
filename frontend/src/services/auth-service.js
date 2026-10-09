const previews = {
  basico: { email: 'basico@chokxen.demo', name: 'Daniel', plan: 'Basico', role: 'Cliente' },
  premium: { email: 'premium@chokxen.demo', name: 'Andrea', plan: 'Premium', role: 'Cliente' },
  admin: { email: 'admin@chokxen.demo', name: 'Administrador', plan: 'Premium', role: 'Administrador' },
};
// Perfiles de interfaz: no emiten tokens, permisos ni cuentas en el backend.
export function createAuthService({ apiClient, mode = 'api', demoEnabled = false, storage }) {
  const key = 'chokxen:demo-profile';
  const registrations = new Map();
  let previewSession = false;
  const enabled = mode === 'demo' || demoEnabled;
  const profile = type => ({ ...previews[type], demo: true, onboarded: true });
  function remember(type) { try { if (type) storage?.setItem(key, type); else storage?.removeItem(key); } catch { /* Memoria si no hay almacenamiento. */ } }
  function loginDemo(type) {
    if (!enabled || !Object.hasOwn(previews, type)) throw new Error('Este perfil de demostración no está disponible.');
    apiClient.clear(); previewSession = true; remember(type);
    return profile(type);
  }
  async function login(email, password) {
    const normalized = email.trim().toLowerCase();
    const type = Object.keys(previews).find(type => previews[type].email === normalized);
    if (enabled && type) {
      if (password !== 'Demo123!') throw new Error('Para probar este perfil usa el botón de su experiencia o la contraseña Demo123!.');
      return loginDemo(type);
    }
    if (mode === 'demo') {
      const saved = registrations.get(normalized);
      if (saved && saved.password === password) { previewSession = true; remember(null); return { ...saved.profile }; }
      throw new Error('Correo o contraseña incorrectos. Puedes usar una cuenta de demostración.');
    }
    previewSession = false; remember(null);
    return apiClient.login(normalized, password);
  }
  async function register({ name, email, password, plan }) {
    const normalized = email.trim().toLowerCase();
    if (mode !== 'demo') { previewSession = false; remember(null); return apiClient.register({ name, email: normalized, password, plan }); }
    if (Object.values(previews).some(item => item.email === normalized) || registrations.has(normalized)) throw new Error('Este correo ya está registrado.');
    const next = { name, email: normalized, plan, role: 'Cliente', demo: true, onboarded: false };
    registrations.set(normalized, { password, profile: next });
    previewSession = true; remember(null);
    return next;
  }
  async function restore() {
    let type;
    try { type = storage?.getItem(key); } catch { /* Almacenamiento opcional. */ }
    if (enabled && Object.hasOwn(previews, type)) { previewSession = true; apiClient.clear(); return profile(type); }
    return mode === 'demo' ? null : apiClient.restore();
  }
  async function logout() {
    const wasPreview = previewSession;
    previewSession = false; remember(null);
    if (wasPreview || mode === 'demo') return;
    await apiClient.logout();
  }
  return { login, register, loginDemo, restore, logout };
}
