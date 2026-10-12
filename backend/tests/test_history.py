import copy
import json
from datetime import date, datetime
from pathlib import Path
import pytest
from sqlalchemy.orm import sessionmaker
from services import espn_history as espn
from services.history_store import enqueue, run_import, recover_interrupted
from database.models.historico import ResultadoHistorico, ImportacionHistorica
from database.connection import get_db
from core.security import createAccessToken
from routes import historico

@pytest.fixture
def historical(client, monkeypatch):
    provider = client.app.dependency_overrides[get_db]()
    db = next(provider)
    sessions = sessionmaker(bind=db.get_bind())
    summary = json.loads((Path(__file__).resolve().parents[2]/'frontend/tests/fixtures/espn-pumas-cruz-azul.json').read_text(encoding='utf-8'))
    event = {'id': summary['header']['id'], 'date': '2025-04-13T01:15:00Z',
             'competitions': summary['header']['competitions']}
    def request(endpoint, params):
        if endpoint.endswith('/summary'):
            return copy.deepcopy(summary)
        return {'events': [copy.deepcopy(event)]}
    monkeypatch.setattr(espn, 'request', request)
    monkeypatch.setattr(historico, 'run_import', lambda job_id: run_import(job_id, sessions))
    yield sessions, event, summary
    provider.close()

def admin_headers():
    return {'Authorization': 'Bearer '+createAccessToken({'sub':'admin@example.test','id':1,'rol':'Administrador','plan':'Premium'})}

def import_body():
    return {'leagues':['soccer/mex.1'], 'start':'2025-04-12', 'end':'2025-04-12'}

def test_historical_import_is_idempotent_and_uses_mexico_date(client, historical):
    headers = admin_headers()
    first = client.post('/api/v1/historico/importaciones', json=import_body(), headers=headers)
    assert first.status_code == 202
    state = client.get('/api/v1/historico/importaciones/'+first.json()['id'], headers=headers).json()
    assert state['status'] == 'completed' and state['imported'] == 1
    assert state['days_done'] == 2
    second = client.post('/api/v1/historico/importaciones',json=import_body(),headers=headers)
    state = client.get('/api/v1/historico/importaciones/'+second.json()['id'],headers=headers).json()
    assert state['imported'] == 0 and state['updated'] == 1
    results = client.get('/api/v1/historico/partidos?start=2025-04-12&end=2025-04-12').json()
    assert results['total'] == 1
    row = results['matches'][0]
    assert row['day'] == '2025-04-12' and row['goals'] == [3,3] and row['storage'] == 'BD'
    detail = client.get(f"/api/v1/historico/partidos/{row['eventId']}?league=soccer/mex.1").json()
    assert detail['statisticsState'] == 'available' and len(detail['storedSummary']['keyEvents']) == 6
    assert not {'news','videos','commentary','odds'} & detail['storedSummary'].keys()
    assert client.get('/api/v1/historico/partidos?start=2025-04-13&end=2025-04-13').json()['total'] == 0

def test_partial_summary_keeps_result_and_reimport_keeps_existing_statistics(client, historical, monkeypatch):
    sessions, event, summary = historical
    real = espn.request
    def unavailable(endpoint, params):
        if endpoint.endswith('/summary'):
            raise espn.ProviderError('Resumen no disponible')
        return real(endpoint, params)
    monkeypatch.setattr(espn, 'request', unavailable)
    result = client.post('/api/v1/historico/importaciones',json=import_body(),headers=admin_headers()).json()
    assert client.get('/api/v1/historico/importaciones/'+result['id'],headers=admin_headers()).json()['status'] == 'partial'
    with sessions() as db:
        row = db.query(ResultadoHistorico).one()
        assert row.home_score == 3 and row.summary is None and row.statistics_state == 'pending'
    monkeypatch.setattr(espn, 'request', real)
    client.post('/api/v1/historico/importaciones',json=import_body(),headers=admin_headers())
    monkeypatch.setattr(espn, 'request', unavailable)
    client.post('/api/v1/historico/importaciones',json=import_body(),headers=admin_headers())
    with sessions() as db:
        row = db.query(ResultadoHistorico).one()
        assert row.summary is not None and row.statistics_state == 'available'

