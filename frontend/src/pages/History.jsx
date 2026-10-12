import { useEffect, useRef, useState } from 'react';
import { Empty, TeamBadge } from '../components/UI.jsx';
import { dateKey } from '../services/espn.js';

function today() { const key = dateKey(new Date()); return `${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6)}`; }
function weekAgo() { const date = new Date(`${today()}T12:00:00-06:00`); date.setUTCDate(date.getUTCDate()-7); const key = dateKey(date); return `${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6)}`; }
const statuses = { pending: 'En espera', running: 'Importando', completed: 'Importación completa', partial: 'Importación parcial', failed: 'Importación fallida', interrupted: 'Importación interrumpida por reinicio' };

export default function History({ client, user, query = '', onDetail }) {
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({ league: 'soccer/mex.1', start: weekAgo(), end: today(), team: '' });
  const [filter, setFilter] = useState(form);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true, matches: [], total: 0, error: '' });
  const [job, setJob] = useState(null);
  const [action, setAction] = useState('');
  const [actionError, setActionError] = useState('');
  const [detailId, setDetailId] = useState('');
  const requestVersion = useRef(0);
  useEffect(() => { setForm(current => ({ ...current, team: query })); setFilter(current => ({ ...current, team: query })); setPage(0); }, [query]);
  const canImport = !user.demo && user.role === 'Administrador';
  const busy = action === 'import' || ['pending','running'].includes(job?.status);
  const showJob = job && (busy || job.start === filter.start && job.end === filter.end && (!filter.league || job.leagues.includes(filter.league)));
  useEffect(() => {
    const controller = new AbortController();
    client.leagues(controller.signal).then(setCatalog).catch(() => {});
    return () => controller.abort();
  }, [client, revision]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, matches: [], total: 0, error: '' });
    client.results({ ...filter, offset: page*30, limit: 30 }, controller.signal)
      .then(body => { if (!controller.signal.aborted) setState({ ...body, loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState({ loading: false, matches: [], total: 0, error: error.message }); });
    return () => controller.abort();
  }, [client, filter, page, revision]);
  useEffect(() => {
    if (!job?.id || !['pending','running'].includes(job.status)) return;
    let active = true, timer;
    const poll = async () => {
      try {
        const next = await client.progress(job.id);
        if (!active) return;
        setJob(next); setActionError('');
        if (!['pending','running'].includes(next.status)) setRevision(value => value+1);
        else timer = setTimeout(poll, 2500);
      } catch (error) { if (active) { setActionError(error.message); timer = setTimeout(poll, 10000); } }
    };
    timer = setTimeout(poll, 1500);
    return () => { active = false; clearTimeout(timer); };
  }, [client, job?.id, job?.status]);
  useEffect(() => () => { requestVersion.current++; }, []);
  const change = key => event => setForm(current => ({ ...current, [key]: event.target.value }));
  async function importRange() {
    setAction('import'); setActionError('');
    try {
      const next = await client.import({ leagues: form.league ? [form.league] : catalog.map(league => league.id), start: form.start, end: form.end });
      setJob(next); setPage(0); setFilter({ ...form });
    } catch (error) { setActionError(error.message); }
    finally { setAction(''); }
  }
  async function detail(match) {
    const version = ++requestVersion.current;
    setDetailId(match.id); setActionError('');
    try {
      const saved = await client.detail(match);
      if (version === requestVersion.current) onDetail(saved);
    } catch (error) { if (version === requestVersion.current) setActionError(error.message); }
    finally { if (version === requestVersion.current) setDetailId(''); }
  }
  async function exportData() {
    setAction('export'); setActionError('');
    try {
      const data = await client.dataset({ league: filter.league, start: filter.start, end: filter.end, team: filter.team, offset: page*30, limit: 30 });
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `chokxen-historico-${filter.start}-${filter.end}-pagina-${page+1}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setActionError(error.message); }
    finally { setAction(''); }
  }
  return <section className="history-view" aria-labelledby="history-title">
    <div className="history-intro"><div><span className="eyebrow muted">ARCHIVO DE PARTIDOS</span><h2 id="history-title">Cada resultado cuenta.</h2><p className="muted">Encuentros terminados, goleadores y estadísticas guardados para consultar y analizar.</p></div><span className="history-tag">ESPN · Base de datos</span></div>
    <form className="history-filters panel" onSubmit={event => { event.preventDefault(); setPage(0); setFilter({ ...form }); setRevision(value => value+1); }}>
      <label>Liga<select value={form.league} onChange={change('league')}><option value="">Todas las competiciones</option>{!catalog.length && <option value="soccer/mex.1">Liga MX</option>}{catalog.map(league => <option key={league.id} value={league.id}>{league.name} · {league.sport}</option>)}</select></label>
      <label>Desde<input type="date" value={form.start} onInput={change('start')} onChange={change('start')} min="2000-01-01" max={form.end || today()} required/></label>
      <label>Hasta<input type="date" value={form.end} onInput={change('end')} onChange={change('end')} min={form.start || '2000-01-01'} max={today()} required/></label>
      <label>Equipo<input value={form.team} onChange={change('team')} maxLength={100} placeholder="Nombre del equipo"/></label>
      <button className="button primary" type="submit">Consultar archivo</button>
    </form>
    <div className="history-toolbar"><span className="muted small">{state.loading ? 'Consultando archivo…' : `${state.total} partidos guardados en este periodo`}</span><div>{canImport && <button className="button secondary" disabled={busy} onClick={importRange}>{busy ? 'Importando…' : 'Importar periodo de ESPN'}</button>}{!user.demo && <button className="button secondary" disabled={action === 'export' || !state.matches.length} onClick={exportData}>{action === 'export' ? 'Preparando…' : 'Exportar página JSON'}</button>}</div></div>
    {canImport && <p className="muted small">Puedes importar hasta 31 días de una liga, o hasta 4 días de todas las competiciones. Divide los periodos mayores en varias importaciones.</p>}
    {showJob && <div className="history-progress panel" role="status"><strong>{statuses[job.status] || job.status}</strong><progress max={job.days_total || 1} value={job.days_done || 0}/><span>{job.imported} nuevos · {job.updated} actualizados · {job.days_done}/{job.days_total} consultas de calendario</span>{job.errors?.length > 0 && <details><summary>{job.errors.length} incidencias · vuelve a importar el rango para reintentar</summary><ul>{job.errors.map((error,index) => <li key={index}>{error.league} {error.event ? `· ${error.event}` : ''}: {error.message}</li>)}</ul></details>}</div>}
    {(state.error || actionError) && <div className="form-error" role="alert">{state.error || actionError}<button className="text-button" onClick={() => setRevision(value => value+1)}>Reintentar consulta</button></div>}
    {!state.loading && !state.error && !state.matches.length && <Empty title="Aún no hay partidos guardados" text="Prueba otra liga o fecha. El administrador puede importar este periodo desde ESPN."/>}
    <div className="history-list">{state.matches.map(match => <article className="history-row" key={`${match.sportPath}:${match.id}`}><div className="history-date"><strong>{match.time}</strong><small>{match.league}</small></div><div className="history-teams">{[match.home,match.away].map((name,index) => <div key={index}><TeamBadge name={name} logoUrl={match.logos?.[index]}/><span>{name}</span><strong>{match.goals[index]}</strong></div>)}</div><div className="history-detail"><small className={match.statisticsState === 'available' ? 'available-statistics' : 'muted'}>{match.statisticsState === 'available' ? 'Estadísticas disponibles' : 'Estadísticas no disponibles'}</small><button className="button secondary" onClick={() => detail(match)} disabled={detailId === match.id}>{detailId === match.id ? 'Cargando…' : 'Ver partido'}</button></div></article>)}</div>
    {state.total > 30 && <nav className="history-pagination" aria-label="Páginas del histórico"><button className="button secondary" disabled={!page || state.loading} onClick={() => setPage(value => value-1)}>Anterior</button><span>{page+1} / {Math.ceil(state.total/30)}</span><button className="button secondary" disabled={(page+1)*30 >= state.total || state.loading} onClick={() => setPage(value => value+1)}>Siguiente</button></nav>}
    <p className="data-note">Fechas de Ciudad de México. El archivo contiene resultados reales importados; la disponibilidad histórica depende de la competición y de ESPN.</p>
  </section>;
}
