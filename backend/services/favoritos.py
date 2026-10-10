from sqlalchemy.orm import Session
from database.repositories.favoritos_repository import FavoritoRepository

class FavoritosService:
    
    @staticmethod
    def obtenerCatalogoOnboarding(db: Session):
        catalogo = FavoritoRepository.obtener_catalogo_equipos(db)
        return catalogo

    @staticmethod
    def guardarPreferenciasUusuario(db: Session, clienteId: int, ligaId: int, equipoId: int):
        return FavoritoRepository.guardarPreferenciasUsuario(db, clienteId, ligaId, equipoId)

    @staticmethod
    def obtenerFavoritosPorUsuario(db: Session, clienteId: int):
        return FavoritoRepository.obtenerMisFavoritos(db, clienteId)