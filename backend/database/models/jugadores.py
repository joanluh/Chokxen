from sqlalchemy import Column, Integer, String, ForeignKey
from database.connection import Base

class Jugador(Base):
    __tablename__ = "jugadores"
    idJugador = Column(Integer, primary_key=True, index=True, autoincrement=True)
    idEquipo = Column(Integer, ForeignKey("equipos.equipoId"), nullable=False)
    nacionalidadId = Column(Integer, ForeignKey("paises.idPais"), nullable=False)
    nombreJugador = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    apodo = Column(String(100), nullable=True) 
    posicion = Column(String(50), nullable=False)
    numeroDeCamiseta = Column(Integer, nullable=False)