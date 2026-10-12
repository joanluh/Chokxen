# Chokxen Sport

Plataforma deportiva con frontend React, perfiles de demostración y consulta de resultados ESPN.

## Estructura

```text
backend/     Infraestructura Python del backend
database/    Modelos, repositorios, inicialización y seeders
frontend/    Aplicación React, estilos, recursos, contrato API y pruebas
docs/        Documentación del proyecto
```

## Ejecutar el frontend

Requiere Node.js 22.12 o superior.

```sh
cd frontend
npm ci --ignore-scripts
npm run dev
```

Abre la dirección local que muestre Vite. Los botones **Básico**, **Premium** y **Administrador** permiten explorar la demo sin servidor. El formulario de login/registro usa el backend configurado en `frontend/.env.example`; la conexión a ese backend requiere Tailscale.

Inicio y Resultados separan los datos reales de ESPN de los encuentros ficticios de los perfiles demo. Créditos, apuestas, tienda, pedidos, administración y predicciones son simulaciones. El onboarding guarda preferencias localmente mientras falta su endpoint.

```sh
npm test
npm run build
```

Consulta [la guía de frontend](docs/frontend.md), [su README](frontend/README.md) y [la conexión API](frontend/API.md).

El repositorio contiene el código fuente y sus recursos. Dependencias instaladas, compilaciones, configuraciones locales y paquetes ZIP no forman parte de esta integración.
