from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from core.security import secretKey, algorithm

oauth2Scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def getCurrentUser(token: str = Depends(oauth2Scheme)):
    credentialsException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secretKey, algorithms=[algorithm])
        correo: str = payload.get("sub")
        rol: str = payload.get("rol")
        plan: str = payload.get("plan")
        if correo is None:
            raise credentialsException
        tokenData = {"correo": correo, "rol": rol, "plan": plan}
        return tokenData
    except JWTError:
        raise credentialsException