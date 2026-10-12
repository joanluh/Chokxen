import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuth } from '../src/services/forms.js';
const valid = { email: 'persona@example.test', name: 'Persona', password: 'Valid123!', confirm: 'Valid123!' };
test('login acepta contraseñas existentes sin aplicar reglas de registro', () => {
  assert.deepEqual(validateAuth({ ...valid, password: 'legacy' }), {});
});
test('registro exige confirmación coincidente y contraseña segura', () => {
  assert.deepEqual(validateAuth(valid, true), {});
  assert.ok(validateAuth({ ...valid, confirm: 'otro' }, true).confirm);
  assert.ok(validateAuth({ ...valid, password: 'solo minusculas' }, true).password);
});
test('registro respeta límite de bcrypt en bytes para unicode', () => {
  const password = `Ab1${'ñ'.repeat(35)}`;
  assert.ok(password.length < 72);
  assert.match(validateAuth({ ...valid, password, confirm: password }, true).password, /72 bytes/);
});
test('campos vacíos, correo inválido y nombre excesivo dan errores por campo', () => {
  const errors = validateAuth({ ...valid, email: 'x', name: 'x'.repeat(51), password: '' }, true);
  assert.ok(errors.email); assert.ok(errors.name); assert.ok(errors.password);
});
