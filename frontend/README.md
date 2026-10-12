# Frontend Chokxen Sport

SPA React y Vite servida por Nginx, con Compose independiente del backend.

```powershell
docker compose up -d --build
```

Abre http://localhost:5173. El backend debe estar encendido para registrarse o iniciar sesión. No hay accesos de demostración ni datos deportivos inventados.

`BACKEND_URL` es la dirección accesible desde Nginx: por defecto `http://host.docker.internal:8080`. La SPA llama al mismo origen `/api/v1`, y el proxy de Nginx conecta con FastAPI sin depender de CORS del navegador. Configura otro servidor en `.env` a partir de `.env.example`. `FRONTEND_PORT` cambia el puerto publicado.

El Dockerfile compila el frontend y copia los archivos estáticos a Nginx. Las variables de Vite son de compilación, no un mecanismo para guardar secretos. Nunca agregues claves o tokens a `.env` de Vite.

La sesión se valida con `/usuarios/me`. Los tokens se conservan en `sessionStorage`; las contraseñas no se almacenan. Los favoritos se guardan con los IDs reales del catálogo. La bienvenida puede omitirse y volver a abrirse desde Mi cuenta.

La búsqueda superior consulta `/busqueda/` y muestra ligas, equipos y jugadores. Requiere al menos tres caracteres y distingue carga, error y búsqueda sin coincidencias. Resultados tiene filtros propios para los encuentros de ESPN, por deporte, liga, fecha y estado.

Desarrollo: `npm ci`, `npm test`, `npm run build`. En el entorno restringido de Codex se verificó con `npm run build -- --configLoader native`; el despliegue que se muestra al usuario es Docker Compose.

Los estilos siguen la identidad oscura y roja de Chokxen. Controles táctiles de 44 px como mínimo, foco visible, validación por campo, lectura accesible de estados y diseño móvil sin scroll horizontal. Apple Design e Impeccable se aplicaron a la jerarquía, los formularios y el onboarding.
