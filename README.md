# Chokxen Sport

SPA React conectada a FastAPI y MySQL. El frontend y el backend se despliegan con archivos Compose independientes.

## 1. Backend y base de datos

Desde esta carpeta, con Docker Desktop en ejecución:

```powershell
docker compose up -d --build
```

Documentación real: http://localhost:8080/docs. Contrato: http://localhost:8080/openapi.json.

Se conserva el backend de la versión anterior. El único cambio en sus archivos es el nombre `DockerFile` → `Dockerfile`, necesario para que Docker encuentre el archivo por defecto en Linux. El Compose raíz contiene exclusivamente MySQL y FastAPI. Los datos persisten en su volumen; no uses `down -v` para reiniciar la aplicación.

## 2. Frontend

Desde la misma carpeta:

```powershell
docker compose -f .\frontend\docker-compose.yml up -d --build
```

Abre http://localhost:5173. React se compila dentro de Docker y Nginx sirve la SPA. No hace falta instalar Node en Windows. También puedes ejecutar `frontend/iniciar.cmd`.

Nginx reenvía `/api/v1` al backend en el puerto 8080. Para usar otro servidor, copia `frontend/.env.example` a `frontend/.env` y cambia `BACKEND_URL` por su origen, sin `/api/v1`. Luego recrea el contenedor del frontend.

## Alcance

Registro, login, verificación de sesión, logout, favoritos, búsqueda y catálogo usan datos del backend. La navegación incluye Inicio, Catálogo, Resultados y Mi cuenta. La selección de favoritos utiliza las rutas existentes de favoritos; no se inventa un endpoint de onboarding. «Ahora no» guarda únicamente el estado de bienvenida en este navegador.

Los partidos, goleadores y estadísticas se consultan en ESPN. No se importan al MySQL desde el frontend. No hay perfiles de prueba, apuestas, tienda, pagos ni predicciones.

## Diagnóstico

```powershell
docker compose ps
docker compose logs --tail=80 backend
docker compose -f .\frontend\docker-compose.yml ps
docker compose -f .\frontend\docker-compose.yml logs --tail=80 frontend
```

En un primer inicio MySQL puede tardar en inicializar el esquema. Si 5173 está ocupado, detén el servidor de desarrollo anterior o configura otro `FRONTEND_PORT` en `frontend/.env`.

El contrato incluido en `frontend/contracts/openapi.json` se obtuvo del FastAPI que ejecuta Docker. Las pruebas del frontend se ejecutan con `npm test`; la compilación con `npm run build`.
