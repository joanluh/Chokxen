import { useEffect, useRef, useState } from 'react';
import { Brand, Icon, Modal, TeamBadge } from './components/UI.jsx';
import { Auth, Onboarding } from './pages/Auth.jsx';
import Library from './pages/Library.jsx';
import Results from './pages/Results.jsx';
import MatchDetails from './components/MatchDetails.jsx';
import { logout, restoreSession, libraryClient } from './services/auth.js';
const navigation = [['inicio', 'Inicio', 'home'], ['catalogo', 'Catálogo', 'search'], ['resultados', 'Resultados', 'scores'], ['cuenta', 'Mi cuenta', 'user']];
const empty = { leagues: [], teams: [], players: [], records: [], loading: false, error: '' };
const noPreferences = { teams: [], leagues: [], players: [] };
function route() { const value = location.hash.slice(2); return navigation.some(([key]) => key === value) ? value : 'inicio'; }
function completed(email) { try { return localStorage.getItem(`chokxen:onboarding:${email}`) === 'done'; } catch { return false; } }
function markCompleted(email) { try { localStorage.setItem(`chokxen:onboarding:${email}`, 'done'); } catch { /* Opcional. */ } }

export default function App() {
  const [user, setUser] = useState(null), [restoring, setRestoring] = useState(true), [authError, setAuthError] = useState('');
  const [page, setPage] = useState(route), [query, setQuery] = useState(''), [catalog, setCatalog] = useState(empty);
  const [preferences, setPreferences] = useState(noPreferences), [onboarding, setOnboarding] = useState(false);
  const [busy, setBusy] = useState(false), [signingOut, setSigningOut] = useState(false), [favoriteError, setFavoriteError] = useState('');
  const [toast, setToast] = useState(''), [match, setMatch] = useState(null);
  const version = useRef(0), main = useRef(null);
  function navigate(next) { location.hash = `/${next}`; setPage(next); requestAnimationFrame(() => main.current?.focus()); }
  async function loadCatalog(profile, generation = version.current, initial = false) {
    setCatalog(current => ({ ...current, loading: true, error: '' }));
    try {
      const data = await libraryClient.load(); if (version.current !== generation) return;
      const next = libraryClient.preferences(data);
      setCatalog({ ...data, loading: false, error: '' }); setPreferences(next);
      if (initial && (next.completed || completed(profile.email))) setOnboarding(false);
    } catch (failure) { if (version.current === generation) setCatalog(current => ({ ...current, loading: false, error: failure.message })); }
  }
  function authenticated(profile) {
    const generation = ++version.current; setUser(profile); setPreferences(noPreferences); setQuery(''); setAuthError(''); setFavoriteError('');
    setOnboarding(!completed(profile.email)); navigate('inicio'); loadCatalog(profile, generation, true);
  }
  useEffect(() => {
    let active = true;
    restoreSession().then(profile => { if (active && profile) authenticated(profile); }).catch(failure => { if (active) setAuthError(failure.message); }).finally(() => { if (active) setRestoring(false); });
    const expired = () => { ++version.current; setUser(null); setCatalog(empty); setOnboarding(false); setBusy(false); setMatch(null); setAuthError('Tu sesión terminó. Inicia sesión de nuevo.'); };
    window.addEventListener('chokxen:session-expired', expired);
    return () => { active = false; ++version.current; window.removeEventListener('chokxen:session-expired', expired); };
  }, []);
  useEffect(() => { const update = () => setPage(route()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  useEffect(() => { document.title = `${user ? navigation.find(([key]) => key === page)?.[1] : 'Acceso'} | Chokxen Sport`; }, [page, user]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer); }, [toast]);
  async function signOut() {
    if (signingOut) return; setSigningOut(true); ++version.current;
    try { await logout(); } catch { /* Logout también elimina los tokens locales. */ }
    finally { setAuthError(''); setUser(null); setCatalog(empty); setPreferences(noPreferences); setOnboarding(false); setBusy(false); setMatch(null); setQuery(''); setToast(''); setSigningOut(false); navigate('inicio'); }
  }
  function skipOnboarding() { markCompleted(user.email); setOnboarding(false); setFavoriteError(''); }
  async function saveFavorites(next) {
    if (busy) return; const generation = version.current; setBusy(true); setFavoriteError('');
    try {
      const data = await libraryClient.save(next, catalog); if (generation !== version.current) return;
      setCatalog({ ...data, loading: false, error: '' }); setPreferences(libraryClient.preferences(data)); markCompleted(user.email); setOnboarding(false); setToast('Tus favoritos se guardaron.');
    } catch (failure) {
      if (generation === version.current) {
        setFavoriteError(`${failure.message} Revisa tus selecciones antes de volver a guardar.`);
        // Puede haber escrituras parciales: conserva las selecciones del formulario
        // y recupera los IDs persistidos antes del siguiente intento.
        try { const data = await libraryClient.load(); if (generation === version.current) { setCatalog({ ...data, loading: false, error: '' }); setPreferences(libraryClient.preferences(data)); } } catch { /* Se mantiene el error de guardado. */ }
      }
    } finally { if (generation === version.current) setBusy(false); }
  }
  if (restoring) return <main className="session-loading"><Brand onClick={() => {}}/><h1>Comprobando tu sesión…</h1><p className="muted" role="status">Estamos verificando tu acceso con el servidor.</p></main>;
  if (!user) return <Auth key={authError} initialError={authError} onAuthenticated={authenticated}/>;
  if (onboarding && catalog.loading) return <main className="session-loading"><Brand onClick={() => {}}/><h1>Cargando tus preferencias…</h1><div className="skeleton" role="status" aria-label="Cargando catálogo"/><button className="text-button" onClick={skipOnboarding}>Configurar después</button><button className="text-button" disabled={signingOut} onClick={signOut}>Cerrar sesión</button></main>;
  if (onboarding) return <Onboarding catalog={catalog} preferences={preferences} onSave={saveFavorites} onCancel={skipOnboarding} onSignOut={signOut} busy={busy || signingOut} error={favoriteError || catalog.error} onRetry={() => { setFavoriteError(''); loadCatalog(user); }}/>;
  return <div className="app-shell"><a className="skip-link" href="#main-content">Saltar al contenido</a><header className="app-header"><Brand onClick={() => navigate('inicio')}/><label className="search-box global-search"><Icon name="search"/><input value={query} onChange={event => { setQuery(event.target.value); if (page !== 'catalogo') navigate('catalogo'); }} placeholder="Buscar liga, equipo o jugador" aria-label="Buscar en el catálogo de Chokxen"/>{query && <button className="icon-button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}><Icon name="close"/></button>}</label><button className="account-button" onClick={() => navigate('cuenta')} aria-label="Mi cuenta"><Icon name="user"/><span>{user.name}</span></button></header><nav className="top-nav" aria-label="Navegación principal">{navigation.map(([key, label, icon]) => <button key={key} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav><main className="main-view" id="main-content" tabIndex={-1} ref={main}>{page === 'inicio' && <><div className="page-heading"><div><h1>Tu inicio</h1><p className="muted">Tus favoritos y la jornada de hoy.</p></div><button className="button secondary" onClick={() => { setFavoriteError(''); setOnboarding(true); }}>Editar favoritos <Icon name="star"/></button></div><section className="favorites-section"><h2>Mis favoritos</h2>{catalog.loading ? <div className="skeleton" role="status" aria-label="Cargando favoritos"/> : catalog.error ? <div className="form-error" role="alert">{catalog.error}<button className="button secondary" onClick={() => loadCatalog(user)}>Reintentar</button></div> : preferences.teams.length + preferences.leagues.length + preferences.players.length ? <div className="favorite-chips">{preferences.teams.map(name => <span key={name}><TeamBadge name={name}/>{name}</span>)}{[...preferences.leagues, ...preferences.players].map(name => <span key={name}><Icon name="star" size={16}/>{name}</span>)}</div> : <p className="muted">Elige tus ligas y equipos con «Editar favoritos» para encontrarlos aquí.</p>}</section><Results home onDetail={setMatch}/></>}{page === 'catalogo' && <Library client={libraryClient} data={catalog} query={query} onClear={() => setQuery('')} onRetry={() => loadCatalog(user)}/>}{page === 'resultados' && <Results onDetail={setMatch}/>} {page === 'cuenta' && <section className="account-view"><h1>Mi cuenta</h1><p className="muted">Datos de tu sesión verificados con Chokxen.</p><dl className="detail-list"><div><dt>Nombre</dt><dd>{user.name}</dd></div><div><dt>Correo</dt><dd>{user.email}</dd></div><div><dt>Rol</dt><dd>{user.role}</dd></div></dl><button className="button secondary" onClick={() => { setFavoriteError(''); setOnboarding(true); }}>Editar favoritos <Icon name="star"/></button><details className="help-disclosure"><summary>Ayuda de mi cuenta</summary><p>Busca ligas, equipos y jugadores desde Catálogo. El catálogo y tus favoritos se consultan en Chokxen; los encuentros y estadísticas en Resultados provienen de ESPN.</p><p>La recuperación de contraseñas todavía no está disponible. Contacta al administrador si necesitas recuperar acceso.</p></details><button className="button secondary" disabled={signingOut} onClick={signOut}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}<Icon name="logout"/></button></section>}</main><footer className="app-footer">CHOKXEN SPORT · Tu deporte. Tu comunidad.</footer>{toast && <div className="toast" role="status"><Icon name="check"/>{toast}</div>}{match && <Modal title="Detalle del partido" onClose={() => setMatch(null)}><MatchDetails key={match.id} match={match}/></Modal>}</div>;
}
