from sqlalchemy import Column, Integer, ForeignKey
from database.connection import Base

class PreferenciasUsuario(Base):
    __tablename__ = "PreferenciasUsuario"
    
    idPreferenciasUsuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clienteId = Column(Integer, ForeignKey("clientes.clienteId"), unique=True, nullable=False)
    equipoFavoritoId = Column(Integer, ForeignKey("Equipos.equipoId"), nullable=False)
    ligaFavoritaId = Column(Integer, ForeignKey("Ligas.idLiga"), nullable=False)