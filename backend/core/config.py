import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env
load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:@127.0.0.1:3306/chokxen" # Valor por defecto para XAMPP
)