import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryClient } from '../src/services/library-client.js';
const catalog = { leagues: [{idLiga:7,nombreLiga:'Liga MX'}], teams: [{equipoId:40,nombreEquipo:'América'}], players: [{idJugador:90,nombreJugador:'Jugador',apellido:'Prueba'}] };
test('carga los catálogos y favoritos reales y resuelve sus IDs sin asignar por índice', async () => {
  const paths = [];
  const client = createLibraryClient(async path => { paths.push(path); return {'/competiciones/':catalog.leagues,'/equipos/':catalog.teams,'/jugadores/':catalog.players,'/favoritos/':[{tipoFavorito:'equipo',elementoId:40,idPreferenciasUsuario:100}]}[path]; });
  const data = await client.load();
  assert.equal(paths.length,4); assert.deepEqual(client.preferences(data).teams,['América']);
});
test('guardar crea por ID del catálogo, elimina por ID de preferencia y conserva registros desconocidos', async () => {
  const calls = [];
  let records = [{tipoFavorito:'equipo',elementoId:40,idPreferenciasUsuario:100},{tipoFavorito:'liga',elementoId:999,idPreferenciasUsuario:200}];
  const client = createLibraryClient(async (path, options={}) => {
    calls.push({path,options});
    if (options.method==='POST') { records.push({...JSON.parse(options.body),idPreferenciasUsuario:300}); return records.at(-1); }
    if (options.method==='DELETE') { records=records.filter(row=>row.idPreferenciasUsuario!==100); return {}; }
    return records;
  });
  await client.save({teams:[],leagues:['Liga MX'],players:[]},catalog);
  assert.deepEqual(JSON.parse(calls.find(call=>call.options.method==='POST').options.body),{tipoFavorito:'liga',elementoId:7});
  assert.equal(calls.find(call=>call.options.method==='DELETE').path,'/favoritos/100');
  assert.ok(records.some(row=>row.elementoId===999));
});
test('error de escritura se propaga antes de borrar favoritos anteriores', async () => {
  const calls=[];
  const client=createLibraryClient(async(path,options={})=>{ calls.push(options.method); if(options.method==='POST') throw new Error('Sin conexión'); return [{tipoFavorito:'equipo',elementoId:40,idPreferenciasUsuario:100}]; });
  await assert.rejects(client.save({teams:[],leagues:['Liga MX']},catalog),/Sin conexión/);
  assert.equal(calls.includes('DELETE'),false);
});
test('nombres ajenos al catálogo no generan peticiones ni favoritos con ID inventado', async () => {
  const client=createLibraryClient(()=>{throw new Error('No debe llamar');});
  await assert.rejects(client.save({teams:['otro']},catalog),/Actualiza el catálogo/);
});
test('búsqueda respeta mínimo, codifica la consulta y usa las rutas de detalle actuales', async () => {
  const paths=[]; const client=createLibraryClient(async path=>{paths.push(path);return {};});
  await client.search('ab'); assert.equal(paths.length,0);
  await client.search('América & Liga'); await client.detail('team',40); await client.detail('league',7); await client.detail('player',90);
  assert.deepEqual(paths,['/busqueda/?q=Am%C3%A9rica%20%26%20Liga','/equipos/40','/competiciones/7','/jugadores/90']);
});
