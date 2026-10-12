import { useEffect, useRef, useState } from 'react';
import { Brand, Icon, Modal, TeamBadge } from './components/UI.jsx';
import { Auth, Onboarding } from './pages/Auth.jsx';
import { Home, Results, Predictions, Bets } from './pages/Sports.jsx';
import Store from './pages/Store.jsx';
import Library from './pages/Library.jsx';
import MatchDetails from './components/MatchDetails.jsx';
import Admin from './pages/Admin.jsx';
import { initialUsers, matches, sports, leagues, money } from './data.js';
import { isDemo, isLocalCheck, logout, restoreSession, libraryClient, historyClient } from './services/auth.js';

import { useScores, usesEspn } from './services/useScores.js';
import { selectMatchSources } from './services/demo-matches.js';
import { withLocalOnboarding } from './services/onboarding.js';

function read(key, fallback) { try { return JSON.parse(localStorage.getItem(`chokxen:${key}`)) ?? fallback; } catch { return fallback; } }
function useSaved(key, initial, validate = () => true) {
  const [value, setValue] = useState(() => { const saved = read(key, initial); return validate(saved) ? saved : initial; });
  useEffect(() => { try { localStorage.setItem(`chokxen:${key}`, JSON.stringify(value)); } catch { /* El sitio sigue funcionando sin almacenamiento. */ } }, [key, value]);
  return [value, setValue];
}
const navigation = [['inicio', 'Inicio', 'home'], ['resultados', 'Resultados', 'scores'], ['apuestas', 'Apuestas', 'trophy'], ['predicciones', 'Predicciones', 'chart'], ['tienda', 'Tienda', 'bag']];
const allowedRoutes = [...navigation.map(([route]) => route), 'admin'];
function currentRoute() { const route = location.hash.slice(2); return allowedRoutes.includes(route) ? route : 'inicio'; }

