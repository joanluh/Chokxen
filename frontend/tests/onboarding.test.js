import test from 'node:test';
import assert from 'node:assert/strict';
import { withLocalOnboarding } from '../src/services/onboarding.js';
const profile = { email: 'real@example.test', role: 'Cliente', plan: 'Basico', onboarded: false };
test('un perfil verificado sin preferencias locales abre onboarding', () => {
  assert.equal(withLocalOnboarding(profile, {}).onboarded, false);
  assert.equal(withLocalOnboarding(null, {}), null);
});
test('preferencias completas restauran la bienvenida por cuenta sin alterar permisos', () => {
  const saved = { [profile.email]: { completed: true, teams: ['América'], leagues: ['Liga MX'], role: 'Administrador', plan: 'Premium' } };
  const restored = withLocalOnboarding(profile, saved);
  assert.equal(restored.onboarded, true); assert.equal(restored.role, 'Cliente'); assert.equal(restored.plan, 'Basico');
  assert.equal(withLocalOnboarding({ ...profile, email: 'otro@example.test' }, saved).onboarded, false);
});
test('preferencias antiguas o incompletas no omiten onboarding', () => {
  for (const saved of [{ teams: [], leagues: [] }, { completed: true }, { completed: true, teams: 'equipo', leagues: [] }]) {
    assert.equal(withLocalOnboarding(profile, { [profile.email]: saved }).onboarded, false);
  }
});
test('los tres perfiles de demostración conservan su acceso directo', () => {
  for (const role of ['Basico', 'Premium', 'Administrador']) {
    const demo = { ...profile, demo: true, onboarded: true, role };
    assert.equal(withLocalOnboarding(demo, {}), demo);
  }
});
