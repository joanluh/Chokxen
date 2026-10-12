from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
import os
import secrets
from core.config import JWT_SECRET


limiter = Limiter(key_func=get_remote_address) #Para limitar la cantidad de peticiones permitidas

secretKey = JWT_SECRET or secrets.token_urlsafe(48)
algorithm = "HS256"
accessTokenExpireMinutes = 60

pwdContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verifyPassword(plainPassword: str, hashedPassword: str) -> bool:
    return pwdContext.verify(plainPassword, hashedPassword)

def getPasswordHash(password: str) -> str:
    return pwdContext.hash(password)

def createAccessToken(data: dict, expiresDelta: Optional[timedelta] = None) -> str:
    toEncode = data.copy()
    if expiresDelta:
        expire = datetime.utcnow() + expiresDelta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    toEncode.update({"exp": expire, "token_type": "access"})
    encodedJwt = jwt.encode(toEncode, secretKey, algorithm=algorithm)
    return encodedJwt

refreshTokenExpireDays = 7

def createRefreshToken(data: dict, expiresDelta: Optional[timedelta] = None) -> str:
    toEncode = data.copy()
    if expiresDelta:
        expire = datetime.utcnow() + expiresDelta
    else:
        expire = datetime.utcnow() + timedelta(days=refreshTokenExpireDays)
    toEncode.update({"exp": expire, "token_type": "refresh"})
    encodedJwt = jwt.encode(toEncode, secretKey, algorithm=algorithm)
    return encodedJwt
