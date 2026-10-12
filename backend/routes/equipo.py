from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.equipos import EquiposService
from dependencies.auth import getCurrentUser
from database.connection import get_db

router = APIRouter()

@router.get("/")
def listarEquipos(db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    equipos = EquiposService.obtenerEquipos(db)
    return equipos

@router.get("/{equipoId}")
def detalleEquipo(equipoId: int, db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    equipo = EquiposService.obtenerEquipoPorId(db, equipoId)
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")    
    return equipo