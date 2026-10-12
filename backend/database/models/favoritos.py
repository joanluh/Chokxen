from sqlalchemy import Column, Integer, ForeignKey, Enum
from database.connection import Base

class PreferenciasUsuario(Base):
    __tablename__ = "preferenciasusuario"
    idPreferenciasUsuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clienteId = Column(Integer, ForeignKey("clientes.clienteId", ondelete="CASCADE"), nullable=False)
    tipoFavorito = Column(Enum('equipo', 'liga', 'jugador'), nullable=False)
    elementoId = Column(Integer, nullable=False)