from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from database.connection import Base

class Cliente(Base):
    __tablename__ = "clientes" 
    clienteId = Column(Integer, primary_key=True, index=True)
    codigoCliente = Column(String(50), unique=True, nullable=True) 
    nombreUsuario = Column(String(50), unique=True)
    correo = Column(String(100), unique=True)
    passwordHash = Column(String(255))
    rol = Column(String(20), default="Cliente")
    plan = Column(String(20), default="Basico")
    creditosVirtuales = Column(Numeric(10, 2), default=0.00)
    fechaRegistro = Column(DateTime, default=func.now())