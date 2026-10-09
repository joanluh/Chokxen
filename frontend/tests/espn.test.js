import test from 'node:test';
import assert from 'node:assert/strict';
import { feeds, fetchScores, normalizeScoreboard, targetDate, dateKey } from '../src/services/espn.js';
const feed = feeds[0];
function board(state = 'in', date = '2026-09-28T02:00Z') {
  return { events: [{ id: 'fixture', date, competitions: [{ status: { displayClock: "67'", type: { state, name: state === 'pre' ? 'STATUS_SCHEDULED' : 'STATUS_IN_PROGRESS', completed: state === 'post' } }, competitors: [
    { homeAway: 'away', score: '1', team: { displayName: 'León', logo: 'https://a.espncdn.com/away.png' } },
    { homeAway: 'home', score: '2', team: { displayName: 'Santos', logo: 'https://a.espncdn.com/home.png' } },
  ] }] }] };
}
test('normaliza local/visitante aunque ESPN cambie su orden, sin momios inventados', () => {
  const match = normalizeScoreboard(board(), feed, 'Hoy', new Date('2026-09-27T12:00-06:00'))[0];
  assert.equal(match.home, 'Santos'); assert.deepEqual(match.goals, [2, 1]); assert.equal(match.status, 'En vivo');
  assert.equal(match.odds, undefined); assert.equal(match.probabilities, undefined);
});
test('fecha UTC se filtra por Ciudad de México y descarta días adyacentes', () => {
  assert.equal(normalizeScoreboard(board(), feed, 'Hoy', new Date('2026-09-28T12:00-06:00')).length, 0);
  assert.equal(dateKey(targetDate('Mañana', new Date('2026-12-31T12:00-06:00'))), '20270101');
});
test('un partido próximo no muestra los ceros precargados como marcador', () => {
  const match = normalizeScoreboard(board('pre'), feed, 'Hoy', new Date('2026-09-27T12:00-06:00'))[0];
  assert.equal(match.status, 'Próximo'); assert.equal(match.goals, undefined);
});
test('ESPN vacío es un día sin partidos, no un error ni un fallback ficticio', async () => {
  const result = await fetchScores({ sport: 'Fútbol', league: 'Liga MX', day: 'Hoy', fetcher: async () => new Response('{"events":[]}') });
  assert.deepEqual(result.matches, []); assert.equal(result.notice, '');
});
test('un fallo de todas las fuentes se informa y no genera partidos', async () => {
  await assert.rejects(fetchScores({ sport: 'Fútbol', league: 'Liga MX', day: 'Hoy', fetcher: async () => new Response('{}', { status: 503 }) }), /No pudimos actualizar ESPN/);
});
test('consulta fechas individuales compatibles con soccer y elimina duplicados', async () => {
  const dates = [];
  const result = await fetchScores({ sport: 'Fútbol', league: 'Liga MX', day: 'Hoy', now: new Date('2026-09-27T12:00-06:00'), fetcher: async url => {
    const date = new URL(url).searchParams.get('dates'); assert.match(date, /^\d{8}$/); dates.push(date);
    return new Response(JSON.stringify(board()));
  } });
  assert.deepEqual(dates, ['20260927', '20260928']); assert.equal(result.matches.length, 1);
});
