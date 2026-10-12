from sqlalchemy.orm import Session
from fastapi import HTTPException
from database.repositories.favoritos_repository import FavoritosRepository
from database.models.favoritos import PreferenciasUsuario

class FavoritosService:
    
    @staticmethod
    def agregarFavorito(db: Session, clienteId: int, tipoFavorito: str, elementoId: int):
        existente = db.query(PreferenciasUsuario).filter(
            PreferenciasUsuario.clienteId == clienteId,
            PreferenciasUsuario.tipoFavorito == tipoFavorito,
            PreferenciasUsuario.elementoId == elementoId
        ).first()
        
        if existente:
            raise HTTPException(
                status_code=400, 
                detail="Este elemento ya se encuentra en tus favoritos."
            )
            
        nuevoFavorito = FavoritosRepository.crearFavorito(db, clienteId, tipoFavorito, elementoId)
        return {
            "idPreferenciasUsuario": nuevoFavorito.idPreferenciasUsuario,
            "clienteId": nuevoFavorito.clienteId,
            "tipoFavorito": nuevoFavorito.tipoFavorito,
            "elementoId": nuevoFavorito.elementoId
        }
    
    # ... (métodos de obtener y eliminar)

    @staticmethod
    def obtenerMisFavoritos(db: Session, clienteId: int):
        favoritos = FavoritosRepository.obtenerMisFavoritos(db, clienteId)
        
        listaFavoritos = []
        for fav in favoritos:
            listaFavoritos.append({
                "idPreferenciasUsuario": fav.idPreferenciasUsuario,
                "tipoFavorito": fav.tipoFavorito,
                "elementoId": fav.elementoId
            })
        return listaFavoritos

    @staticmethod
    def eliminarFavorito(db: Session, idPreferenciasUsuario: int, clienteId: int):
        return FavoritosRepository.eliminarFavorito(db, idPreferenciasUsuario, clienteId)