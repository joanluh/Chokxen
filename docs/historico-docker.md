# Histórico ESPN y Docker

Resultados tiene dos vistas: **Histórico guardado** para este sprint, y **En vivo y recientes** para el seguimiento del frontend. El archivo permite elegir liga, fechas y nombre de equipo, muestra 30 resultados por página y abre goleadores/estadísticas desde la BD, sin volver a pedir el resumen a ESPN. Los perfiles demo pueden leer el archivo compartido, pero no escribir en la BD ni usar una sesión administrativa real.

## Iniciar una instalación nueva

Desde la raíz del repositorio, con Docker Desktop y Compose disponibles:

```sh
python scripts/prepare_docker.py
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Frontend: http://localhost:5173. API y Swagger: http://localhost:8080/docs. React se compila en una imagen multietapa y Nginx sirve los archivos y reenvía `/api/` a FastAPI. MySQL espera su comprobación de salud; FastAPI crea únicamente las dos tablas nuevas del histórico y mantiene las tablas del equipo. Se mantiene el volumen `mysql_data`. El backend usa un worker, sin reload ni montajes de desarrollo. `.env`, SQLite de pruebas y dependencias locales se excluyen de imágenes y Git.

**Instalación existente:** conserva las credenciales del MySQL ya inicializado en `.env`; cambiarlas en Compose no cambia las contraseñas dentro del volumen. El generador anterior es para instalaciones nuevas y no sobrescribe `.env`. No uses `down -v` para actualizar. Si escoges manualmente una contraseña con caracteres reservados de URL, usa una contraseña hexadecimal o adapta la URL de conexión con el escape correspondiente.

Los puertos escuchan en loopback por defecto. Para un despliegue autorizado en otra máquina, ajusta `FRONTEND_BIND` y `CORS_ORIGINS` en `.env`. Los tokens reales requieren un `JWT_SECRET` estable; reiniciar conserva las sesiones firmadas con esa misma clave. Los tres perfiles de prueba continúan independientes del login real.

## Importar resultados y estadísticas

Ejemplo Liga MX, periodo pasado:

```sh
docker compose exec backend python scripts/import_history.py --leagues soccer/mex.1 --start 2025-04-12 --end 2025-04-13
```

Todas las competiciones del catálogo:

```sh
docker compose exec backend python scripts/import_history.py --leagues all --start 2025-04-01 --end 2025-04-30
```

El CLI divide los periodos por liga y bloques de siete días. También admite códigos separados por coma. Devuelve código 1 cuando algún lote termina parcial o fallido; repetir el rango reintenta y actualiza sin duplicar. No ejecuta importaciones automáticamente: el equipo decide periodo y frecuencia. Ejecuta un importador a la vez y evita reiniciar FastAPI durante un lote CLI.

Para importar desde la pantalla, entra con una **cuenta real Administrador**. Si la instalación no tiene una, el operador puede crear una de forma explícita:

```sh
docker compose exec backend python scripts/create_admin.py
```

Ese comando pide correo y contraseña sin imprimirla y rechaza correos existentes. No es el perfil demo Administrador. El registro público siempre crea Clientes. En Resultados, el administrador elige periodo/liga y pulsa **Importar periodo de ESPN**. La solicitud devuelve 202 y el panel consulta progreso, nuevos, actualizados e incidencias. Por lote HTTP: hasta 31 días y 93 días-liga, 500 partidos; para las 20 competiciones simultáneas usa hasta cuatro días. Para años o temporadas usa el CLI por lotes. Un reinicio marca las importaciones HTTP pendientes como interrumpidas; vuelve a importar el rango para continuarlas.

## Cobertura comprobada

20 calendarios respondieron HTTP 200 con identificación de liga al consultar `20250412`: Liga MX, Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, Primeira Liga, Eredivisie, MLS, liga argentina, Brasileirão, Champions, Europa League, Libertadores, Concacaf Champions Cup, NFL, NBA, WNBA, MLB y NHL. Esto confirma el endpoint, no que cada competición tenga partidos ese día ni todas sus temporadas completas. El registro de ligas se amplía en `backend/services/espn_history.py` después de verificar nuevos códigos.

Se consultan fechas individuales y un día adicional para cubrir la noche mexicana, se filtra en `America/Mexico_City` y se guarda kickoff en UTC. Solo entran eventos terminados con equipos y marcadores válidos; se excluyen cancelados, suspendidos, futuros y ejemplos demo. La clave única liga/ID ESPN evita duplicados. El guardado de un resultado no depende de que llegue su resumen: estados `pending`, `unavailable`, `available` distinguen estadísticas pendientes, no ofrecidas por la fuente y disponibles. Los errores parciales se conservan en el trabajo; un fallo posterior de resumen mantiene las estadísticas previas compatibles.

ESPN se consulta sin API key. Estos endpoints públicos no ofrecen aquí una garantía de latencia, integridad histórica o continuidad. No se sustituyen datos faltantes por ceros. El importador conserva marcador, equipos, IDs, fecha, estadio, goles y todas las estadísticas de equipo informadas; excluye noticias, vídeos, odds y narraciones de la respuesta.

## Contrato para el motor predictivo

| Método y ruta bajo `/api/v1/historico` | Uso |
| --- | --- |
| GET `/ligas` | Catálogo disponible |
| GET `/partidos?league=...&start=...&end=...&team=...&offset=0&limit=30` | Archivo paginado; lectura pública |
| GET `/partidos/{event_id}?league=...` | Marcador y `storedSummary` guardados |
| POST `/importaciones` | Administrador; JSON `leagues`, `start`, `end` |
| GET `/importaciones/{id}` | Administrador; progreso e incidencias |
| GET `/dataset?league=...&start=...&end=...&offset=0&limit=100` | Bearer; dataset paginado, hasta 500 filas |
| GET `/antecedentes?league=...&team_id=...&before=...&limit=20` | Bearer; solo partidos con kickoff estrictamente anterior a `before` |

El dataset incluye `schemaVersion:1`, fecha, IDs, equipos, marcador, etiqueta `home/away/draw` y `postMatchStatistics`. Marcador/estadísticas del encuentro son datos posteriores y etiquetas para entrenamiento; **no son variables disponibles antes de ese mismo partido**. El endpoint de antecedentes aplica el corte temporal para evitar usar el propio partido o futuros al construir variables. `before` necesita zona horaria (ejemplo `2026-10-11T20:00:00-06:00`). No se implementó ni entrenó el motor: esta entrega proporciona los datos y su lectura. En pantalla, Exportar página JSON descarga hasta 30 filas de la página/periodo aplicado; para extraer todo usa el dataset con paginación.

## Validación y límites

Pruebas automatizadas: 53 frontend y 14 backend; compilación de producción. Se importaron 79 partidos reales de 12/04/2025 por CLI y siete de Liga MX del 10–11/10/2026 desde el panel, todos con estadísticas, a SQLite aislado. Reimportar cinco partidos actualizó cinco y creó cero. Navegador: filtros, importación completa, detalle guardado y ancho sin desbordamiento a 320, 390 y 1280 px. Se comprobaron el generador de `.env` sin sobrescritura, la carga de la entrada Uvicorn y la compilación del DDL MySQL. Los fixtures controlados no entran al histórico real. No se probó la ejecución de contenedores ni MySQL en esta máquina porque no dispone del comando Docker. Repite los comandos de inicio anteriores en el equipo con Docker antes del despliegue.

Los datos importados durante la comprobación viven en `backend/.local-check/chokxen.sqlite`, excluido de la entrega. Una instalación Docker nueva empieza con el archivo histórico vacío hasta importar. Login, registro, perfil, favoritos y catálogos siguen utilizando el backend existente; la tienda, las apuestas y la página de predicciones conservan sus simulaciones identificadas.
