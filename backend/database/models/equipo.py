from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database.connection import Base

class Equipo(Base):
    __tablename__ = "Equipos"
    equipoId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ligaId = Column(Integer, ForeignKey("Ligas.idLiga"), nullable=False)
    nombreEquipo = Column(String(150), nullable=False)
    fechaFundacion = Column(DateTime, nullable=False)