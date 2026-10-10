from pydantic import BaseModel

class PreferenciasUsuarioIn(BaseModel):
    clienteId: int
    ligaFavoritaId: int
    equipoFavoritoId: int

    class Config:
        from_attributes = True