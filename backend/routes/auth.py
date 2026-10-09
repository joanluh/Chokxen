from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from core.security import createAccessToken, createRefreshToken, verifyPassword, getPasswordHash, accessTokenExpireMinutes, secretKey, algorithm, limiter
from dependencies.auth import getCurrentUser
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db
from database.repositories.usuarios_repository import obtenerUsuarioPorCorreo, guardarNuevoUsuario

class RegistroUsuario(BaseModel):
    correo: str
    password: str
    nombreUsuario: str = "Usuario Nuevo"
    rol: str = "Cliente"
    plan: str = "Basico"

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("2/minute")
def register(request: Request, nuevoUsuario: RegistroUsuario, db: Session = Depends(get_db)): 
    usuarioExistente = obtenerUsuarioPorCorreo(nuevoUsuario.correo, db)
    if usuarioExistente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado"
        )
    
    nuevoPasswordHash = getPasswordHash(nuevoUsuario.password)
    
    # Guardamos usando la capa de repositorio
    guardarNuevoUsuario(
        correo=nuevoUsuario.correo,
        passwordHash=nuevoPasswordHash,
        rol=nuevoUsuario.rol,
        plan=nuevoUsuario.plan,
        nombreUsuario=nuevoUsuario.nombreUsuario,
        db=db
    )
    
    return {
        "mensaje": "Usuario registrado exitosamente en MySQL",
        "correo": nuevoUsuario.correo,
        "plan": nuevoUsuario.plan
    }

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, formData: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Buscamos usando el repositorio
    user = obtenerUsuarioPorCorreo(formData.username, db)
    
    if not user or not verifyPassword(formData.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo o contraseña incorrectos"
        )
    
    expires = timedelta(minutes=accessTokenExpireMinutes)
    token = createAccessToken(
        data={"sub": user.correo, "rol": user.rol, "plan": user.plan},
        expiresDelta=expires
    )
    refreshToken = createRefreshToken(
        data={"sub": user.correo}
    )

    return {
        "access_token": token,
        "refreshToken": refreshToken,
        "token_type": "bearer"
    }

@router.post("/refresh")
def refresh(refreshToken: str = Header(...), db: Session = Depends(get_db)):
    credentialsException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de refresco invalido",
        headers={"www-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refreshToken, secretKey, algorithms=[algorithm])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentialsException
        
        user = obtenerUsuarioPorCorreo(correo, db)
        if not user:
            raise credentialsException
        
        accessExpires = timedelta(minutes=accessTokenExpireMinutes)
        newAccessToken = createAccessToken(
            data={"sub": user.correo, "rol": user.rol, "plan": user.plan},
            expiresDelta=accessExpires
        )
        return {
            "accessToken": newAccessToken, 
            "tokenType": "bearer"
        }
    except JWTError:
        raise credentialsException

@router.post("/logout")
def logout(currentUser: dict = Depends(getCurrentUser)):
    return {
        "mensaje": "Sesión cerrada exitosamente"
    }