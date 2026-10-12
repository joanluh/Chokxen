from sqlalchemy.orm import Session
from database.models.equipo import Equipo

class EquiposRepository:
    
    @staticmethod
    def obtenerEquipos(db: Session):
        return db.query(Equipo).all()

    @staticmethod
    def obtenerEquipoPorId(db: Session, equipoId: int):
        return db.query(Equipo).filter(Equipo.equipoId == equipoId).first()