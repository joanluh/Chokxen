"""Genera variables locales sin mostrarlas ni sobrescribir una configuración."""
from pathlib import Path
import secrets
root = Path(__file__).resolve().parents[1]
target = root / '.env'
if target.exists():
    raise SystemExit('Ya existe .env; se conserva. Revisa la guía Docker para volúmenes existentes.')
values = {'MYSQL_PASSWORD': secrets.token_hex(24), 'MYSQL_ROOT_PASSWORD': secrets.token_hex(24), 'JWT_SECRET': secrets.token_hex(48)}
text = (root / '.env.example').read_text(encoding='utf-8')
for name, value in values.items():
    text = text.replace(f'{name}=\n', f'{name}={value}\n')
with target.open('x', encoding='utf-8', newline='\n') as output:
    output.write(text)
print('Creado .env local para una instalación nueva. No se sube a GitHub.')
