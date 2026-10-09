import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoMatches, selectMatchSources } from '../src/services/demo-matches.js';
test('genera encuentros variados con IDs únicos y estados coherentes por fecha', () => {
  const matches = createDemoMatches(() => 0.25);
  assert.equal(matches.length, 42);
  assert.equal(new Set(matches.map(match => match.id)).size, 42);
  for (const match of matches) {
    assert.notEqual(match.home, match.away);
    assert.equal(match.source, 'Demo');
    if (match.day === 'Ayer') assert.equal(match.status, 'Finalizado');
    if (match.day === 'Mañana') assert.equal(match.status, 'Próximo');
    if (match.status === 'Próximo') assert.equal(match.goals, undefined);
    if (match.probabilities) assert.equal(match.probabilities.reduce((sum, value) => sum + value), 100);
  }
  assert.equal(matches.filter(match => match.day === 'Hoy').length, 14);
});
test('otra selección aleatoria cambia los rivales sin alterar las fuentes', () => {
  const a = createDemoMatches(() => 0.1), b = createDemoMatches(() => 0.9);
  assert.notDeepEqual(a.map(match => match.home), b.map(match => match.home));
  assert.deepEqual(a.map(match => match.id), b.map(match => match.id));
});
test('una sesión demo agrega ejemplos sin modificar ni reemplazar los datos ESPN', () => {
  const espn = { id: 'espn:1', source: 'ESPN', home: 'América', goals: [2, 0] };
  const demos = createDemoMatches(() => 0.25);
  const combined = selectMatchSources({ espnMatches: [espn], demoMatches: demos, demoSession: true, usesEspn: true, day: 'Hoy' });
  assert.equal(combined.length, 15); assert.equal(combined[0], espn);
  assert.ok(combined.slice(1).every(match => match.source === 'Demo' && match.day === 'Hoy'));
  assert.deepEqual(selectMatchSources({ espnMatches: [espn], demoMatches: demos, demoSession: false, usesEspn: true, day: 'Hoy' }), [espn]);
});
test('un día ESPN vacío conserva ejemplos identificados y el modo offline no inserta ESPN', () => {
  const demos = createDemoMatches();
  for (const usesEspn of [true, false]) {
    const selected = selectMatchSources({ espnMatches: [], demoMatches: demos, demoSession: true, usesEspn, day: 'Mañana' });
    assert.equal(selected.length, 14); assert.ok(selected.every(match => match.source === 'Demo'));
  }
});
