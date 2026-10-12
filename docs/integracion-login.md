# Comprobación de la integración de Chokxen

Revisión de main descargado de GitHub, commit `dffff4f3ec910427f2299e4f2b7b78b9cb4c5b63`, con todas las rutas actuales del backend.

## Cambios

- El login interpreta `/usuarios/me` como `{ mensaje, usuario: { correo, id, rol, plan, nombreUsuario } }`. Antes esperaba el perfil en la raíz y rechazaba la cuenta aunque el login fuera correcto.
- Se conservan `access_token` / `accessToken` y `refreshToken` / `refresh_token`. La renovación preserva el ID del cliente; sin él fallaba el guardado de favoritos.
- Login, registro, perfil, refresh, logout, favoritos y catálogos usan el mismo proxy `/api`. Se envían `Heart: CHOKXEN SPORT`, `Chokxen-SPORT: true` y Bearer en rutas protegidas. CORS admite los encabezados reales y orígenes configurables.
- El onboarding carga ligas, equipos y jugadores del servidor. Los favoritos se consultan, crean y eliminan con IDs reales. No se simula un endpoint de onboarding: solo su marca de finalización vacía permanece local.
- El panel consulta búsqueda y detalles de ligas, equipos y jugadores. Los tres perfiles demo mantienen preferencias locales y no llaman al backend de usuarios.
- `paraProbar.html` conserva el prototipo del equipo, usa el mismo proxy y lee el perfil anidado. El flujo principal verificado es la aplicación React.
- El registro público fuerza Cliente. Tokens de acceso y refresh tienen tipos distintos. JWT_SECRET se obtiene del entorno; si falta, se genera una clave temporal por proceso y reiniciar invalida las sesiones. Configura una clave estable y privada para un despliegue.
- Compose raíz incorpora frontend conectado a `backend:8080`, espera a MySQL y declara el nombre real `DockerFile`. No se ha ejecutado Docker en esta máquina.

## Repetir la comprobación sin VPN

Desde la raíz del repositorio, con Python 3.11 o superior y Node.js 22.12 o superior:

```sh
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-test.txt
backend/.venv/Scripts/python.exe backend/scripts/local_check.py
```

En otra terminal:

```sh
cd frontend
npm ci --ignore-scripts
npm run dev
```

Abre `http://127.0.0.1:5173/`. La cuenta ficticia local es `local@example.test`, contraseña de prueba `PruebaLogin123!`. El script utiliza los modelos, servicios, rutas, hashing y JWT reales del proyecto con SQLite separado en `backend/.local-check/`; no conecta con la VPN ni importa usuarios del volcado MySQL. Para Linux/macOS sustituye la ruta de Python por `backend/.venv/bin/python`.

```sh
backend/.venv/Scripts/python.exe -m pytest backend/tests -q
cd frontend
npm test
node scripts/check-local-login.mjs
npm run build
```

El último script solo admite el backend de comprobación local; crea una cuenta ficticia aislada para verificar registro y favoritos, y cierra su sesión. Un navegador puede comprobar el resto con la cuenta local. Si esta máquina restringe el empaquetado de la configuración de Vite, usa `npm run build -- --configLoader native` y `npm run preview -- --configLoader native --port 5173`.

## Conectar al servidor real

Configura `BACKEND_URL` en `frontend/.env.local`. Para la VPN: `http://100.75.117.118:8080`; para desarrollo: `http://127.0.0.1:8080`. Reinicia Vite cuando cambies variables. `VITE_LOCAL_CHECK=true` solo etiqueta la comprobación aislada; omítela fuera de esa prueba. Usa una base real y JWT_SECRET privado en el backend. La prueba local no sustituye una comprobación de MySQL ni del despliegue VPN.

Con Docker, configura primero el archivo `.env` según [la guía de histórico y Docker](historico-docker.md), después ejecuta `docker compose up -d --build`. El frontend usa Nginx y la dirección interna del servicio backend; no necesita una IP Tailscale dentro de Compose. Conserva las credenciales si MySQL ya tiene un volumen inicializado.

## Resultado

- 53 pruebas de frontend aprobadas y compilación de producción correcta.
- 7 pruebas del backend aprobadas con base aislada: contraseña real, perfil anidado, protección sin token, refresh, IDs, CORS, búsqueda, catálogos, favoritos y separación entre cuentas.
- Prueba HTTP completa con el adaptador React a través de Vite y FastAPI real: registro, login incorrecto/correcto, perfil, restauración, refresh, catálogos, favoritos, búsqueda, detalle y logout.
- Navegador: login real local, onboarding y persistencia de favoritos, recarga, búsqueda y detalle de equipo, nombre del perfil, cierre de sesión y tres perfiles demo. Móvil a 390 px sin desbordamiento horizontal en panel y onboarding.

Tienda, créditos, predicciones, apuestas y administración permanecen simuladas porque no existen sus endpoints en main. ESPN sigue activo. Logout elimina los tokens del frontend y llama al endpoint, pero el backend conserva JWT sin revocación persistente: un token copiado previamente sigue válido hasta caducar. Esa limitación del backend no se presenta como invalidación de sesión en el servidor.

El contrato OpenAPI se actualizó desde esta ejecución de las rutas actuales. El servidor VPN está apagado por indicación del usuario; no se usaron cuentas ni contraseñas personales. Los cambios de esta revisión están locales y aún no se han publicado en GitHub.
