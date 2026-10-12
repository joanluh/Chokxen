from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded 
from routes import auth, usuario, favorito, busqueda, competicion, equipo, jugador, historico
from contextlib import asynccontextmanager
from services.history_store import create_tables, recover_interrupted
from database.connection import SessionLocal
from core.security import limiter
import os


@asynccontextmanager
async def lifespan(app):
    create_tables()
    with SessionLocal() as db:
        recover_interrupted(db)
    yield

chokxen = FastAPI(lifespan=lifespan)

chokxen.state.limiter = limiter                                                       
chokxen.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)                  

#Base.metadata.create_all(bind=engine)

chokxen.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()],
    allow_credentials=True,                                                                    
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],                               
    allow_headers=["Content-Type", "Chokxen-SPORT", "Heart", "Authorization", "refreshToken"],
)

chokxen.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
chokxen.include_router(usuario.router, prefix="/api/v1/usuarios", tags=["Usuarios"])
chokxen.include_router(favorito.router, prefix="/api/v1/favoritos", tags=["Favoritos"])
chokxen.include_router(busqueda.router, prefix="/api/v1/busqueda", tags=["Busqueda"])
chokxen.include_router(competicion.router, prefix="/api/v1/competiciones", tags=["Competiciones"])
chokxen.include_router(equipo.router, prefix="/api/v1/equipos", tags=["Equipos"])
chokxen.include_router(jugador.router, prefix="/api/v1/jugadores", tags=["Jugadores"])
chokxen.include_router(historico.router, prefix="/api/v1/historico", tags=["Histórico ESPN"])

@chokxen.get('/health', include_in_schema=False)
def health():
    return {'status': 'ok'}
