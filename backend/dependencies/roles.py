from fastapi import Depends, HTTPException, status
from dependencies.auth import getCurrentUser

def requireAdmin(currentUser: dict = Depends(getCurrentUser)):
    if currentUser.get("rol") != "Administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permisos insuficientes")
    return currentUser

def requirePremium(currentUser: dict = Depends(getCurrentUser)):
    if currentUser.get("plan") != "Premium" and currentUser.get("rol") != "Administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Esta función requiere plan Premium")
    return currentUser