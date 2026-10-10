from sqlalchemy.orm import Session
from database.models.liga import Liga 
from database.models.equipo import Equipo
from database.models.favoritos import PreferenciasUsuario

class FavoritoRepository:
    
    @staticmethod
    def obtener_catalogo_equipos(db: Session):
        resultados = db.query(Liga, Equipo).join(Equipo, Liga.idLiga == Equipo.ligaId).all()
    
        catalogo_dict = {}
        for liga, equipo in resultados:
            if liga.idLiga not in catalogo_dict:
                catalogo_dict[liga.idLiga] = {
                    "idLiga": liga.idLiga,
                    "nombreLiga": liga.nombreLiga,
                    "equipos": []
                }
            
            catalogo_dict[liga.idLiga]["equipos"].append({
                "equipoId": equipo.equipoId,
                "nombreEquipo": equipo.nombreEquipo
            })
            
        return list(catalogo_dict.values())



    @staticmethod
    def guardarPreferenciasUsuario(db: Session, clienteId: int, ligaId: int, equipoId: int):
        preferenciaExistente = db.query(PreferenciasUsuario).filter(PreferenciasUsuario.clienteId == clienteId).first()
        
        if preferenciaExistente:
            preferenciaExistente.ligaFavoritaId = ligaId
            preferenciaExistente.equipoFavoritoId = equipoId
            
            db.commit()
            db.refresh(preferenciaExistente)
            return preferenciaExistente
        else:
            # Si no existe, creamos el registro nuevo
            nuevaPreferencia = PreferenciasUsuario(
                clienteId=clienteId,
                ligaFavoritaId=ligaId,
                equipoFavoritoId=equipoId
            )
            
            db.add(nuevaPreferencia)
            db.commit()
            db.refresh(nuevaPreferencia) 
            
            return nuevaPreferencia

    @staticmethod
    def obtenerMisFavoritos(db: Session, clienteId: int):
        resultados = (
            db.query(
                PreferenciasUsuario.idPreferenciasUsuario,
                PreferenciasUsuario.clienteId,
                Liga.nombreLiga,
                Equipo.nombreEquipo
            )
            .join(Liga, PreferenciasUsuario.ligaFavoritaId == Liga.idLiga)
            .join(Equipo, PreferenciasUsuario.equipoFavoritoId == Equipo.equipoId)
            .filter(PreferenciasUsuario.clienteId == clienteId)
            .all()
        )
        
        misFavoritos = []
        for idPreferencia, idCliente, nombreLiga, nombreEquipo in resultados:
            misFavoritos.append({
                "idPreferenciasUsuario": idPreferencia, 
                "clienteId": idCliente,
                "nombreLiga": nombreLiga,
                "nombreEquipo": nombreEquipo
            })
            
        return misFavoritos