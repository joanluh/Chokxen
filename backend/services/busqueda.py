from sqlalchemy.orm import Session
from database.repositories.busqueda_general import BusquedaRepository

class BusquedaService:
    
    @staticmethod
    def buscarGeneral(db: Session, terminoBusqueda: str):
        if not terminoBusqueda or len(terminoBusqueda.strip()) < 3:
            return {
                "ligas": [],
                "equipos": [],
                "jugadores": []
            }
        resultados = BusquedaRepository.buscarGeneral(db, terminoBusqueda)
        return resultados