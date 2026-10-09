from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import DATABASE_URL

# 1. Crear el motor de la base de datos (se conecta a la URL de tu XAMPP)
engine = create_engine(DATABASE_URL)

# 2. Crear la fábrica de sesiones (cada vez que alguien haga una petición a tu API, usará una sesión)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Crear una clase Base. Todos tus modelos (tablas) heredarán de esta clase.
Base = declarative_base()

# 4. Función de dependencia para obtener la base de datos en tus rutas
def get_db():
    db = SessionLocal() 
    try:
        yield db
    finally:
        db.close()