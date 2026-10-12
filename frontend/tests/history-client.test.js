import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistoryClient, historyQuery } from '../src/services/history-client.js';

test('consulta guardados por liga, equipo y fechas sin enviar tokens de usuario a ESPN', async () => {
  let url, options;
  const client = createHistoryClient({ baseUrl:'/api/v1', fetcher: async (path, init) => { url=path; options=init; return { ok:true, json:async()=>({ matches:[], total:0 }) }; } });
  const result = await client.results({ league:'soccer/mex.1', team:'América & Cruz Azul', start:'2025-04-12', end:'2025-04-13', offset:0 });
  assert.equal(result.total,0); assert.match(url,/^\/api\/v1\/historico\/partidos\?/); assert.match(url,/league=soccer%2Fmex.1/); assert.match(url,/team=Am%C3%A9rica\+%26\+Cruz\+Azul/); assert.equal(options.headers.Heart,'CHOKXEN SPORT'); assert.equal(options.headers.Authorization,undefined);
  assert.equal(historyQuery({ league:'', start:null, offset:0 }),'offset=0');
});

test('importaciones y exportación utilizan la sesión autorizada del backend', async () => {
  const calls=[];
  const client=createHistoryClient({ authorized:async (...args)=>{ calls.push(args); return { id:'job' }; } });
  await client.import({ leagues:['soccer/mex.1'], start:'2025-04-12', end:'2025-04-12' });
  await client.progress('job'); await client.dataset({ offset:30,limit:30 });
  assert.equal(calls[0][0],'/historico/importaciones'); assert.equal(calls[0][1].method,'POST'); assert.deepEqual(JSON.parse(calls[0][1].body).leagues,['soccer/mex.1']);
  assert.equal(calls[1][0],'/historico/importaciones/job'); assert.match(calls[2][0],/^\/historico\/dataset\?offset=30&limit=30$/);
});

test('un servidor fallido no inventa partidos ni muestra detalles internos', async () => {
  const client=createHistoryClient({ fetcher:async()=>({ ok:false,status:500,json:async()=>({ detail:'SQL private' }) }) });
  await assert.rejects(client.results({}),error=>!error.message.includes('SQL') && error.message.includes('histórico'));
});
