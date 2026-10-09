import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthService } from '../src/services/auth-service.js';
function setup(options = {}) {
  const saved = new Map(), calls = [];
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
  const apiClient = {
    clear: () => calls.push('clear'),
    login: (...args) => { calls.push(['login', ...args]); throw new Error('Backend fuera de línea'); },
    register: (...args) => { calls.push(['register', ...args]); return { email: args[0].email, role: 'Cliente' }; },
    restore: () => { calls.push('restore'); return null; },
    logout: () => calls.push('logout'),
  };
  return { saved, calls, make: () => createAuthService({ apiClient, storage, mode: 'api', demoEnabled: true, ...options }) };
}
test('los tres perfiles entran sin backend y conservan sus restricciones visuales', () => {
  const context = setup(), auth = context.make();
  const basic = auth.loginDemo('basico'), premium = auth.loginDemo('premium'), admin = auth.loginDemo('admin');
  assert.deepEqual([basic.plan, basic.role], ['Basico', 'Cliente']);
  assert.deepEqual([premium.plan, premium.role], ['Premium', 'Cliente']);
  assert.equal(admin.role, 'Administrador');
  for (const user of [basic, premium, admin]) { assert.equal(user.demo, true); assert.equal(user.onboarded, true); }
  assert.deepEqual(context.calls, ['clear', 'clear', 'clear']);
});
test('recarga restaura una experiencia y logout no llama al servidor real', async () => {
  const context = setup(); context.make().loginDemo('admin');
  const restored = context.make(); assert.equal((await restored.restore()).role, 'Administrador');
  await restored.logout(); assert.equal(context.saved.size, 0); assert.equal(context.calls.includes('logout'), false);
  assert.equal(await context.make().restore(), null);
});
test('login real conserva su error de backend sin obtener un perfil de prueba', async () => {
  const context = setup(), auth = context.make(); auth.loginDemo('admin');
  await assert.rejects(auth.login('real@example.test', 'RealPassword'), /Backend fuera de línea/);
  assert.deepEqual(context.calls.at(-1), ['login', 'real@example.test', 'RealPassword']);
  assert.equal(context.saved.size, 0);
});
test('credenciales demo no llegan al backend y el registro real sigue usando API', async () => {
  const context = setup(), auth = context.make();
  assert.equal((await auth.login('PREMIUM@chokxen.demo', 'Demo123!')).plan, 'Premium');
  await assert.rejects(auth.login('admin@chokxen.demo', 'incorrecta'), /botón/);
  assert.equal(context.calls.some(call => Array.isArray(call) && call[0] === 'login'), false);
  await auth.register({ name: 'Prueba', email: 'real@example.test', password: 'RealPassword', plan: 'Basico' });
  assert.equal(context.calls.at(-1)[0], 'register');
});
test('no acepta perfiles desactivados ni roles manipulados en almacenamiento', async () => {
  const context = setup({ demoEnabled: false }), auth = context.make();
  assert.throws(() => auth.loginDemo('admin'), /no está disponible/);
  context.saved.set('chokxen:demo-profile', '{"role":"Administrador"}');
  assert.equal(await auth.restore(), null);
  assert.deepEqual(context.calls, ['restore']);
});
