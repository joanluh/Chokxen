from sqlalchemy.orm import Session
from database.models.favoritos import PreferenciasUsuario

class FavoritosRepository:
    
    @staticmethod
    def crearFavorito(db: Session, clienteId: int, tipoFavorito: str, elementoId: int):
        nuevoFavorito = PreferenciasUsuario(
            clienteId=clienteId,
            tipoFavorito=tipoFavorito,
            elementoId=elementoId
        )
        db.add(nuevoFavorito)
        db.commit()
        db.refresh(nuevoFavorito)
        return nuevoFavorito

    @staticmethod
    def obtenerMisFavoritos(db: Session, clienteId: int):
        return db.query(PreferenciasUsuario).filter(PreferenciasUsuario.clienteId == clienteId).all()

    @staticmethod
    def eliminarFavorito(db: Session, idPreferenciasUsuario: int, clienteId: int):
        favorito = db.query(PreferenciasUsuario).filter(
            PreferenciasUsuario.idPreferenciasUsuario == idPreferenciasUsuario,
            PreferenciasUsuario.clienteId == clienteId
        ).first()
        
        if favorito:
            db.delete(favorito)
            db.commit()
            return True
        return False