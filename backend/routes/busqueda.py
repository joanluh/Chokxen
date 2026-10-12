from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from services.busqueda import BusquedaService
from dependencies.auth import getCurrentUser

router = APIRouter()

@router.get("/")
def realizarBusquedaGeneral(q: str = Query(..., min_length=3, description="Término a buscar"), db: Session = Depends(get_db), user: dict = Depends(getCurrentUser)):
    resultadosBusqueda = BusquedaService.buscarGeneral(db, q)
    return resultadosBusqueda