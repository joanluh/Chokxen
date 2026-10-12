import os
import sys
import cmd  # Cargar la biblioteca estándar antes de añadir backend/cmd al path.
import importlib.util
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ['DATABASE_URL'] = 'sqlite://'
from database.connection import Base, get_db
from database.models import clientes, liga, equipo, jugadores, pais, favoritos
spec = importlib.util.spec_from_file_location('chokxen_test_app', Path(__file__).resolve().parents[1] / 'cmd/main.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
chokxen = module.chokxen
from core.security import limiter
from datetime import datetime

@pytest.fixture
def client():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add(pais.Pais(idPais=1, nombre='México'))
        db.add(liga.Liga(idLiga=1, paisId=1, nombreLiga='Liga MX', tipo='liga', temporadaActual='2026'))
        db.add(equipo.Equipo(equipoId=1, ligaId=1, nombreEquipo='América', fechaFundacion=datetime(1916, 10, 12)))
        db.add(jugadores.Jugador(idJugador=1, idEquipo=1, nacionalidadId=1, nombreJugador='Jugador', apellido='Prueba', posicion='Delantero', numeroDeCamiseta=9))
        db.commit()
    def database():
        with sessions() as db:
            yield db
    chokxen.dependency_overrides[get_db] = database
    limiter.reset()
    with TestClient(chokxen) as test_client:
        yield test_client
    chokxen.dependency_overrides.clear()
    engine.dispose()

@pytest.fixture
def account(client):
    register = client.post('/api/v1/auth/register', json={'correo':'local@example.test', 'password':'PruebaLogin123!', 'nombreUsuario':'Usuario Prueba', 'plan':'Premium'})
    assert register.status_code == 201
    login = client.post('/api/v1/auth/login', data={'username':'local@example.test', 'password':'PruebaLogin123!'})
    assert login.status_code == 200
    body = login.json()
    return {'Authorization':f"Bearer {body['access_token']}", 'Heart':'CHOKXEN SPORT'}, body
