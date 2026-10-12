import { feeds } from './espn.js';
const base = 'https://site.api.espn.com/apis/site/v2/sports';
const labels = {
  possessionPct: 'Posesión', totalShots: 'Tiros totales', shotsOnTarget: 'Tiros a puerta',
  wonCorners: 'Córners', foulsCommitted: 'Faltas', yellowCards: 'Tarjetas amarillas',
  redCards: 'Tarjetas rojas', offsides: 'Fuera de juego', saves: 'Atajadas',
  totalPasses: 'Pases', accuratePasses: 'Pases precisos', blockedShots: 'Tiros bloqueados',
  interceptions: 'Intercepciones', totalTackles: 'Entradas',
  fieldGoalsMadeFieldGoalsAttempted: 'Tiros de campo', fieldGoalPct: 'Porcentaje de campo',
  threePointFieldGoalsMadeThreePointFieldGoalsAttempted: 'Triples', rebounds: 'Rebotes',
  assists: 'Asistencias', turnovers: 'Pérdidas', steals: 'Robos', blocks: 'Bloqueos',
  totalYards: 'Yardas totales', passingYards: 'Yardas de pase', rushingYards: 'Yardas por carrera',
  firstDowns: 'Primeros downs', possessionTime: 'Tiempo de posesión',
};
const statOrder = ['possessionPct', 'totalShots', 'shotsOnTarget', 'wonCorners', 'foulsCommitted', 'yellowCards', 'redCards', 'offsides', 'saves', 'totalPasses', 'accuratePasses', 'blockedShots', 'interceptions', 'totalTackles'];
const value = stat => stat?.displayValue != null ? String(stat.displayValue) : stat?.value != null ? String(stat.value) : null;
const numericScore = score => score !== '' && score != null && Number.isFinite(Number(score)) ? Number(score) : null;
function eventType(event) { return String(event.type?.type || event.type?.text || '').toLowerCase(); }

export function normalizeMatchSummary(body, match) {
  const game = body?.header?.competitions?.[0];
  if (!game || String(body.header.id) !== match.id.replace(/^espn:/, '')) throw new Error('ESPN no devolvió un detalle válido para este encuentro.');
  const home = game.competitors?.find(team => team.homeAway === 'home');
  const away = game.competitors?.find(team => team.homeAway === 'away');
  if (!home || !away) throw new Error('No se pudieron identificar los equipos del encuentro.');
  const competitors = [home, away];
  const teamIds = competitors.map(team => String(team.team?.id || team.id));
  const teams = competitors.map((team, index) => team.team?.displayName || [match.home, match.away][index]);
  const sides = competitors.map((team, index) => body.boxscore?.teams?.find(item => String(item.team?.id) === teamIds[index])?.statistics || []);
  const names = [...new Set(sides.flatMap(stats => stats.map(stat => stat.name)))];
  names.sort((a, b) => (statOrder.includes(a) ? statOrder.indexOf(a) : 100) - (statOrder.includes(b) ? statOrder.indexOf(b) : 100));
  const statistics = names.flatMap(name => {
    const pair = sides.map(stats => stats.find(stat => stat.name === name));
    const values = pair.map(value);
    if (values.every(item => item == null)) return [];
    if (match.sport === 'Fútbol' && !statOrder.includes(name)) return [];
    return [{ name, label: labels[name] || pair.find(Boolean)?.label || pair.find(Boolean)?.displayName || name, values: values.map(item => item == null ? '—' : name === 'possessionPct' && !item.endsWith('%') ? `${item}%` : item) }];
  });
  const details = Array.isArray(game.details) ? game.details : [];
  const events = body.keyEvents?.length ? body.keyEvents : body.scoringPlays?.length ? body.scoringPlays : details;
  const scorers = events.filter(event => event.scoringPlay === true && event.shootout !== true && !/disallowed|cancel|missed/.test(eventType(event))).map((event, index) => {
    const metadata = details.find(item => item.scoringPlay && String(item.team?.id) === String(event.team?.id) && item.clock?.value === event.clock?.value && item.participants?.[0]?.athlete?.id === event.participants?.[0]?.athlete?.id);
    const type = eventType(event);
    const ownGoal = event.ownGoal === true || metadata?.ownGoal === true || type.includes('own-goal');
    const penalty = event.penaltyKick === true || metadata?.penaltyKick === true || type.includes('penalty');
    const scorer = event.participants?.find(item => item.type === 'scorer') || event.participants?.[0];
    return {
      id: String(event.id || `${event.team?.id}:${event.clock?.displayValue}:${index}`),
      minute: event.clock?.displayValue ? `${event.clock.displayValue}${!event.clock.displayValue.includes('+') && Number(event.addedClock?.displayValue) > 0 ? `+${event.addedClock.displayValue}′` : ''}` : 'Minuto no informado',
      name: scorer?.athlete?.displayName || 'Autor no informado',
      team: event.team?.displayName || teams[teamIds.indexOf(String(event.team?.id))] || 'Equipo no informado',
      ownGoal, penalty,
    };
  });
  const type = game.status?.type;
  const status = type?.completed ? 'Finalizado' : type?.state === 'in' ? 'En vivo' : type?.state === 'pre' ? 'Próximo' : match.status;
  return { teams, statistics, scorers, goals: status === 'En vivo' || status === 'Finalizado' ? competitors.map(team => numericScore(team.score)) : null, status, clock: game.status?.displayClock || '', venue: body.gameInfo?.venue?.fullName || match.venue };
}

export async function fetchMatchSummary(match, { signal, fetcher = fetch } = {}) {
  const feed = feeds.find(item => item.path === match.sportPath || item.sport === match.sport && item.league === match.league);
  const id = /^espn:(\d+)$/.exec(match.id)?.[1];
  if (match.source !== 'ESPN' || !feed || !id) throw new Error('Este encuentro no tiene un resumen real de ESPN.');
  const response = await fetcher(`${base}/${feed.path}/summary?event=${id}`, { signal });
  if (!response.ok) throw new Error('No pudimos cargar los goleadores y estadísticas de ESPN.');
  return normalizeMatchSummary(await response.json(), match);
}
