"""Alta administrativa explícita para una instalación nueva; no cambia cuentas existentes."""
import sys
import getpass
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from database.connection import SessionLocal
from database.models.clientes import Cliente
from core.security import getPasswordHash

def main():
    email = input('Correo de la nueva cuenta administrativa: ').strip().lower()
    if '@' not in email or len(email) > 200:
        raise SystemExit('Correo inválido.')
    password = getpass.getpass('Contraseña (mínimo 12 caracteres): ')
    if len(password) < 12 or password != getpass.getpass('Repite la contraseña: '):
        raise SystemExit('La contraseña no cumple el mínimo o no coincide.')
    with SessionLocal() as db:
        if db.query(Cliente).filter_by(correo=email).first():
            raise SystemExit('Ese correo ya existe. Se conserva la cuenta y su rol.')
        db.add(Cliente(correo=email,nombreUsuario='Administrador',passwordHash=getPasswordHash(password),rol='Administrador',plan='Premium'))
        db.commit()
    print('Cuenta creada. Inicia sesión mediante el formulario; la demo Administrador sigue siendo independiente.')

if __name__ == '__main__':
    main()
