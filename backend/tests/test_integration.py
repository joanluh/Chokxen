from datetime import timedelta
from core.security import createAccessToken

def test_login_verifies_real_password_and_nested_profile(client, account):
    headers, body = account
    profile = client.get('/api/v1/usuarios/me', headers=headers)
    assert profile.status_code == 200
    user = profile.json()['usuario']
    assert user['correo'] == 'local@example.test' and user['id'] == 1
    assert user['plan'] == 'Premium' and user['rol'] == 'Cliente'
    assert client.post('/api/v1/auth/login', data={'username':'local@example.test','password':'wrong'}).status_code == 400
    assert client.get('/api/v1/usuarios/me').status_code == 401
    assert client.post('/api/v1/auth/logout', headers=headers).status_code == 200

def test_refresh_keeps_user_id_and_allows_favorites(client, account):
    headers, body = account
    refreshed = client.post('/api/v1/auth/refresh', headers={'refreshToken':body['refreshToken']})
    assert refreshed.status_code == 200
    headers['Authorization'] = 'Bearer '+refreshed.json()['accessToken']
    assert client.get('/api/v1/usuarios/me', headers=headers).json()['usuario']['id'] == 1
    assert client.post('/api/v1/favoritos/', json={'tipoFavorito':'equipo','elementoId':1}, headers=headers).status_code == 200
    assert client.post('/api/v1/auth/refresh', headers={'refreshToken':body['access_token']}).status_code == 401
    assert client.get('/api/v1/usuarios/me', headers={'Authorization':'Bearer '+body['refreshToken']}).status_code == 401

def test_catalog_search_and_details_are_protected_and_connected(client, account):
    headers, _ = account
    for route, identifier in [('competiciones','idLiga'),('equipos','equipoId'),('jugadores','idJugador')]:
        assert client.get(f'/api/v1/{route}/').status_code == 401
        assert client.get(f'/api/v1/{route}/', headers=headers).json()[0][identifier] == 1
        assert client.get(f'/api/v1/{route}/1', headers=headers).status_code == 200
        assert client.get(f'/api/v1/{route}/999', headers=headers).status_code == 404
    assert len(client.get('/api/v1/busqueda/?q=América', headers=headers).json()['equipos']) == 1
    assert len(client.get('/api/v1/busqueda/?q=Prueba', headers=headers).json()['jugadores']) == 1
    assert client.get('/api/v1/busqueda/?q=ab', headers=headers).status_code == 422

def test_favorite_creation_duplicate_and_deletion(client, account):
    headers, _ = account
    for kind in ['equipo','liga','jugador']:
        assert client.post('/api/v1/favoritos/', json={'tipoFavorito':kind,'elementoId':1}, headers=headers).status_code == 200
    assert client.post('/api/v1/favoritos/', json={'tipoFavorito':'equipo','elementoId':1}, headers=headers).status_code == 400
    records = client.get('/api/v1/favoritos/', headers=headers).json()
    assert len(records) == 3
    assert client.delete(f"/api/v1/favoritos/{records[0]['idPreferenciasUsuario']}",headers=headers).status_code == 200
    assert len(client.get('/api/v1/favoritos/', headers=headers).json()) == 2

def test_other_account_cannot_delete_favorites(client, account):
    headers, _ = account
    item = client.post('/api/v1/favoritos/',json={'tipoFavorito':'equipo','elementoId':1},headers=headers).json()
    second = client.post('/api/v1/auth/register',json={'correo':'otro@example.test','nombreUsuario':'Otro','password':'PruebaLogin123!','rol':'Administrador'})
    assert second.status_code == 201
    token = client.post('/api/v1/auth/login',data={'username':'otro@example.test','password':'PruebaLogin123!'}).json()['access_token']
    other = {'Authorization':'Bearer '+token}
    assert client.get('/api/v1/usuarios/me', headers=other).json()['usuario']['rol'] == 'Cliente'
    assert client.delete(f"/api/v1/favoritos/{item['idPreferenciasUsuario']}",headers=other).status_code == 404
    assert client.get('/api/v1/favoritos/', headers=other).json() == []

def test_cors_allows_actual_auth_headers(client):
    response = client.options('/api/v1/auth/refresh', headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'heart,authorization,refreshtoken,chokxen-sport,content-type'})
    assert response.status_code == 200

def test_expired_access_is_rejected(client):
    token = createAccessToken({'sub':'local@example.test','id':1,'rol':'Cliente','plan':'Basico'},timedelta(seconds=-1))
    assert client.get('/api/v1/usuarios/me',headers={'Authorization':'Bearer '+token}).status_code == 401
