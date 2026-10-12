import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAuthClient } from '../src/services/auth-client.js';
const schema = JSON.parse(readFileSync(new URL('../contracts/openapi.json', import.meta.url)));
const me = { correo: 'prueba@example.test', nombreUsuario: 'Usuario Prueba', rol: 'Cliente', plan: 'Premium' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function setup(handler, initial) {
  const saved = new Map(initial ? [['chokxen:session', JSON.stringify(initial)]] : []);
  const calls = []; let expired = 0;
  const client = createAuthClient({ baseUrl: 'http://backend.test/api/v1', storage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) }, onExpired: () => expired++, fetcher: async (url, options) => {
    const path = new URL(url).pathname; const method = options.method || 'GET';
    assert.ok(schema.paths[path]?.[method.toLowerCase()], `Ruta declarada: ${method} ${path}`);
    assert.equal(options.headers.Heart, 'CHOKXEN SPORT', `Identificación del frontend en ${method} ${path}`);
    calls.push({ path, options }); return handler(path, options, calls.length);
  } });
  return { client, saved, calls, expired: () => expired };
}
test('login usa formulario OAuth y obtiene perfil real con Bearer', async () => {
  const context = setup(path => path.endsWith('/login') ? json({ access_token: 'access', refresh_token: 'refresh' }) : json(me));
  const user = await context.client.login(' PRUEBA@example.test ', 'Secret123!');
  assert.equal(user.name, me.nombreUsuario); assert.equal(user.plan, 'Premium'); assert.equal(user.role, 'Cliente');
  assert.equal(user.onboarded, false);
  const first = context.calls[0].options;
  assert.equal(first.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(first.body.get('username'), me.correo); assert.equal(first.body.get('password'), 'Secret123!');
  assert.equal(context.calls[1].options.headers.Authorization, 'Bearer access');
  assert.equal(context.saved.get('chokxen:session').includes('Secret'), false);
});
test('registro usa el esquema y fija Cliente aunque el formulario intente otro rol', async () => {
  const context = setup(path => path.endsWith('/register') ? json({}, 201) : path.endsWith('/login') ? json({ access_token: 'token' }) : json(me));
  const user = await context.client.register({ name: ' Usuario Prueba ', email: 'PRUEBA@example.test', password: 'Secret123!', plan: 'Premium', role: 'Administrador' });
  assert.deepEqual(JSON.parse(context.calls[0].options.body), { correo: me.correo, password: 'Secret123!', nombreUsuario: 'Usuario Prueba', rol: 'Cliente', plan: 'Premium' });
  assert.equal(user.onboarded, false);
});
test('un 401 de login no intenta renovar una sesión anterior', async () => {
  const context = setup(() => json({ detail: 'Invalid' }, 401));
  await assert.rejects(context.client.login(me.correo, 'incorrecta'), /Correo o contraseña/);
  assert.equal(context.calls.length, 1); assert.equal(context.saved.size, 0);
});
test('correo duplicado se informa sin iniciar sesión', async () => {
  const context = setup(() => json({}, 409));
  await assert.rejects(context.client.register({ name: 'P', email: me.correo, password: 'A123456b', plan: 'Basico' }), /ya está registrado/);
  assert.equal(context.calls.length, 1);
});
test('422 muestra campos sin filtrar el input sensible devuelto por FastAPI', async () => {
  const context = setup(() => json({ detail: [{ loc: ['body', 'password'], input: 'Secret123!', msg: 'Secret123!' }] }, 422));
  await assert.rejects(context.client.login(me.correo, 'Secret123!'), error => error.message === 'Revisa estos campos: contraseña.');
});
test('un token faltante impide entrar y no fabrica un perfil', async () => {
  const context = setup(() => json({}));
  await assert.rejects(context.client.login(me.correo, 'P'), /token de acceso válido/);
  assert.equal(context.saved.size, 0); assert.equal(context.calls.length, 1);
});
test('401 de perfil renueva por refreshToken y reintenta con el token nuevo', async () => {
  const context = setup((path, options) => path.endsWith('/refresh') ? json({ accessToken: 'new', refreshToken: 'rotated' }) : options.headers.Authorization === 'Bearer old' ? json({}, 401) : json(me), { accessToken: 'old', refreshToken: 'old-refresh' });
  assert.equal((await context.client.restore()).name, me.nombreUsuario);
  assert.equal(context.calls[1].options.headers.refreshToken, 'old-refresh');
  assert.equal(context.calls[2].options.headers.Authorization, 'Bearer new');
  assert.equal(JSON.parse(context.saved.get('chokxen:session')).refreshToken, 'rotated');
});
test('restauraciones simultáneas comparten consulta y renovación', async () => {
  const context = setup((path, options) => path.endsWith('/refresh') ? json({ access_token: 'new' }) : options.headers.Authorization === 'Bearer old' ? json({}, 401) : json(me), { accessToken: 'old', refreshToken: 'refresh' });
  const users = await Promise.all([context.client.restore(), context.client.restore()]);
  assert.equal(users[0].email, users[1].email); assert.equal(context.calls.length, 3);
});
test('refresh rechazado limpia sesión y avisa de la caducidad', async () => {
  const context = setup(() => json({}, 401), { accessToken: 'old', refreshToken: 'refresh' });
  await assert.rejects(context.client.restore(), /sesión terminó/);
  assert.equal(context.saved.size, 0); assert.equal(context.expired(), 1);
});
test('logout usa Bearer y borra la sesión incluso si el servidor falla', async () => {
  const context = setup(() => json({}, 500), { accessToken: 'access' });
  await assert.rejects(context.client.logout());
  assert.equal(context.calls[0].path, '/api/v1/auth/logout'); assert.equal(context.calls[0].options.headers.Authorization, 'Bearer access');
  assert.equal(context.saved.size, 0); assert.equal(await context.client.restore(), null);
});
test('cuenta creada pero login fallido cambia el siguiente paso a iniciar sesión', async () => {
  const context = setup(path => json({}, path.endsWith('/register') ? 201 : 500));
  await assert.rejects(context.client.register({ name: 'P', email: me.correo, password: 'P', plan: 'Basico' }), error => error.registered === true && error.message.includes('cuenta se creó'));
});
test('una restauración pendiente no revive una sesión borrada', async () => {
  let release;
  const context = setup(() => new Promise(resolve => { release = () => resolve(json(me)); }), { accessToken: 'old' });
  const pending = context.client.restore(); context.client.clear(); release();
  assert.equal(await pending, null); assert.equal(context.saved.size, 0);
});
test('un login pendiente no devuelve un perfil después de borrar la sesión', async () => {
  let releaseProfile;
  const context = setup(path => path.endsWith('/login') ? json({ access_token: 'access' }) : new Promise(resolve => { releaseProfile = () => resolve(json(me)); }));
  const pending = context.client.login(me.correo, 'Secret123!');
  while (!releaseProfile) await new Promise(resolve => setImmediate(resolve));
  context.client.clear(); releaseProfile();
  await assert.rejects(pending, /sesión cambió/); assert.equal(context.saved.size, 0);
});
test('respuesta de tokens nula muestra error de contrato', async () => {
  const context = setup(() => json(null));
  await assert.rejects(context.client.login(me.correo, 'P'), /token de acceso válido/);
  assert.equal(context.saved.size, 0);
});
test('respuesta de perfil nula no crea una sesión ficticia', async () => {
  const context = setup(path => path.endsWith('/login') ? json({ access_token: 'access' }) : json(null));
  await assert.rejects(context.client.login(me.correo, 'P'), /perfil recibido no incluye el correo/);
  assert.equal(context.saved.size, 0);
});

test('un login con token pero perfil rechazado no abre una sesión verificada', async () => {
  const context = setup(path => path.endsWith('/login') ? json({ access_token: 'access' }) : json({ detail: 'Acceso denegado' }, 403));
  await assert.rejects(context.client.login(me.correo, 'Secret123!'), /Acceso denegado/);
  assert.equal(context.saved.size, 0); assert.equal(await context.client.restore(), null);
});

test('Heart se mantiene fijo junto al Bearer en rutas protegidas del contrato', async () => {
  const context = setup(() => json({ allowed: true }), { accessToken: 'access' });
  await context.client.authorized('/usuarios/premium-only', { headers: { Heart: 'otro', Accept: 'application/json' } });
  const headers = context.calls[0].options.headers;
  assert.equal(headers.Heart, 'CHOKXEN SPORT'); assert.equal(headers.Authorization, 'Bearer access');
  assert.equal(headers.Accept, 'application/json');
});

test('perfil real envuelto en usuario y tokens mixtos conservan la cuenta y su ID', async () => {
  const context = setup(path => path.endsWith('/login') ? json({ access_token: 'access', refreshToken: 'refresh' }) : json({ mensaje: 'Perfil del usuario', usuario: { id: 17, correo: me.correo, rol: 'Cliente', plan: 'Premium' } }));
  const user = await context.client.login(me.correo, 'Secret123!');
  assert.equal(user.id, 17); assert.equal(user.email, me.correo); assert.equal(user.plan, 'Premium');
  assert.equal(context.calls[0].options.headers['Chokxen-SPORT'], 'true');
  assert.equal(JSON.parse(context.saved.get('chokxen:session')).refreshToken, 'refresh');
});

test('un fallo interno no muestra detalles SQL ni datos sensibles de la respuesta', async () => {
  const context = setup(() => json({ detail: 'INSERT passwordHash internal-data' }, 500));
  await assert.rejects(context.client.login(me.correo, 'Secret123!'), error => error.message.includes('servidor no está disponible') && !error.message.includes('passwordHash'));
});
