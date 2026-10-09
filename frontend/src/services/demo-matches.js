const competitions = [
  { sport: 'Fútbol', league: 'Liga MX', teams: ['América', 'Chivas', 'Monterrey', 'Tigres', 'Pumas', 'Toluca', 'Santos', 'León', 'Cruz Azul', 'Atlas'] },
  { sport: 'Fútbol', league: 'Premier League', teams: ['Arsenal', 'Liverpool', 'Chelsea', 'Manchester City', 'Manchester United', 'Tottenham'] },
  { sport: 'Fútbol', league: 'LaLiga', teams: ['Real Madrid', 'Barcelona', 'Atlético de Madrid', 'Athletic Club', 'Villarreal', 'Real Sociedad'] },
  { sport: 'Fútbol', league: 'Champions', teams: ['Real Madrid', 'Barcelona', 'Liverpool', 'Bayern Múnich', 'PSG', 'Inter'] },
  { sport: 'NFL', league: 'NFL', teams: ['Cowboys', 'Chiefs', 'Bills', 'Eagles'] },
  { sport: 'Básquet', league: 'NBA', teams: ['Lakers', 'Celtics', 'Warriors', 'Bulls'] },
  { sport: 'Tenis', league: 'ATP', teams: ['Alcaraz', 'Sinner', 'Djokovic', 'Zverev'] },
];
function shuffle(values, random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
// Se generan una sola vez por carga; las consultas ESPN no cambian estos ejemplos.
export function createDemoMatches(random = Math.random) {
  return competitions.flatMap((competition, competitionIndex) => ['Ayer', 'Hoy', 'Mañana'].flatMap(day => {
    const teams = shuffle(competition.teams, random);
    return [0, 1].map(index => {
      const football = competition.sport === 'Fútbol';
      const status = day === 'Ayer' ? 'Finalizado' : day === 'Mañana' ? 'Próximo' : index === 0 ? 'En vivo' : 'Próximo';
      const integer = max => Math.floor(random() * max);
      const homeChance = 35 + integer(21), drawChance = football ? 22 + integer(8) : 0;
      const probabilities = [homeChance, drawChance, 100 - homeChance - drawChance];
      const score = () => competition.sport === 'Básquet' ? 80 + integer(41) : competition.sport === 'NFL' ? integer(6) * 7 : integer(4);
      return {
        id: `demo:${competitionIndex}:${day}:${index}`, source: 'Demo', ...competition,
        home: teams[index * 2], away: teams[index * 2 + 1], day, status,
        time: status === 'En vivo' ? `En vivo · ${20 + integer(60)}′` : status === 'Finalizado' ? 'Finalizado' : `${day}, ${17 + integer(5)}:00`,
        ...(status !== 'Próximo' ? { goals: [score(), score()] } : {}),
        odds: probabilities.map(chance => chance ? Math.round(100 / chance * 100) / 100 : null),
        ...(football ? { probabilities, score: `${integer(4)} - ${integer(4)}` } : {}),
      };
    });
  }));
}

export function selectMatchSources({ espnMatches, demoMatches, demoSession, usesEspn, day }) {
  if (!usesEspn) return demoMatches.filter(match => match.day === day);
  return [...espnMatches, ...(demoSession ? demoMatches.filter(match => match.day === day) : [])];
}
