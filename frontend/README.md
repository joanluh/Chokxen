# Chokxen SPA en Docker Compose

React + Vite compilado y servido por Nginx. Una sola aplicación con navegación `#/inicio`, `#/resultados`, etc. El Compose de esta carpeta crea **únicamente el frontend** en un proyecto independiente `chokxen-frontend`. No inicia, reconstruye ni modifica FastAPI o MySQL. No requiere Node instalado en la computadora.

## Arrancar solo la vista

Requiere Docker Desktop encendido, con contenedores Linux y Docker Compose v2. Abre una terminal en esta carpeta:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Abre http://localhost:5173. También puedes ejecutar `iniciar.cmd` en Windows: llama a estos mismos comandos Docker. La compilación ocurre dentro de la imagen; Nginx sirve el resultado, sin servidor Vite de desarrollo. Básico, Premium y Administrador permiten probar la vista sin backend. El formulario de cuenta real muestra un error si el backend no está disponible; no convierte una cuenta real en una demo.

Desde la raíz del repositorio puedes iniciar lo mismo con `docker compose -f frontend/docker-compose.yml up -d --build`. Para que la configuración `.env` se encuentre de forma consistente, usa la terminal dentro de `frontend/` o añade `--env-file frontend/.env` al comando desde la raíz.

## Conectar el contenedor de Daniel

El backend existente mantiene su despliegue y su base de datos por separado. Por defecto el front reenvía `/api/v1` al puerto 8080 de la computadora que ejecuta Docker. Si el backend está en otra computadora, copia `.env.example` a `.env` **en esta carpeta** y cambia:

```dotenv
BACKEND_URL=http://100.75.117.118:8080
FRONTEND_PORT=5173
VITE_ENABLE_DEMO=true
```

`BACKEND_URL` es el origen accesible **desde Nginx**, sin `/api/v1` ni barra final. Para Docker Desktop y un backend publicado en esta misma computadora usa `http://host.docker.internal:8080`. No uses `localhost`: dentro del front sería el propio contenedor. Para VPN, Tailscale y el backend deben estar encendidos, y la red del contenedor debe alcanzar esa dirección.

Aplica un cambio de URL con `docker compose up -d --force-recreate`. No requiere recompilar React. Si cambias `VITE_ENABLE_DEMO`, usa `docker compose up -d --build`. El navegador consulta `/api/v1` en el mismo origen del front; Nginx conserva rutas, query strings, Bearer y encabezados del contrato. No se pone ninguna contraseña ni clave del backend en la imagen.

La salud de la vista depende solo de `/health` de Nginx. El backend apagado o un nombre de API sin resolver no impiden que Nginx arranque: se resuelve al solicitar la API. Las cuentas reales necesitan el backend; las demos y el contenido de la SPA no.

## Verificar el despliegue

```sh
docker compose logs --tail=100 frontend
docker compose exec frontend nginx -t
docker compose exec frontend wget -qO- http://127.0.0.1/health
```

El último comando devuelve `ok`; comprueba únicamente la vista. Para comprobar que llega al backend existente:

```sh
docker compose exec frontend wget -qO- http://127.0.0.1/api/v1/usuarios/me
```

Un 401 sin token es esperado y significa que la API requiere sesión; 502/504 indican conectividad con el backend. Después prueba una cuenta real desde el formulario, su perfil y el cierre de sesión. No uses un perfil demo para validar el servidor.

Para móvil usa `http://IP-DE-ESTA-COMPUTADORA:5173` en la misma red, si el firewall permite el puerto. El mapeo predeterminado publica 5173; cambia `FRONTEND_PORT` si ya está ocupado. Comprueba la vista a 320 y 390 px, sin desplazamiento horizontal.

Para detener **solo el front**: `docker compose down` desde esta carpeta. No utiliza volúmenes de MySQL ni `depends_on` del backend.

## Contrato y alcance

`contracts/openapi.json` se generó desde la aplicación FastAPI de la versión base `dffff4f3ec910427f2299e4f2b7b78b9cb4c5b63`, sin iniciar un servidor. Consulta [API.md](API.md). Si Daniel actualiza su backend, exporten su `/openapi.json` para ajustar el front a esa versión.

Se conserva login, registro, perfil, favoritos, onboarding, tres demos, resultados ESPN, escudos y fotografías, con diseño móvil. No se usa `/historico`: el backend anterior no tiene esas rutas. Las preferencias reales usan las rutas existentes de favoritos; no se inventa un endpoint de onboarding. Tienda, apuestas y predicciones siguen siendo vistas de demostración.

Validación de código: `npm test` y `npm run build` (también pueden ejecutarse dentro de la etapa `build` de la imagen). No se ha validado una ejecución de Docker en esta máquina: no tiene el motor disponible. El arranque del contenedor y la conexión con el backend de Daniel deben comprobarse en la computadora que tenga Docker.