def test_nonfinal_cancelled_and_missing_scores_do_not_enter_training_history(historical):
    _, event, _ = historical
    assert espn.event_record(event, 'soccer/mex.1') is not None
    game = event['competitions'][0]
    game['status']['type']['completed'] = False
    assert espn.event_record(event, 'soccer/mex.1') is None
    game['status']['type'].update(completed=True,name='STATUS_CANCELED')
    assert espn.event_record(event, 'soccer/mex.1') is None
    game['status']['type']['name'] = 'STATUS_FINAL'
    game['competitors'][0]['score'] = ''
    assert espn.event_record(event, 'soccer/mex.1') is None

def test_historical_import_permissions_and_range_validation(client, account, historical):
    assert len(client.get('/api/v1/historico/ligas').json()) == 20
    assert client.post('/api/v1/historico/importaciones',json=import_body()).status_code == 401
    assert client.post('/api/v1/historico/importaciones',json=import_body(),headers=account[0]).status_code == 403
    for changes in [{'leagues':['soccer/inventada']},{'start':'2025-05-01'}, {'end':'2099-01-01'}, {'start':'2025-01-01'}]:
        assert client.post('/api/v1/historico/importaciones',json={**import_body(),**changes},headers=admin_headers()).status_code == 422
    assert client.get('/api/v1/historico/dataset').status_code == 401
    assert client.get('/api/v1/historico/partidos?limit=101').status_code == 422

def test_dataset_and_antecedents_exclude_self_and_future(client, account, historical):
    client.post('/api/v1/historico/importaciones',json=import_body(),headers=admin_headers())
    row = client.get('/api/v1/historico/partidos').json()['matches'][0]
    export = client.get('/api/v1/historico/dataset?league=soccer/mex.1',headers=account[0]).json()
    assert export['rows'][0]['label'] == 'draw' and export['rows'][0]['postMatchStatistics']
    assert export['schemaVersion'] == 1 and export['total'] == 1
    assert client.get('/api/v1/historico/dataset?team=inexistente',headers=account[0]).json()['total'] == 0
    url = '/api/v1/historico/antecedentes'
    query = {'league':'soccer/mex.1','team_id':row['teamIds'][0],'before':row['kickoff']}
    assert client.get(url,params=query,headers=account[0]).json()['count'] == 0
    query['before'] = '2025-04-14T00:00:00Z'
    assert client.get(url,params=query,headers=account[0]).json()['count'] == 1
    query['before'] = '2025-04-14T00:00:00'
    assert client.get(url,params=query,headers=account[0]).status_code == 422
    assert client.get('/api/v1/historico/partidos?team=%25').json()['total'] == 0

def test_import_lock_and_recovery_are_persisted(historical):
    sessions, _, _ = historical
    with sessions() as db:
        first = enqueue(db,['soccer/mex.1'],date(2025,4,12),date(2025,4,12))
        with pytest.raises(ValueError):
            enqueue(db,['soccer/eng.1'],date(2025,4,12),date(2025,4,12))
        recover_interrupted(db)
        db.refresh(first)
        assert first.status == 'interrupted' and first.active_slot is None
        assert enqueue(db,['soccer/eng.1'],date(2025,4,12),date(2025,4,12)).id != first.id

def test_mismatched_summary_is_not_saved(client, historical, monkeypatch):
    real = espn.request
    def wrong(endpoint, params):
        body = real(endpoint,params)
        if endpoint.endswith('/summary'):
            body['header']['id'] = '999'
        return body
    monkeypatch.setattr(espn,'request',wrong)
    client.post('/api/v1/historico/importaciones',json=import_body(),headers=admin_headers())
    with historical[0]() as db:
        assert db.query(ResultadoHistorico).one().summary is None
