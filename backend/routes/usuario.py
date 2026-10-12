from fastapi import APIRouter, Depends, HTTPException, status
from dependencies.auth import getCurrentUser
from dependencies.roles import requirePremium, requireAdmin

# Instanciamos el router
router = APIRouter()

@router.get("/me")
def getMyProfile(user: dict = Depends(getCurrentUser)):
    return {
        "mensaje": "Perfil del usuario",
        "usuario": user
        }

""" """ 
@router.get("/premium-only")
def premiumFeature(user: dict = Depends(requirePremium)):
    return {
        "mensaje": f"Bienvenido al área exclusiva, {user['correo']}"
        }
""" """ 