# Chokxen Sport

Plataforma deportiva con frontend React, perfiles de demostración y consulta de resultados ESPN.

## Estructura

```text
backend/     API FastAPI, autenticación, catálogos y database/
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

Abre la dirección local que muestre Vite. Los botones **Básico**, **Premium** y **Administrador** permiten explorar la demo sin servidor. El formulario de login/registro usa el backend configurado en `frontend/.env.example` (localhost por defecto; Tailscale si se configura la IP VPN).

Inicio y Resultados separan los datos reales de ESPN de los encuentros ficticios de los perfiles demo. Créditos, apuestas, tienda, pedidos, administración y predicciones son simulaciones. El onboarding utiliza las rutas reales de catálogos y favoritos. La marca de bienvenida completada sin favoritos se conserva localmente.

```sh
npm test
npm run build
```

Consulta [la guía de frontend](docs/frontend.md), [su README](frontend/README.md) y [la conexión API](frontend/API.md).

El repositorio contiene el código fuente y sus recursos. Dependencias instaladas, compilaciones, configuraciones locales y paquetes ZIP no forman parte de esta integración.

## Comprobación local integrada

Consulta [la guía de login e integración](docs/integracion-login.md) para probar el backend real con una base aislada sin VPN. Login, sesión, favoritos, búsqueda y detalles están conectados. Tienda, apuestas y administración conservan sus simulaciones porque aún faltan sus APIs.

## Histórico y ejecución con Docker

Resultados incluye un archivo filtrable por liga, equipo y fechas. Guarda resultados y estadísticas ESPN en MySQL, con importación idempotente y consulta de antecedentes para el futuro motor predictivo. El catálogo histórico incluye 20 competiciones verificadas. Los goleadores se muestran en un formato compacto.

Para una instalación nueva:

```sh
python scripts/prepare_docker.py
docker compose config --quiet
docker compose up -d --build
docker compose exec backend python scripts/import_history.py --leagues all --start 2025-04-12 --end 2025-04-12
```

Abre http://localhost:5173. Conserva las credenciales si ya tienes un volumen MySQL; no ejecutes el generador de una instalación nueva para sustituirlas. Consulta [la guía de histórico y Docker](docs/historico-docker.md) para administración, importación por rangos y el contrato de datos. Se aprobaron 53 pruebas frontend y 14 backend, y se importaron 79 partidos históricos reales a SQLite aislado. La ejecución de contenedores/MySQL queda pendiente en un equipo con Docker.
