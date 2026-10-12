from sqlalchemy.orm import Session
from database.repositories.jugador_repository import JugadoresRepository

class JugadoresService:
    
    @staticmethod
    def obtenerJugadores(db: Session):
        jugadores = JugadoresRepository.obtenerJugadores(db)
        
        listaJugadores = []
        for jugador in jugadores:
            listaJugadores.append({
                "idJugador": jugador.idJugador,
                "idEquipo": jugador.idEquipo,
                "nacionalidadId": jugador.nacionalidadId,
                "nombreJugador": jugador.nombreJugador,
                "apellido": jugador.apellido,
                "apodo": jugador.apodo,
                "posicion": jugador.posicion,
                "numeroDeCamiseta": jugador.numeroDeCamiseta
            })
            
        return listaJugadores

    @staticmethod
    def obtenerJugadorPorId(db: Session, idJugador: int):
        jugador = JugadoresRepository.obtenerJugadorPorId(db, idJugador)
        
        if not jugador:
            return None
            
        return {
            "idJugador": jugador.idJugador,
            "idEquipo": jugador.idEquipo,
            "nacionalidadId": jugador.nacionalidadId,
            "nombreJugador": jugador.nombreJugador,
            "apellido": jugador.apellido,
            "apodo": jugador.apodo,
            "posicion": jugador.posicion,
            "numeroDeCamiseta": jugador.numeroDeCamiseta
        }