from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.connection import get_db
from services.favoritos import FavoritosService
from dependencies.auth import getCurrentUser

router = APIRouter()

class FavoritoCreate(BaseModel):
    tipoFavorito: str
    elementoId: int

@router.post("/")
def agregarFavorito(favoritoData: FavoritoCreate, db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    clienteActual = user.get("id")
    
    nuevo = FavoritosService.agregarFavorito(
        db=db, 
        clienteId=clienteActual, 
        tipoFavorito=favoritoData.tipoFavorito, 
        elementoId=favoritoData.elementoId
    )
    return nuevo

@router.get("/")
def listarMisFavoritos(db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    clienteActual = user.get("id")
    misFavoritos = FavoritosService.obtenerMisFavoritos(db, clienteActual)
    return misFavoritos

@router.delete("/{idPreferenciasUsuario}")
def eliminarMiFavorito(idPreferenciasUsuario: int, db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    clienteActual = user.get("id")
    fueEliminado = FavoritosService.eliminarFavorito(db, idPreferenciasUsuario, clienteActual)
    
    if not fueEliminado:
        raise HTTPException(
            status_code=404, 
            detail="El favorito no existe o no tienes permiso para eliminarlo"
        )
        
    return {"mensaje": "Favorito eliminado correctamente", "idPreferenciasUsuario": idPreferenciasUsuario}