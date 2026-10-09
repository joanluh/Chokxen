import { useEffect, useState } from 'react';
import { fetchScores } from './espn.js';
export const usesEspn = !globalThis.__CHOKXEN_OFFLINE__ && import.meta.env.VITE_SPORTS_MODE !== 'demo';
export function useScores({ enabled, sport, league, day }) {
  const [state, setState] = useState({ matches: [], loading: true, error: '', notice: '', updated: null });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled || !usesEspn) return;
    let disposed = false, timer;
    const controller = new AbortController();
    setState({ matches: [], loading: true, error: '', notice: '', updated: null });
    async function update() {
      if (document.hidden) { timer = setTimeout(update, 10000); return; }
      let interval = 10000;
      try {
        const result = await fetchScores({ sport, league, day, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
        if (!disposed) setState({ ...result, loading: false, error: '', updated: new Date() });
        interval = day === 'Hoy' && result.matches.some(match => match.status === 'En vivo') ? 10000 : 60000;
      } catch (error) {
        if (!disposed) setState(previous => ({ ...previous, loading: false, error: error.message }));
        interval = 60000;
      }
      if (!disposed) timer = setTimeout(update, interval);
    }
    update();
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, [enabled, sport, league, day, revision]);
  return { ...state, retry: () => setRevision(value => value + 1) };
}
