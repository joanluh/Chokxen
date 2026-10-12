import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")


DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://chokxen_user:chokxen_password@db:3306/chokxen"

)
