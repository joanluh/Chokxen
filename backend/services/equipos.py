from sqlalchemy.orm import Session
from database.repositories.equipos_repository import EquiposRepository

class EquiposService:
    
    @staticmethod
    def obtenerEquipos(db: Session):
        equipos = EquiposRepository.obtenerEquipos(db)
        
        listaEquipos = []
        for equipo in equipos:
            listaEquipos.append({
                "equipoId": equipo.equipoId,
                "ligaId": equipo.ligaId,
                "fechaFundacion": equipo.fechaFundacion.strftime("%Y-%m-%d %H:%M:%S") if equipo.fechaFundacion else None,
                "nombreEquipo": equipo.nombreEquipo
            })
            
        return listaEquipos

    @staticmethod
    def obtenerEquipoPorId(db: Session, equipoId: int):
        equipo = EquiposRepository.obtenerEquipoPorId(db, equipoId)
        
        if not equipo:
            return None
            
        return {
            "equipoId": equipo.equipoId,
            "ligaId": equipo.ligaId,
            "fechaFundacion": equipo.fechaFundacion.strftime("%Y-%m-%d %H:%M:%S") if equipo.fechaFundacion else None,
            "nombreEquipo": equipo.nombreEquipo
        }