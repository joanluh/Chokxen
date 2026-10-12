from sqlalchemy.orm import Session
from database.models.jugadores import Jugador

class JugadoresRepository:
    
    @staticmethod
    def obtenerJugadores(db: Session):
        return db.query(Jugador).all()

    @staticmethod
    def obtenerJugadorPorId(db: Session, idJugador: int):
        return db.query(Jugador).filter(Jugador.idJugador == idJugador).first()