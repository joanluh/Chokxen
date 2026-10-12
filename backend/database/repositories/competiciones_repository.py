from sqlalchemy.orm import Session
from database.models.liga import Liga

class CompeticionesRepository:
    
    @staticmethod
    def obtenerCompeticiones(db: Session):
        return db.query(Liga).all()

    @staticmethod
    def obtenerCompeticionPorId(db: Session, idLiga: int):
        return db.query(Liga).filter(Liga.idLiga == idLiga).first()