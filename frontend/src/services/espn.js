const base = 'https://site.api.espn.com/apis/site/v2/sports';
export const feeds = [
  { sport: 'Fútbol', league: 'Liga MX', path: 'soccer/mex.1' },
  { sport: 'Fútbol', league: 'Premier League', path: 'soccer/eng.1' },
  { sport: 'Fútbol', league: 'LaLiga', path: 'soccer/esp.1' },
  { sport: 'Fútbol', league: 'Champions', path: 'soccer/uefa.champions' },
  { sport: 'NFL', league: 'NFL', path: 'football/nfl' },
  { sport: 'Básquet', league: 'NBA', path: 'basketball/nba' },
];
const zone = 'America/Mexico_City';
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
export function dateKey(date) {
  const parts = dateFormat.formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('');
}
export function targetDate(day, now = new Date()) {
  const key = dateKey(now);
  const date = new Date(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6)}T12:00:00-06:00`);
  date.setUTCDate(date.getUTCDate() + ({ Ayer: -1, Hoy: 0, 'Mañana': 1 }[day] ?? 0));
  return date;
}
function safeLogo(value) { return typeof value === 'string' && /^https:\/\/a\.espncdn\.com\//.test(value) ? value : undefined; }
export function normalizeScoreboard(body, feed, day, target) {
  if (!Array.isArray(body.events)) throw new Error(`ESPN devolvió datos inválidos para ${feed.league}.`);
  return body.events.flatMap(event => {
    const game = event.competitions?.[0];
    const home = game?.competitors?.find(team => team.homeAway === 'home');
    const away = game?.competitors?.find(team => team.homeAway === 'away');
    const date = new Date(event.date);
    if (!home || !away || Number.isNaN(+date) || dateKey(date) !== dateKey(target)) return [];
    const status = game.status || event.status || {};
    const state = status.type?.state;
    const final = status.type?.completed === true;
    const live = state === 'in';
    const upcoming = state === 'pre' && status.type?.name === 'STATUS_SCHEDULED';
    const label = final ? 'Finalizado' : live ? 'En vivo' : upcoming ? 'Próximo' : 'Sin confirmar';
    const scores = [home.score, away.score].map(score => score === '' || score == null ? null : Number(score));
    return [{
      id: `espn:${event.id}`, sport: feed.sport, league: feed.league, source: 'ESPN', day, sportPath: feed.path,
      teamIds: [String(home.team.id ?? home.id), String(away.team.id ?? away.id)],
      home: home.team.shortDisplayName || home.team.displayName,
      away: away.team.shortDisplayName || away.team.displayName,
      logos: [safeLogo(home.team.logo), safeLogo(away.team.logo)],
      status: label, kickoff: event.date,
      time: live ? `En vivo · ${status.displayClock || ''}` : final ? 'Finalizado' : upcoming ? `${day}, ${new Intl.DateTimeFormat('es-MX', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)}` : 'Horario por confirmar',
      goals: (live || final) ? scores.map(score => Number.isFinite(score) ? score : null) : undefined,
      venue: game.venue?.fullName,
    }];
  });
}
export async function fetchScores({ sport, league, day, signal, now = new Date(), fetcher = fetch }) {
  const selected = feeds.filter(feed => feed.sport === sport && (league === 'Todas' || feed.league === league));
  if (!selected.length) return { matches: [], notice: 'Todavía no tenemos cobertura ESPN para este deporte.' };
  const target = targetDate(day, now);
  // Soccer rechaza rangos YYYYMMDD-YYYYMMDD. Consultamos fechas individuales;
  // el día siguiente cubre partidos nocturnos de México fechados después de
  // medianoche en la zona del calendario de ESPN.
  const dates = [dateKey(target), dateKey(new Date(+target + 86400000))];
  const results = await Promise.allSettled(selected.map(async feed => {
    const boards = await Promise.allSettled(dates.map(async date => {
      const response = await fetcher(`${base}/${feed.path}/scoreboard?dates=${date}&limit=1000`, { signal });
      if (!response.ok) throw new Error(feed.league);
      return normalizeScoreboard(await response.json(), feed, day, target);
    }));
    const loaded = boards.filter(board => board.status === 'fulfilled');
    if (!loaded.length) throw new Error(feed.league);
    return { matches: loaded.flatMap(board => board.value), partial: loaded.length < dates.length };
  }));
  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
  const successful = results.filter(result => result.status === 'fulfilled');
  if (!successful.length) throw new Error('No pudimos actualizar ESPN. Inténtalo de nuevo.');
  return {
    matches: [...new Map(successful.flatMap(result => result.value.matches).map(match => [match.id, match])).values()].sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    notice: successful.length < selected.length || successful.some(result => result.value.partial) ? 'Algunos encuentros no pudieron actualizarse.' : '',
  };
}