export default function App() {
  const [user, setUser] = useState(null);
  const demoSession = isDemo || user?.demo === true;
  const [restoring, setRestoring] = useState(!isDemo);
  const [authError, setAuthError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [library, setLibrary] = useState({ leagues: [], teams: [], players: [], records: [], loading: false, error: '' });
  const [savingFavorites, setSavingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const sessionVersion = useRef(0);
  const [resultsDay, setResultsDay] = useState('Hoy');
  const [resultsView, setResultsView] = useState('history');
  const [page, setPage] = useState(currentRoute);
  const [preferencesByUser, setPreferencesByUser] = useSaved('preferences', {}, value => value && typeof value === 'object' && !Array.isArray(value));
  const preferences = preferencesByUser[user?.email] || (demoSession ? { teams: ['América', 'Monterrey'], leagues: ['Liga MX'], players: [] } : { teams: [], leagues: [], players: [] });
  const [editingFavorites, setEditingFavorites] = useState(false);
  const [sport, setSport] = useState('Fútbol');
  const [league, setLeague] = useState('Todas');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todo');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [cart, setCart] = useSaved('cart', [], value => Array.isArray(value) && value.every(item => Number.isInteger(item.productId) && item.productId >= 1 && item.productId <= 6 && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10));
  const [accountData, setAccountData] = useSaved('accounts', {}, value => value && typeof value === 'object' && !Array.isArray(value));
  const account = accountData[user?.email] || { balance: 1500, bets: [] };
  const [users, setUsers] = useSaved('users', initialUsers, Array.isArray);
  const [orders, setOrders] = useSaved('orders', [], Array.isArray);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const mainRef = useRef(null);
  function notify(message) { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); }
  useEffect(() => { const update = () => setPage(currentRoute()); window.addEventListener('hashchange', update); return () => { window.removeEventListener('hashchange', update); clearTimeout(toastTimer.current); }; }, []);
  useEffect(() => { if (page === 'admin' && user && user.role !== 'Administrador') { location.hash = '/inicio'; setPage('inicio'); } }, [page, user]);
  useEffect(() => { if (user) document.title = `${page === 'admin' ? 'Administración' : navigation.find(([route]) => route === page)?.[1] || 'Inicio'} | Chokxen Sport`; }, [page, user]);
  function navigate(next) { location.hash = `/${next}`; setPage(next); setSidebarOpen(false); requestAnimationFrame(() => { mainRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }); }
  async function initializeLibrary(profile, version) {
    setLibrary(current => ({ ...current, loading: true, error: '' }));
    try {
      const data = await libraryClient.load();
      if (sessionVersion.current !== version) return;
      const next = libraryClient.preferences(data);
      const completed = next.completed || preferencesByUser[profile.email]?.completed === true;
      setPreferencesByUser(current => ({ ...current, [profile.email]: { ...next, completed } }));
      setLibrary({ ...data, loading: false, error: '' });
      setUser(current => current?.email === profile.email ? { ...current, onboarded: completed } : current);
    } catch (failure) { if (sessionVersion.current === version) setLibrary(current => ({ ...current, loading: false, error: failure.message })); }
  }
  function authenticated(profile) {
    const version = ++sessionVersion.current;
    setAuthError(''); setFavoriteError(''); setUser(withLocalOnboarding(profile, preferencesByUser)); setQuery('');
    navigate(profile.role === 'Administrador' ? 'admin' : 'inicio');
    if (!profile.demo) initializeLibrary(profile, version);
    else setLibrary({ leagues: [], teams: [], players: [], records: [], loading: false, error: '' });
  }
  async function savePreferences(next) {
    if (savingFavorites) return;
    const version = sessionVersion.current;
    setSavingFavorites(true); setFavoriteError('');
    try {
      let saved = next;
      if (!user.demo) {
        if (library.loading || library.error) throw new Error('Carga el catálogo del servidor antes de guardar.');
        const data = await libraryClient.save(next, library);
        if (sessionVersion.current !== version) return;
        setLibrary({ ...data, loading: false, error: '' }); saved = libraryClient.preferences(data);
      }
      if (sessionVersion.current !== version) return;
      setPreferencesByUser(current => ({ ...current, [user.email]: { ...saved, completed: true } }));
      setUser(current => ({ ...current, onboarded: true })); setEditingFavorites(false);
      notify(user.demo ? 'Tus favoritos se guardaron en este dispositivo.' : 'Tus favoritos se guardaron en el servidor.');
    } catch (failure) { if (sessionVersion.current === version) setFavoriteError(failure.message); }
    finally { if (sessionVersion.current === version) setSavingFavorites(false); }
  }
  async function signOut() { if (signingOut) return; setSigningOut(true); ++sessionVersion.current; setSavingFavorites(false); try { await logout(); } catch { /* El cliente elimina la sesión local aunque el servidor no responda. */ } finally { setUser(null); setDialog(null); setSelection(null); setSidebarOpen(false); setEditingFavorites(false); setSigningOut(false); navigate('inicio'); } }
  useEffect(() => {
    let active = true;
    restoreSession().then(profile => { if (active && profile) { setUser(withLocalOnboarding(profile, preferencesByUser)); if (!profile.demo) initializeLibrary(profile, sessionVersion.current); } }).catch(error => { if (active) setAuthError(error.message); }).finally(() => { if (active) setRestoring(false); });
    const expire = () => { ++sessionVersion.current; setSavingFavorites(false); setEditingFavorites(false); setUser(null); setDialog(null); setSelection(null); setAuthError('Tu sesión terminó. Inicia sesión de nuevo.'); };
    window.addEventListener('chokxen:session-expired', expire);
    return () => { active = false; ++sessionVersion.current; window.removeEventListener('chokxen:session-expired', expire); };
  }, []);
  const scores = useScores({ enabled: Boolean(user) && (page === 'inicio' || page === 'resultados' && resultsView === 'recent'), sport, league, day: page === 'resultados' ? resultsDay : 'Hoy' });
  const displaySports = page === 'inicio' || page === 'resultados' ? selectMatchSources({ espnMatches: scores.matches, demoMatches: matches, demoSession, usesEspn, day: page === 'resultados' ? resultsDay : 'Hoy' }) : matches;
  const filteredMatches = displaySports.filter(match => match.sport === sport && (league === 'Todas' || match.league === league) && `${match.home} ${match.away} ${match.league}`.toLowerCase().includes(query.trim().toLowerCase()));
  const onSelect = (match, index) => { setSelection({ matchId: match.id, index }); navigate('apuestas'); };
  const onDetail = match => setDialog({ type: 'match', match });
  function placeBet(bet) {
    setAccountData(current => { const previous = current[user.email] || { balance: 1500, bets: [] }; if (bet.amount > previous.balance) return current; return { ...current, [user.email]: { balance: Math.round((previous.balance - bet.amount) * 100) / 100, bets: [...previous.bets, { ...bet, id: Date.now() }] } }; });
    notify('Simulación guardada. Puedes verla en Mis apuestas.');
  }
  if (restoring) return <main className="session-loading" aria-live="polite"><Brand onClick={() => {}}/><Icon name="lock" size={32}/><h1>Recuperando tu sesión…</h1><p className="muted">Un momento, estamos comprobando tu acceso.</p></main>;
  if (!user) return <Auth onAuthenticated={authenticated} initialError={authError}/>;
  if (!user.demo && library.loading) return <main className="session-loading"><Brand onClick={() => {}}/><h1>Cargando tu cuenta…</h1><p className="muted">Consultando ligas, equipos, jugadores y favoritos.</p><button className="button secondary" onClick={signOut} disabled={signingOut}>Cerrar sesión</button></main>;
  if (!user.onboarded || editingFavorites) return <><Onboarding catalog={user.demo ? null : library} error={favoriteError || library.error} busy={savingFavorites} onRetry={() => { setFavoriteError(''); initializeLibrary(user, sessionVersion.current); }} user={user} onSignOut={signOut} signingOut={signingOut} preferences={user.onboarded ? preferences : { teams: [], leagues: [] }} onSave={savePreferences} onCancel={user.onboarded ? () => setEditingFavorites(false) : undefined}/><div className="toast" role="status">{toast}</div></>;
  const adminPage = page === 'admin' && user.role === 'Administrador';
  return <div className="app-shell"><a className="skip-link" href="#main-content">Saltar al contenido</a>{isLocalCheck && <div className="preview-banner">Servidor de prueba local · cuentas ficticias · histórico real de ESPN</div>}{demoSession && <div className="preview-banner" role="status"><span>Experiencia de prueba · {user.role === 'Administrador' ? 'Administrador' : user.plan === 'Premium' ? 'Premium' : 'Básico'}</span><button className="text-button" onClick={signOut}>Cambiar perfil <Icon name="user" size={16}/></button></div>}<header className="app-header"><Brand onClick={() => navigate('inicio')}/><label className="search-box global-search"><Icon name="search"/><input value={query} onChange={event => { setQuery(event.target.value); if (page !== 'resultados' && page !== 'predicciones' && page !== 'apuestas') navigate('resultados'); }} placeholder="Buscar equipo, liga o partido…" aria-label="Buscar equipo, liga o partido"/></label><div className="header-actions"><span className="balance-pill"><span className="balance-dot"/><span>Créditos <strong>{money(account.balance)}</strong></span></span><button className="account-button" aria-label="Mi cuenta" onClick={() => setDialog({ type: 'profile' })}><span className="avatar small-avatar">{user.name.slice(0, 1).toUpperCase()}</span><span>Mi cuenta</span><Icon name="chevron" size={14}/></button></div></header><nav className="top-nav" aria-label="Navegación principal"><div>{navigation.map(([route, label, icon]) => <button key={route} className={page === route ? 'active' : ''} onClick={() => navigate(route)} aria-current={page === route ? 'page' : undefined}><Icon name={icon} className="nav-icon"/><span className="nav-label">{label}</span>{route === 'predicciones' && <span className="nav-premium-dot"/>}</button>)}{user.role === 'Administrador' && <button className={`desktop-admin-link ${adminPage ? 'active' : ''}`} onClick={() => navigate('admin')}>Administración</button>}</div><button className="help-button" onClick={() => setDialog({ type: 'help' })}><Icon name="help" size={17}/>Ayuda</button></nav>{!adminPage && page !== 'tienda' && !(page === 'resultados' && resultsView === 'history') && <div className="mobile-filter-row"><button className="button secondary" aria-expanded={sidebarOpen} aria-controls="side-filters" onClick={() => setSidebarOpen(!sidebarOpen)}><Icon name="menu"/>{page === 'tienda' ? 'Categorías' : 'Deportes y ligas'}</button><span>{page === 'tienda' ? category : `${sport} · ${league}`}</span></div>}<div className={`workspace ${adminPage || page === 'resultados' && resultsView === 'history' ? 'admin-workspace' : ''}`}>{!adminPage && !(page === 'resultados' && resultsView === 'history') && <aside className={`side-panel ${sidebarOpen ? 'open' : ''}`} id="side-filters" aria-label="Filtros y favoritos"><div className="mobile-filter-heading"><h2>Filtros y favoritos</h2><button className="icon-button" aria-label="Cerrar filtros" onClick={() => setSidebarOpen(false)}><Icon name="close"/></button></div>{page === 'tienda' ? <><h2>Categorías</h2><div className="side-options">{['Todo', 'Jerseys', 'Accesorios'].map(value => <button key={value} className={category === value ? 'active' : ''} onClick={() => { setCategory(value); setSidebarOpen(false); }}>{value}</button>)}</div><div className="sidebar-note"><Icon name="bag"/><p>Los colores que llevas.<br/>La pasión que compartes.</p></div></> : <><h2>Deportes</h2><div className="side-options">{sports.map((value, index) => <button key={value} aria-pressed={sport === value} className={sport === value ? 'active' : ''} onClick={() => { setSport(value); setLeague('Todas'); setSidebarOpen(false); }}><span className="sport-symbol" aria-hidden="true">{['⚽', '◈', '◉', '◌'][index]}</span>{value}</button>)}</div><div className="side-divider"/><h2>Ligas</h2><div className="league-options">{['Todas', ...(sport === 'Fútbol' ? leagues : [sport === 'Básquet' ? 'NBA' : sport === 'Tenis' ? 'ATP' : 'NFL'])].map(value => <button key={value} aria-pressed={league === value} className={league === value ? 'active' : ''} onClick={() => { setLeague(value); setSidebarOpen(false); }}>{value}<Icon name="chevron" size={13}/></button>)}</div><div className="side-divider"/><h2>Mis favoritos</h2><div className="side-favorites">{preferences.teams.slice(0, 3).map(team => <button key={team} onClick={() => { setSport('Fútbol'); setLeague('Todas'); setQuery(team); navigate('resultados'); }}><Icon name="star" size={15}/>{team}</button>)}</div><button className="text-button add-favorite" onClick={() => setEditingFavorites(true)}><Icon name="plus" size={15}/>Editar favoritos</button></>}<div className="side-bottom"><span className="eyebrow muted">CHOKXEN SPORT</span><small>Todo el juego.<br/>Una sola comunidad.</small></div></aside>}<main ref={mainRef} id="main-content" tabIndex={-1} className="main-view">{usesEspn && (page === 'inicio' || page === 'resultados' && resultsView === 'recent') && (scores.error || scores.notice) && <p className="data-note" role="status">{scores.error || scores.notice}</p>}{page === 'inicio' && <Home live={usesEspn} onDetail={onDetail} user={user} preferences={preferences} filteredMatches={filteredMatches} navigate={navigate} onEditFavorites={() => setEditingFavorites(true)} bets={account.bets} onSelect={onSelect}/>} {page === 'resultados' && <Results view={resultsView} onViewChange={setResultsView} client={historyClient} user={user} query={query} live={usesEspn} day={resultsDay} onDayChange={setResultsDay} filteredMatches={filteredMatches} onDetail={onDetail}/>} {page === 'predicciones' && <Predictions user={user} filteredMatches={filteredMatches} onProfile={() => setDialog({ type: 'profile' })} onDetail={onDetail}/>} {page === 'apuestas' && <Bets user={user} filteredMatches={filteredMatches} selection={selection} setSelection={setSelection} onPlace={placeBet} balance={account.balance} bets={account.bets} onProfile={() => setDialog({ type: 'profile' })}/>} {page === 'tienda' && <Store user={user} cart={cart} setCart={setCart} category={category} setCategory={setCategory} notify={notify} onOrder={order => setOrders(current => [...current, order])}/>} {!user.demo && (page === 'inicio' || page === 'resultados' && resultsView === 'recent') && <Library client={libraryClient} data={library} query={query} onRetry={() => initializeLibrary(user, sessionVersion.current)}/>} {adminPage && <Admin users={users} setUsers={setUsers} orders={orders} notify={notify}/>}</main></div><footer className="app-footer"><span>CHOKXEN <strong>SPORT</strong><span className="footer-dot">/</span> Tu deporte. Tu comunidad.</span><span>{demoSession ? 'Perfil de prueba · Tienda y apuestas simuladas' : 'Acceso conectado · Tienda y apuestas de demostración'}</span></footer>{toast && <div className="toast" role="status"><Icon name="check"/>{toast}</div>}{dialog?.type === 'profile' && <Modal title="Mi cuenta" onClose={() => setDialog(null)}><div className="profile-summary"><span className="avatar profile-avatar">{user.name[0]}</span><h3>{user.name}</h3><p className="muted">{user.email}</p><span className="plan-badge">{user.role === 'Administrador' ? 'Administrador' : `Plan ${user.plan === 'Basico' ? 'Básico' : user.plan}`}</span></div><p className="muted small">{demoSession ? 'Cuenta de demostración. Los favoritos y las simulaciones se guardan en este navegador.' : 'Perfil y favoritos consultados en el servidor.'}</p><button className="button secondary full" onClick={() => { setDialog(null); setEditingFavorites(true); }}>Editar favoritos <Icon name="star"/></button><button className="button secondary full mobile-account-action" onClick={() => setDialog({ type: 'help' })}>Ayuda <Icon name="help"/></button>{user.role === 'Administrador' && <button className="button secondary full mobile-account-action" onClick={() => { setDialog(null); navigate('admin'); }}>Administración <Icon name="user"/></button>}<button className="button secondary full logout-button" disabled={signingOut} onClick={signOut}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'} <Icon name="logout"/></button></Modal>}{dialog?.type === 'help' && <Modal title="Ayuda de Chokxen" onClose={() => setDialog(null)}><div className="help-content"><h3>Resultados y favoritos</h3><p>Filtra por deporte o liga, busca equipos y guarda tus favoritos desde Mi cuenta.</p><h3>Funciones Premium</h3><p>Predicciones y apuestas están disponibles para el perfil Premium. Las apuestas usan créditos virtuales.</p><h3>Tienda</h3><p>Explora productos, elige tallas y crea pedidos de prueba. No se procesan pagos reales.</p>{demoSession && <><h3>Probar otro perfil</h3><p>Cierra sesión y elige una cuenta de demostración: Básico, Premium o Administrador.</p></>}</div></Modal>}{dialog?.type === 'match' && <Modal title="Detalle del encuentro" onClose={() => setDialog(null)}><MatchDetails key={dialog.match.id} match={dialog.match} user={user}/></Modal>}</div>;
}
