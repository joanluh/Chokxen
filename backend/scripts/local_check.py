"""Backend real con una base SQLite aislada y datos exclusivamente de prueba.
Ejecutar: python scripts/local_check.py. Solo escucha en 127.0.0.1:8080.
No conecta a MySQL ni importa cuentas del volcado SQL.
"""
import os
import sys
from pathlib import Path
from datetime import datetime
root = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root))
local_dir = root / '.local-check'
local_dir.mkdir(exist_ok=True)
os.environ['DATABASE_URL'] = f"sqlite:///{(local_dir/'chokxen.sqlite').as_posix()}"
from database.connection import Base, engine, SessionLocal
from database.models import clientes, liga, equipo, jugadores, pais, favoritos
from core.security import getPasswordHash
from cmd.main import chokxen
import uvicorn

@chokxen.get('/__local_check__', include_in_schema=False)
def local_mode():
    return {'mode': 'local-check', 'database': 'isolated-sqlite'}

Base.metadata.create_all(engine)
with SessionLocal() as db:
    if not db.query(pais.Pais).first():
        db.add(pais.Pais(idPais=1,nombre='México'))
        db.add(liga.Liga(idLiga=1,paisId=1,nombreLiga='Liga MX',tipo='liga',temporadaActual='2026'))
        for index, name in enumerate(['América','Guadalajara (Chivas)','Monterrey','Pumas UNAM'],1):
            db.add(equipo.Equipo(equipoId=index,ligaId=1,nombreEquipo=name,fechaFundacion=datetime(1950,1,1)))
        db.add(jugadores.Jugador(idJugador=1,idEquipo=1,nacionalidadId=1,nombreJugador='Jugador',apellido='Prueba',posicion='Delantero',numeroDeCamiseta=9))
    if not db.query(clientes.Cliente).filter_by(correo='local@example.test').first():
        db.add(clientes.Cliente(correo='local@example.test',nombreUsuario='Usuario Local',passwordHash=getPasswordHash('PruebaLogin123!'),rol='Cliente',plan='Premium'))
    if not db.query(clientes.Cliente).filter_by(correo='admin@example.test').first():
        db.add(clientes.Cliente(correo='admin@example.test',nombreUsuario='Administrador Local',passwordHash=getPasswordHash('PruebaLogin123!'),rol='Administrador',plan='Premium'))
    db.commit()
print('Backend de comprobación local: SQLite aislado, sin servidor VPN ni MySQL.',flush=True)
print('Cuenta ficticia: local@example.test / PruebaLogin123!',flush=True)
if __name__ == '__main__':
    uvicorn.run(chokxen,host='127.0.0.1',port=8080)
