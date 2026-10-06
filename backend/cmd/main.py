from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded 
from routes import auth

chokxen = FastAPI()

limiter = Limiter(key_func=get_remote_address)                                              #Definimos el limitardor en base a las IPs de los clientes
chokxen.state.limiter = limiter                                                                 #Le decimos a la app que use el limitador
chokxen.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)                  #Agregamos el manejador de excepciones para el límite de tasa

#Usamos la funcionalidad de middleware para limitir el tipo de solicitudes que se pueden realizar a nuestra API
chokxen.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],                                                                    #permite solicitudes desde cualquier origen
    ##allow_credentials=True,                                                                 #permite el uso de cookies y credenciales en las solicitudes
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],                                                                    #Limita los metodos aceptados a OPTIONS Y POST
    allow_headers=["Content-Type", "Chokxen-SPORT", "Authorization"],                                        #Definimos el encabezado de seguridad
)

chokxen.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])

if __name__=="__main__":
    uvicorn.run(chokxen,host="0.0.0.0",port=8080)