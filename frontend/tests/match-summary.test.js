import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeMatchSummary, fetchMatchSummary } from '../src/services/match-summary.js';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/espn-pumas-cruz-azul.json', import.meta.url)));
const match = { id: 'espn:401876947', source: 'ESPN', sport: 'Fútbol', league: 'Liga MX', sportPath: 'soccer/mex.1', home: 'UNAM', away: 'Cruz Azul', status: 'Finalizado' };
const clone = () => structuredClone(fixture);

test('resumen real conserva seis goleadores, minutos de descuento y marcador', () => {
  const summary = normalizeMatchSummary(fixture, match);
  assert.deepEqual(summary.goals, [3, 3]); assert.equal(summary.status, 'Finalizado');
  assert.deepEqual(summary.scorers.map(goal => goal.name), ['Juninho', 'César Huerta', 'Agustín Palavecino', 'Robert Morales', 'Andres Montaño', 'Osinachi Ebere']);
  assert.equal(summary.scorers[2].minute, "45'+3'");
  assert.ok(summary.scorers.every(goal => goal.team === 'Pumas UNAM' || goal.team === 'Cruz Azul'));
});
test('estadísticas se asocian por ID al local y visitante aunque ESPN invierta las filas', () => {
  const body = clone(); body.boxscore.teams.reverse();
  const summary = normalizeMatchSummary(body, match);
  assert.deepEqual(summary.statistics.find(stat => stat.name === 'possessionPct').values, ['31.7%', '68.3%']);
  assert.deepEqual(summary.statistics.find(stat => stat.name === 'totalShots').values, ['9', '30']);
  assert.deepEqual(summary.statistics.find(stat => stat.name === 'redCards').values, ['1', '0']);
});
test('fallback estructurado mantiene autogoles, penales y descuento sin copiar narraciones', () => {
  const body = clone(); body.keyEvents = [];
  body.header.competitions[0].details[0].ownGoal = true;
  body.header.competitions[0].details[1].penaltyKick = true;
  const late = body.header.competitions[0].details.find(event => event.addedClock?.displayValue === '3');
  late.clock.displayValue = "45'";
  const summary = normalizeMatchSummary(body, match);
  assert.equal(summary.scorers.length, 6); assert.equal(summary.scorers[0].ownGoal, true); assert.equal(summary.scorers[1].penalty, true);
  assert.match(summary.scorers[2].minute, /\+3/);
});
test('dato faltante permanece desconocido y un partido próximo no muestra ceros como resultado', () => {
  const body = clone(); body.boxscore.teams[1].statistics = [];
  body.keyEvents = []; body.header.competitions[0].details = [];
  body.header.competitions[0].status = { type: { state: 'pre', completed: false } };
  const summary = normalizeMatchSummary(body, match);
  assert.equal(summary.goals, null); assert.equal(summary.scorers.length, 0);
  assert.equal(summary.statistics.find(stat => stat.name === 'redCards').values[1], '—');
});
test('no cuenta goles anulados ni tiros de la tanda de penales como goles del encuentro', () => {
  const body = clone();
  body.keyEvents.push({ ...body.keyEvents[0], id: 'cancelled', type: { type: 'goal-disallowed' } });
  body.keyEvents.push({ ...body.keyEvents[0], id: 'shootout', shootout: true });
  assert.equal(normalizeMatchSummary(body, match).scorers.length, 6);
});
test('comprueba el evento y propaga errores HTTP sin fabricar estadísticas', async () => {
  const body = clone(); body.header.id = 'otro';
  assert.throws(() => normalizeMatchSummary(body, match), /detalle válido/);
  await assert.rejects(fetchMatchSummary(match, { fetcher: async () => new Response('{}', { status: 503 }) }), /No pudimos cargar/);
  await assert.rejects(fetchMatchSummary({ ...match, source: 'Demo' }, { fetcher: () => { throw new Error('No debe consultar'); } }), /resumen real/);
});
test('usa el resumen de la liga correcta sin tokens del backend', async () => {
  const controller = new AbortController();
  const result = await fetchMatchSummary(match, { signal: controller.signal, fetcher: async (url, options) => {
    assert.equal(url, 'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/summary?event=401876947');
    assert.equal(options.signal, controller.signal); assert.equal(options.headers, undefined);
    return new Response(JSON.stringify(fixture));
  } });
  assert.equal(result.scorers.length, 6);
});
