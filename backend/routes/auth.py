from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from core.security import createAccessToken, verifyPassword, getPasswordHash, accessTokenExpireMinutes
from dependencies.auth import getCurrentUser
from dependencies.roles import requirePremium, requireAdmin

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
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def getMyProfile(user: dict = Depends(getCurrentUser)):
    return {"mensaje": "Token validado correctamente", "usuario": user}

@router.get("/premium-only")
def premiumFeature(user: dict = Depends(requirePremium)):
    return {"mensaje": f"Bienvenido al área exclusiva, {user['correo']}"}