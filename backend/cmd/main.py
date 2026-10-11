from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded 
from routes import auth, usuarios, favoritos
from core.security import limiter
from database.connection import engine, Base
from database.models import clientes, liga, equipo, favoritos as modelo_favoritos

chokxen = FastAPI()

chokxen.state.limiter = limiter                                                       
chokxen.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)                  

#Base.metadata.create_all(bind=engine)

chokxen.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                                                                       
    allow_credentials=True,                                                                    
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],                               
    allow_headers=["Content-Type", "Chokxen-SPORT", "Authorization"],                          
)

chokxen.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
chokxen.include_router(usuarios.router, prefix="/api/v1/usuarios", tags=["Usuarios"])
chokxen.include_router(favoritos.router, prefix="/api/v1/favoritos", tags=["Favoritos"])