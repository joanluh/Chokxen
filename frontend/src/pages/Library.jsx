import { useEffect, useState } from 'react';
import { Icon, Empty } from '../components/UI.jsx';

export default function Library({ client, data, query, onRetry }) {
  const [results, setResults] = useState(null), [error, setError] = useState(''), [detail, setDetail] = useState(null);
  useEffect(() => {
    let active = true; setResults(null); setError(''); setDetail(null);
    if (query.trim().length < 3) return;
    const timer = setTimeout(() => client.search(query).then(value => { if (active) setResults(value); }).catch(failure => { if (active) setError(failure.message); }), 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, client]);
  async function open(kind, id) { setError(''); try { setDetail({ kind, row: await client.detail(kind, id) }); } catch (failure) { setError(failure.message); } }
  const labels = { nombreLiga: 'Liga', nombreEquipo: 'Equipo', nombreJugador: 'Nombre', apellido: 'Apellido', apodo: 'Apodo', posicion: 'Posición', numeroDeCamiseta: 'Número de camiseta', fechaFundacion: 'Fundación', temporadaActual: 'Temporada', tipo: 'Tipo' };
  const groups = [
    ['league', 'Ligas', results?.ligas || data.leagues, 'idLiga', row => row.nombreLiga],
    ['team', 'Equipos', results?.equipos || data.teams, 'equipoId', row => row.nombreEquipo],
    ['player', 'Jugadores', results?.jugadores || data.players, 'idJugador', row => `${row.nombreJugador} ${row.apellido}`.trim()],
  ];
  return <section className="panel library-panel"><div className="section-heading"><div><span className="eyebrow muted">CATÁLOGO DE CHOKXEN</span><h2>{query.trim().length >= 3 ? 'Búsqueda en el servidor' : 'Ligas, equipos y jugadores'}</h2></div><button className="text-button" onClick={onRetry}>Actualizar</button></div><p className="muted small">Consulta los registros del backend. Usa el buscador superior para buscar nombres de tres caracteres o más.</p>{error && <p className="form-error" role="alert">{error}</p>}{detail && <div className="catalog-detail"><div className="section-heading"><h3>Detalle del registro</h3><button className="icon-button" aria-label="Cerrar detalle" onClick={() => setDetail(null)}><Icon name="close"/></button></div><dl>{Object.entries(detail.row).filter(([label,value]) => labels[label] && value != null && typeof value !== 'object').map(([label,value]) => <div key={label}><dt>{labels[label]}</dt><dd>{String(value)}</dd></div>)}</dl></div>}<div className="catalog-columns">{groups.map(([kind, label, rows, id, name]) => <section key={kind}><h3>{label} <small>({rows.length})</small></h3>{rows.length ? <ul>{rows.map(row => <li key={row[id]}><button className="text-button" onClick={() => open(kind, row[id])}>{name(row)} <Icon name="chevron" size={15}/></button></li>)}</ul> : <Empty title="Sin registros"/>}</section>)}</div></section>;
}
