from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from database.connection import get_db
from services.favoritos import FavoritosService
from schemas.favoritos import PreferenciasUsuarioIn
from dependencies.auth import getCurrentUser
from dependencies.roles import requirePremium, requireAdmin

router = APIRouter()

@router.get("/catalogo-equipos",)
def obtenerEquiposPorLiga(db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    catalogo = FavoritosService.obtenerCatalogoOnboarding(db)
    return {
        "mensaje": "Catálogo obtenido exitosamente",
        "data": catalogo
    }

@router.post("/guardarFavorito")
def guardarPreferencias(preferencia: PreferenciasUsuarioIn, db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
   
    try:
        nuevaPreferencia = FavoritosService.guardarPreferenciasUusuario(
            db=db,
            clienteId=preferencia.clienteId,
            ligaId=preferencia.ligaFavoritaId,
            equipoId=preferencia.equipoFavoritoId
        )
        
        return {
            "mensaje": "Preferencias guardadas exitosamente",
            "data": {
                "idPreferenciasUsuario": nuevaPreferencia.idPreferenciasUsuario,
                "clienteId": nuevaPreferencia.clienteId,
                "ligaFavoritaId": nuevaPreferencia.ligaFavoritaId,
                "equipoFavoritoId": nuevaPreferencia.equipoFavoritoId
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al guardar las preferencias: {str(e)}")

@router.get("/consultarFavoritos")
def consultarFavoritos(db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    try:
        clienteId = user.get("id")
        if not clienteId:
            raise HTTPException(status_code=401, detail="Usuario no válido")
        mis_favoritos = FavoritosService.obtenerFavoritosPorUsuario(db=db, clienteId=clienteId)

        return {
            "mensaje": "Favoritos recuperados exitosamente",
            "data": mis_favoritos
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al consultar los favoritos: {str(e)}")