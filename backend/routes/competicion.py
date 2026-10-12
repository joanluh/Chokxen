from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.competiciones import CompeticionesService
from dependencies.auth import getCurrentUser
from database.connection import get_db

router = APIRouter()

@router.get("/")
def listarCompeticiones(db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    competiciones = CompeticionesService.obtenerCompeticiones(db)
    return competiciones

@router.get("/{id}")
def detalleCompeticion(id: int, db: Session = Depends(get_db),  user: dict = Depends(getCurrentUser)):
    competicion = CompeticionesService.obtenerCompeticionPorId(db, id)
    if not competicion:
        raise HTTPException(status_code=404, detail="Competición no encontrada")
        
    return competicion