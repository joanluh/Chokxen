from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from core.security import createAccessToken, createRefreshToken, verifyPassword, getPasswordHash, accessTokenExpireMinutes, secretKey, algorithm, limiter
from dependencies.auth import getCurrentUser
from dependencies.roles import requirePremium, requireAdmin
from jose import JWTError, jwt
from pydantic import BaseModel

class RegistroUsuario(BaseModel):
    correo: str
    password: str
    nombreUsuario: str = "Usuario Nuevo"
    rol: str = "Cliente"
    plan: str = "Basico"

router = APIRouter()

# Simulación temporal, necesitamos conectar la BD
testPasswordHash = getPasswordHash("secreto123")

fakeDb = {
    "usuario@chokxen.com": {
        "correo": "usuario@chokxen.com",
        "passwordHash": testPasswordHash,
        "rol": "Cliente",
        "plan": "Premium"
    }
}

def obtenerUsuarioPorCorreo(correo: str):
    # Futuro: SELECT * FROM Clientes WHERE correo = correo
    return fakeDb.get(correo)

def guardarNuevoUsuario(correo: str, passwordHash: str, rol: str, plan: str):
    fakeDb[correo] = {
        "correo": correo,
        "passwordHash": passwordHash,
        "rol": rol,
        "plan": plan
    }
    return fakeDb[correo]

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("2/minute")
def register(request: Request, nuevoUsuario: RegistroUsuario): # <-- ¡Aquí faltaba el request!
    # Paso A: Consultar usando la función abstracta
    usuarioExistente = obtenerUsuarioPorCorreo(nuevoUsuario.correo)
    
    if usuarioExistente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado"
        )
    
    # Paso B: Cifrar la contraseña
    nuevoPasswordHash = getPasswordHash(nuevoUsuario.password)
    
    # Paso C: Guardar usando la función abstracta
    guardarNuevoUsuario(
        correo=nuevoUsuario.correo,
        passwordHash=nuevoPasswordHash,
        rol=nuevoUsuario.rol,
        plan=nuevoUsuario.plan
    )
    
    return {
        "mensaje": "Usuario registrado exitosamente",
        "correo": nuevoUsuario.correo,
        "plan": nuevoUsuario.plan
    }

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, formData: OAuth2PasswordRequestForm = Depends()):
    user = fakeDb.get(formData.username)
    if not user or not verifyPassword(formData.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo o contraseña incorrectos"
        )
    
    expires = timedelta(minutes=accessTokenExpireMinutes)
    token = createAccessToken(
        data={"sub": user["correo"], "rol": user["rol"], "plan": user["plan"]},
        expiresDelta=expires
    )
    refreshToken = createRefreshToken(
        data={"sub": user["correo"]}
    )

    return {
        "access_token": token,
        "refreshToken": refreshToken,
        "token_type": "bearer"
        }


@router.post("/refresh")
def refresh(refreshToken: str = Header(...)):
    credentialsException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de refreco invalido",
        headers={"www-Authenticate": "Bearer"},
    )
    try:
        payload=jwt.decode(refreshToken,secretKey,algorithms=[algorithm])
        correo: str=payload.get("sub")
        if correo is None:
            raise credentialsException
        user=fakeDb.get(correo)
        if not user:
            raise credentialsException
        accessExpires = timedelta(minutes=accessTokenExpireMinutes)
        newAccessToken = createAccessToken(
            data={"sub": user["correo"], "rol": user["rol"], "plan": user["plan"]},
            expiresDelta=accessExpires
        )
        return {
            "accessToken": newAccessToken, 
            "tokenType": "bearer"
            }
    except  JWTError:
        raise credentialsException

@router.post("/logout")
def logout(currentUser: dict=Depends(getCurrentUser)):
    return {
        "mensaje:": "Sesión cerreda exittosamente"
    }

