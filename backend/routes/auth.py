from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from core.security import createAccessToken, createRefreshToken, verifyPassword, getPasswordHash, accessTokenExpireMinutes, secretKey, algorithm
from dependencies.auth import getCurrentUser
from dependencies.roles import requirePremium, requireAdmin
from jose import JWTError, jwt

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

@router.post("/login")
def login(formData: OAuth2PasswordRequestForm = Depends()):
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

@router.get("/me")
def getMyProfile(user: dict = Depends(getCurrentUser)):
    return {
        "mensaje": "Token validado correctamente", 
        "usuario": user
        }

@router.get("/premium-only")
def premiumFeature(user: dict = Depends(requirePremium)):
    return {"mensaje": f"Bienvenido al área exclusiva, {user['correo']}"}