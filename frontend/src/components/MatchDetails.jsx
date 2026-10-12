import { useEffect, useState } from 'react';
import { TeamBadge } from './UI.jsx';
import { fetchMatchSummary } from '../services/match-summary.js';

export default function MatchDetails({ match, user }) {
  const [state, setState] = useState(() => ({ summary: null, loading: match.source === 'ESPN', error: '' }));
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (match.source !== 'ESPN') return;
    let active = true, timer;
    const controller = new AbortController();
    setState({ summary: null, loading: true, error: '' });
    async function update() {
      if (document.hidden) { timer = setTimeout(update, 10000); return; }
      let interval = 60000;
      try {
        const summary = await fetchMatchSummary(match, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
        if (!active) return;
        setState({ summary, loading: false, error: '' });
        if (summary.status === 'Finalizado') return;
        interval = summary.status === 'En vivo' ? 10000 : 60000;
      } catch (failure) {
        if (!active) return;
        setState(current => ({ ...current, loading: false, error: failure.message }));
      }
      if (active) timer = setTimeout(update, interval);
    }
    update();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [match.id, revision]);
  const summary = state.summary;
  const goals = summary ? summary.goals : match.goals;
  const football = match.sport === 'Fútbol';
  return <>
    <span className="eyebrow muted">{match.league} · {summary ? `${summary.status}${summary.clock ? ` · ${summary.clock}` : ''}` : match.time}</span>
    <div className="match-detail-score">{[match.home, match.away].map((team, index) => <div key={index}><TeamBadge name={team} logoUrl={match.logos?.[index]}/><strong>{summary?.teams[index] || team}</strong><span>{goals?.[index] ?? '—'}</span></div>)}</div>
    {match.source === 'ESPN' ? <div className="match-summary-content">
      {state.loading && <p className="muted" role="status">Cargando goleadores y estadísticas…</p>}
      {state.error && <div className="form-error" role="alert"><p>{state.error}</p>{summary && <p className="small">Se conserva la última consulta disponible.</p>}<button className="button secondary" onClick={() => setRevision(value => value + 1)}>Reintentar detalle</button></div>}
      {summary && <>
        <section className="scorers-section"><h3>{football ? 'Goleadores' : 'Anotaciones'}</h3>{summary.scorers.length ? <ol className="compact-goals">{summary.scorers.map(goal => <li key={goal.id}><span>{goal.minute}</span><div><strong>{goal.name}</strong><small>{goal.team}{goal.ownGoal ? ' · Autogol' : goal.penalty ? ' · Penal' : ''}</small></div></li>)}</ol> : <p className="muted small">{summary.status === 'Próximo' ? 'El encuentro aún no comienza.' : football && goals?.every(goal => goal === 0) ? 'No se registraron goles.' : 'La fuente no informa los autores de las anotaciones.'}</p>}</section>
        <section className="statistics-section"><h3>Estadísticas del partido</h3>{summary.statistics.length ? <><div className="stats-team-heading"><strong>{summary.teams[0]}</strong><span>vs.</span><strong>{summary.teams[1]}</strong></div><dl className="match-statistics">{summary.statistics.map(stat => <div key={stat.name}><dd>{stat.values[0]}</dd><dt>{stat.label}</dt><dd>{stat.values[1]}</dd></div>)}</dl></> : <p className="muted small">ESPN aún no tiene estadísticas disponibles para este encuentro.</p>}</section>
        {summary.venue && <p className="muted small">Estadio: {summary.venue}</p>}
      </>}
      <p className="small muted">Fuente: ESPN. La información en vivo puede llegar con retraso.</p>
    </div> : <>
      {match.probabilities && (user.plan === 'Premium' || user.role === 'Administrador') && <div className="summary-lines">{[match.home, 'Empate', match.away].map((label, index) => <p key={label}><span>{label}</span><strong>{match.probabilities[index]}%</strong></p>)}</div>}
      <p className="muted">Encuentro de demostración. Sus marcadores y predicciones son ficticios.</p><p className="small muted">Los goleadores y las estadísticas reales están disponibles en los encuentros identificados como ESPN.</p>
    </>}
  </>;
}
