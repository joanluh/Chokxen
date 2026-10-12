import { useState } from 'react';
import { Brand, Icon } from '../components/UI.jsx';
import { asset } from '../media.js';
import { login, register } from '../services/auth.js';
import { validateAuth } from '../services/forms.js';

export function Auth({ onAuthenticated, initialError = '' }) {
  const [registration, setRegistration] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState({}), [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false), [visible, setVisible] = useState(false), [caps, setCaps] = useState(false);
  const errors = validateAuth(values, registration);
  function switchMode() { setRegistration(!registration); setError(''); setTouched({}); setVisible(false); setValues(current => ({ ...current, password: '', confirm: '' })); }
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const invalid = Object.keys(errors);
    setTouched({ name: true, email: true, password: true, confirm: true }); setError('');
    if (invalid.length) { document.getElementById(`auth-${invalid[0]}`)?.focus(); return; }
    setBusy(true);
    try { onAuthenticated(registration ? await register(values) : await login(values.email, values.password)); }
    catch (failure) { setError(failure.message); if (failure.registered) { setRegistration(false); setTouched({}); } }
    finally { setBusy(false); }
  }
  function field(key, label, type, autocomplete) {
    const password = key === 'password' || key === 'confirm';
    const invalid = touched[key] && errors[key];
    return <div className="field" key={key}><label htmlFor={`auth-${key}`}>{label}</label><div className={password ? 'password-input' : ''}><input id={`auth-${key}`} name={key} type={password && visible ? 'text' : type} autoComplete={autocomplete} value={values[key]} disabled={busy} aria-invalid={Boolean(invalid)} aria-describedby={invalid ? `error-${key}` : registration && key === 'password' ? 'password-hint' : undefined} onChange={event => { setValues(current => ({ ...current, [key]: event.target.value })); setError(''); }} onBlur={() => { setTouched(current => ({ ...current, [key]: true })); setCaps(false); }} onKeyUp={event => { if (password) setCaps(Boolean(event.getModifierState('CapsLock'))); }}/>{key === 'password' && <button type="button" className="icon-button" disabled={busy} onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} aria-pressed={visible}><Icon name="eye"/></button>}</div>{invalid && <p className="field-error" id={`error-${key}`}>{invalid}</p>}{registration && key === 'password' && <p id="password-hint" className="small muted">Al menos 8 caracteres, mayúscula, minúscula y número.</p>}</div>;
  }
  return <div className="auth-shell"><header><Brand onClick={() => {}}/></header><main className="auth-layout"><section className="auth-photo" aria-label="Chokxen Sport"><img src={asset('assets/photos/stadium.webp')} alt="" onError={event => { event.currentTarget.hidden = true; }}/><div><h1>Tu deporte,<br/>a tu manera.</h1><p>Resultados, equipos y jugadores.<br/>Sigue lo que te importa.</p></div></section><section className="auth-form"><h2>{registration ? 'Crea tu cuenta' : 'Inicia sesión'}</h2><p className="muted">{registration ? 'Guarda tus equipos y ligas favoritos.' : 'Entra con tu cuenta de Chokxen Sport.'}</p><form noValidate onSubmit={submit} aria-busy={busy}>{registration && field('name', 'Nombre', 'text', 'nickname')}{field('email', 'Correo electrónico', 'email', 'username')}{field('password', 'Contraseña', 'password', registration ? 'new-password' : 'current-password')}{registration && field('confirm', 'Confirma tu contraseña', 'password', 'new-password')}{caps && <p className="small" role="status">Bloq Mayús está activado.</p>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary full" disabled={busy} type="submit">{busy ? 'Comprobando…' : registration ? 'Crear cuenta' : 'Ingresar'}<Icon name="arrow"/></button></form><p className="auth-switch">{registration ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'} <button className="text-button" disabled={busy} onClick={switchMode}>{registration ? 'Inicia sesión' : 'Crear cuenta'}</button></p><details className="help-disclosure"><summary>Ayuda para ingresar</summary><p>Usa el correo con el que te registraste. Puedes mostrar la contraseña para revisar lo escrito.</p><p>Si olvidaste tu contraseña, pide ayuda al administrador. La recuperación de contraseñas aún no está disponible.</p></details></section></main><footer className="auth-footer">CHOKXEN SPORT · Tu deporte. Tu comunidad.</footer></div>;
}

