from sqlalchemy.orm import Session
from database.repositories.competiciones_repository import CompeticionesRepository

class CompeticionesService:
    
    @staticmethod
    def obtenerCompeticiones(db: Session):
        ligas = CompeticionesRepository.obtenerCompeticiones(db)
        listaCompeticiones = []
        for liga in ligas:
            listaCompeticiones.append({
                "idLiga": liga.idLiga,
                "paisId": liga.paisId,
                "nombreLiga": liga.nombreLiga,
                "tipo": liga.tipo,
                "temporadaActual": liga.temporadaActual
            })
            
        return listaCompeticiones

    @staticmethod
    def obtenerCompeticionPorId(db: Session, idLiga: int):
        liga = CompeticionesRepository.obtenerCompeticionPorId(db, idLiga)
        
        if not liga:
            return None
            
        return {
            "idLiga": liga.idLiga,
            "paisId": liga.paisId,
            "nombreLiga": liga.nombreLiga,
            "tipo": liga.tipo,
            "temporadaActual": liga.temporadaActual
        }