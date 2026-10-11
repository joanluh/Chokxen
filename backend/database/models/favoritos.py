from sqlalchemy import Column, Integer, ForeignKey
from database.connection import Base

class PreferenciasUsuario(Base):
    __tablename__ = "preferenciasusuario"
    idPreferenciasUsuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clienteId = Column(Integer, ForeignKey("clientes.clienteId"), unique=True, nullable=False)
    equipoFavoritoId = Column(Integer, ForeignKey("equipos.equipoId"), nullable=False)
    ligaFavoritaId = Column(Integer, ForeignKey("ligas.idLiga"), nullable=False)