from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.jugadores import JugadoresService
from dependencies.auth import getCurrentUser
from database.connection import get_db

router = APIRouter()

@router.get("/")
def listarJugadores(db: Session = Depends(get_db), user: dict=Depends(getCurrentUser)):
    jugadores = JugadoresService.obtenerJugadores(db)
    return jugadores

@router.get("/{idJugador}")
def detalleJugador(idJugador: int, db: Session = Depends(get_db), user: dict=Depends(getCurrentUser)):
    jugador = JugadoresService.obtenerJugadorPorId(db, idJugador)
    if not jugador:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
        
    return jugador