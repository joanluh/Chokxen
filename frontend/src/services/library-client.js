export function createLibraryClient(authorized) {
  const list = async path => {
    const body = await authorized(path);
    if (!Array.isArray(body)) throw new Error('El servidor devolvió un catálogo inválido.');
    return body;
  };
  const catalogs = () => Promise.all([list('/competiciones/'), list('/equipos/'), list('/jugadores/')]).then(([leagues, teams, players]) => ({ leagues, teams, players }));
  const favorites = () => list('/favoritos/');
  async function load() {
    const [catalog, records] = await Promise.all([catalogs(), favorites()]);
    return { ...catalog, records };
  }
  function preferences(data) {
    const selected = (type, rows, id, label) => data.records.filter(record => record.tipoFavorito === type).flatMap(record => {
      const row = rows.find(item => item[id] === record.elementoId);
      return row ? [label(row)] : [];
    });
    return {
      teams: selected('equipo', data.teams, 'equipoId', row => row.nombreEquipo),
      leagues: selected('liga', data.leagues, 'idLiga', row => row.nombreLiga),
      players: selected('jugador', data.players, 'idJugador', row => `${row.nombreJugador} ${row.apellido}`.trim()),
      completed: data.records.length > 0,
    };
  }
  async function save(next, data) {
    const desired = [];
    for (const [type, names, rows, id, label] of [
      ['equipo', next.teams || [], data.teams, 'equipoId', row => row.nombreEquipo],
      ['liga', next.leagues || [], data.leagues, 'idLiga', row => row.nombreLiga],
      ['jugador', next.players || [], data.players, 'idJugador', row => `${row.nombreJugador} ${row.apellido}`.trim()],
    ]) {
      for (const name of names) {
        const row = rows.find(item => label(item) === name);
        if (!row) throw new Error('Actualiza el catálogo antes de guardar tus favoritos.');
        desired.push({ tipoFavorito: type, elementoId: row[id] });
      }
    }
    const key = record => `${record.tipoFavorito}:${record.elementoId}`;
    const current = await favorites();
    for (const record of desired) {
      if (!current.some(item => key(item) === key(record))) {
        await authorized('/favoritos/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
      }
    }
    // No sustituye los IDs del servidor ni elimina registros desconocidos.
    const supported = record => ({ equipo: data.teams.some(row => row.equipoId === record.elementoId), liga: data.leagues.some(row => row.idLiga === record.elementoId), jugador: data.players.some(row => row.idJugador === record.elementoId) })[record.tipoFavorito];
    for (const record of current) {
      if (supported(record) && !desired.some(item => key(item) === key(record))) await authorized(`/favoritos/${record.idPreferenciasUsuario}`, { method: 'DELETE' });
    }
    return { ...data, records: await favorites() };
  }
  const search = async query => {
    const value = query.trim();
    if (value.length < 3) return { ligas: [], equipos: [], jugadores: [] };
    return authorized(`/busqueda/?q=${encodeURIComponent(value)}`);
  };
  const detail = (kind, id) => {
    const path = { league: 'competiciones', team: 'equipos', player: 'jugadores' }[kind];
    if (!path || !Number.isInteger(id) || id < 1) throw new Error('Elemento inválido.');
    return authorized(`/${path}/${id}`);
  };
  return { load, preferences, save, search, detail };
}
