from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from database.models.clientes import Cliente

def obtenerUsuarioPorCorreo(correo: str, db: Session):
    return db.query(Cliente).filter(Cliente.correo == correo).first()

def obtenerUsuarioPorNombre(nombreUsuario: str, db: Session):
    return db.query(Cliente).filter(Cliente.nombreUsuario == nombreUsuario).first()

def guardarNuevoUsuario(correo: str, passwordHash: str, rol: str, plan: str, nombreUsuario: str, db: Session):
    if obtenerUsuarioPorCorreo(correo, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya se encuentra registrado en el sistema"
        )
    
    if obtenerUsuarioPorNombre(nombreUsuario, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso, elige otro"
        )

    try:
        nuevoCliente = Cliente(
            correo=correo,
            passwordHash=passwordHash,
            rol=rol,
            plan=plan,
            nombreUsuario=nombreUsuario
        )
        db.add(nuevoCliente)
        db.commit()
        db.refresh(nuevoCliente)
        return nuevoCliente
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo o el nombre de usuario ya se encuentran registrados"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al procesar el registro: {str(e)}"
        )