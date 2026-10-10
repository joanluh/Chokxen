from sqlalchemy import Column, Integer, String
from database.connection import Base

class Liga(Base):
    __tablename__ = "Ligas"

    idLiga = Column(Integer, primary_key=True, index=True, autoincrement=True)
    paisId = Column(Integer, nullable=False) 
    nombreLiga = Column(String(150), nullable=False)
    tipo = Column(String(50), nullable=False) # Usamos String en lugar de Enum como en tu modelo Cliente
    temporadaActual = Column(String(50), nullable=False)