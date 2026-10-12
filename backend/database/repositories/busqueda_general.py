from sqlalchemy.orm import Session
from sqlalchemy import or_
from database.models.liga import Liga
from database.models.equipo import Equipo
from database.models.jugadores import Jugador
from database.models.pais import Pais

class BusquedaRepository:
    
    @staticmethod
    def buscarGeneral(db: Session, terminoBusqueda: str):
        termino = f"%{terminoBusqueda}%"
        
        # 1. Búsqueda en Ligas
        ligasEncontradas = db.query(Liga).filter(
            Liga.nombreLiga.ilike(termino)
        ).all()
        
        equiposEncontrados = db.query(Equipo).filter(
            Equipo.nombreEquipo.ilike(termino)
        ).all()

        resultadosJugadores = (
            db.query(Jugador, Equipo, Liga, Pais)
            .join(Equipo, Jugador.idEquipo == Equipo.equipoId)
            .join(Liga, Equipo.ligaId == Liga.idLiga)
            .join(Pais, Jugador.nacionalidadId == Pais.idPais)
            .filter(
                or_(
                    Jugador.nombreJugador.ilike(termino),
                    Jugador.apellido.ilike(termino),
                    Jugador.apodo.ilike(termino)
                )
            )
            .all()
        )
        
        listaJugadoresFormateada = []
        for jugador, equipo, liga, pais in resultadosJugadores:
            listaJugadoresFormateada.append({
                "idJugador": jugador.idJugador,
                "nombreJugador": jugador.nombreJugador,
                "apellido": jugador.apellido,
                "apodo": jugador.apodo,
                "posicion": jugador.posicion,
                "numeroDeCamiseta": jugador.numeroDeCamiseta,
                "nombreEquipo": equipo.nombreEquipo,
                "nombreLiga": liga.nombreLiga,
                "nacionalidad": pais.nombre
            })
            
        return {
            "ligas": ligasEncontradas,
            "equipos": equiposEncontrados,
            "jugadores": listaJugadoresFormateada
        }