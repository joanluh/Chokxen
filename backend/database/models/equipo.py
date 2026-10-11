from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database.connection import Base

class Equipo(Base):
    __tablename__ = "equipos"
    equipoId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ligaId = Column(Integer, ForeignKey("ligas.idLiga"), nullable=False)
    nombreEquipo = Column(String(150), nullable=False)
    fechaFundacion = Column(DateTime, nullable=False)