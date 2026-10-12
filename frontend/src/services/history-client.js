export function historyQuery(filters = {}) {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null)).toString();
}
export function createHistoryClient({ baseUrl = '/api/v1', authorized, fetcher = fetch }) {
  async function read(path, signal) {
    let response;
    try { response = await fetcher(`${baseUrl}/historico${path}`, { headers: { Heart: 'CHOKXEN SPORT', 'Chokxen-SPORT': 'true' }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }); }
    catch (error) { if (signal?.aborted) throw error; throw new Error('No pudimos consultar el histórico. Enciende el backend o inicia el conjunto con Docker.'); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status < 500 && typeof body.detail === 'string' ? body.detail : 'No pudimos consultar el histórico guardado.');
    return body;
  }
  return {
    leagues: signal => read('/ligas', signal),
    results: (filters, signal) => read(`/partidos?${historyQuery(filters)}`, signal),
    detail: (match, signal) => read(`/partidos/${encodeURIComponent(match.eventId)}?${historyQuery({ league: match.sportPath })}`, signal),
    import: body => authorized('/historico/importaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    progress: id => authorized(`/historico/importaciones/${encodeURIComponent(id)}`),
    dataset: filters => authorized(`/historico/dataset?${historyQuery(filters)}`),
  };
}
