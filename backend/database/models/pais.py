from sqlalchemy import Column, Integer, String, ForeignKey
from database.connection import Base

class Pais(Base):
    __tablename__ = "paises"
    idPais = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre= Column(String(100), nullable=False)