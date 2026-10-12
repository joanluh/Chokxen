import { useEffect, useId, useRef, useState } from 'react';
import { asset, teamLogos } from '../media.js';

const paths = {
  home: <><path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/></>,
  scores: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 4v16M7 9h1v6M16 9h2v3h-2v3h2"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
  bag: <><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  logout: <><path d="M9 4H4v16h5m3-8h9m-4-4 4 4-4 4"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  chart: <path d="M4 3v18h17M8 16l4-5 4 2 4-8"/>,
  trophy: <><path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm4 11v6m-4 1h8M8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 4h.01"/></>,
};

export function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.star}</svg>;
}

export function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Chokxen Sport, ir al inicio">
      <span className="brand-mark">C<span>/</span></span>
      <span>CHOKXEN<small>SPORT</small></span>
    </button>
  );
}

// Escudos originales almacenados localmente.
function GenericBadge({ name, color = '#829ac0' }) {
  const abbr = name?.slice(0, 3).toUpperCase() || '??';
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill={color} stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
      <path d="M12 12 L48 12 L48 36 Q48 52 30 58 Q12 52 12 36Z" fill="rgba(0,0,0,0.2)"/>
      <text x="30" y="36" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif">{abbr}</text>
    </svg>
  );
}

export function TeamBadge({ name, color = '#829ac0', large = false, logoUrl }) {
  const source = logoUrl || (teamLogos[name] ? asset(teamLogos[name]) : null);
  const [failed, setFailed] = useState(null);
  const logo = source && failed !== source ? <img src={source} alt="" width="200" height="200" decoding="async" onError={() => setFailed(source)}/> : <GenericBadge name={name} color={color}/>;
  return (
    <span
      className={`team-badge ${large ? 'large' : ''}`}
      style={{ '--team-color': color }}
      aria-hidden="true"
    >
      {logo}
    </span>
  );
}

export function Empty({ title = 'No encontramos resultados', text = 'Prueba con otros filtros o una búsqueda diferente.' }) {
  return (
    <div className="empty">
      <Icon name="search" size={32}/>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose(); }}>
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><Icon name="close"/></button>
      </div>
      {children}
    </dialog>
  );
}