export function Onboarding({ catalog, preferences, onSave, onCancel, onSignOut, busy, error, onRetry }) {
  const [step, setStep] = useState(0), [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => ({ teams: [...preferences.teams], leagues: [...preferences.leagues], players: [...(preferences.players || [])] }));
  const leagueIds = catalog.leagues.filter(row => selected.leagues.includes(row.nombreLiga)).map(row => row.idLiga);
  const choices = step === 0 ? catalog.leagues.map(row => ({ id: row.idLiga, name: row.nombreLiga })) : catalog.teams.filter(row => !leagueIds.length || leagueIds.includes(row.ligaId)).map(row => ({ id: row.equipoId, name: row.nombreEquipo }));
  const filtered = choices.filter(row => row.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const key = step === 0 ? 'leagues' : 'teams';
  function toggle(name) { setSelected(current => ({ ...current, [key]: current[key].includes(name) ? current[key].filter(value => value !== name) : [...current[key], name] })); }
  function next(value) { setStep(value); setQuery(''); }
  return <div className="onboarding-shell"><header className="simple-header"><Brand onClick={() => {}}/><button className="text-button" disabled={busy} onClick={onSignOut}>Cerrar sesión <Icon name="logout"/></button></header><main className="onboarding"><p className="muted small">Paso {step + 1} de 2 · Opcional</p><h1>{step === 0 ? '¿Qué ligas sigues?' : 'Elige tus equipos favoritos'}</h1><p className="muted">Puedes cambiar tus favoritos después desde Mi cuenta.</p><div className="step-tabs"><button aria-current={step === 0 ? 'step' : undefined} className={step === 0 ? 'selected' : ''} onClick={() => next(0)} disabled={busy}>1. Ligas <span>{selected.leagues.length}</span></button><button aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'selected' : ''} onClick={() => next(1)} disabled={busy}>2. Equipos <span>{selected.teams.length}</span></button></div>{error && <div className="form-error" role="alert">{error}<button className="button secondary" disabled={busy} onClick={onRetry}>Reintentar catálogo</button></div>}{!catalog.error && <><label className="search-box"><Icon name="search"/><input value={query} disabled={busy} onChange={event => setQuery(event.target.value)} placeholder={step === 0 ? 'Buscar liga' : 'Buscar equipo'} aria-label={step === 0 ? 'Filtrar ligas' : 'Filtrar equipos'}/></label><fieldset className="favorite-options" disabled={busy}><legend className="sr-only">{step === 0 ? 'Ligas favoritas' : 'Equipos favoritos'}</legend>{filtered.map(row => <label key={row.id} className={selected[key].includes(row.name) ? 'checked' : ''}><input type="checkbox" checked={selected[key].includes(row.name)} onChange={() => toggle(row.name)}/><span>{row.name}</span></label>)}</fieldset>{!filtered.length && <p className="muted">{query ? 'No hay coincidencias. Prueba otro nombre.' : 'El catálogo todavía no tiene registros disponibles.'}</p>}</>}<div className="onboarding-actions"><button className="text-button" disabled={busy} onClick={onCancel}>Ahora no</button>{step === 0 ? <button className="button primary" disabled={busy || Boolean(catalog.error)} onClick={() => next(1)}>Continuar <Icon name="arrow"/></button> : <><button className="button secondary" disabled={busy} onClick={() => next(0)}>Volver</button><button className="button primary" disabled={busy || Boolean(catalog.error)} onClick={() => onSave(selected)}>{busy ? 'Guardando…' : 'Guardar favoritos'}<Icon name="check"/></button></>}</div></main></div>;
}

