# Chokxen Sport

Se restaura el backend y la infraestructura de la versión `dffff4f3ec910427f2299e4f2b7b78b9cb4c5b63` (anterior a la integración de histórico). El Compose raíz vuelve a contener únicamente los servicios originales de MySQL y FastAPI. El frontend tiene su propio Compose independiente.

## Levantar solo la SPA

```sh
cd frontend
docker compose up -d --build
```

Abre http://localhost:5173. No necesita un backend encendido para mostrar la interfaz y probar Básico, Premium y Administrador. Para cuentas reales configura `BACKEND_URL` del contenedor existente de Daniel en `frontend/.env`. No necesitas instalar Node ni iniciar Vite en la computadora.

Consulta [frontend/README.md](frontend/README.md) para Docker, configuración de VPN y diagnóstico, y [frontend/API.md](frontend/API.md) para el contrato.

El backend conserva su Dockerfile, dependencias, rutas y Compose originales sin modificaciones. La SPA mantiene diseño móvil, login/registro, perfil, onboarding con favoritos existentes y consulta ESPN. Se retira la dependencia de las nuevas rutas de histórico; tienda, apuestas y predicciones siguen como demostración.

Validación: 50 pruebas del frontend y compilación aprobadas. La ejecución de los contenedores requiere verificar Docker en el equipo de despliegue; actualizar el repositorio no modifica el servidor remoto ni su base de datos.
