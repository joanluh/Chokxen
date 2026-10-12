# Integración de la SPA

`contracts/openapi.json` se descargó de http://localhost:8080/openapi.json con el backend restaurado en Docker. Los esquemas de respuesta no están tipados en OpenAPI, por lo que también se verificaron las respuestas HTTP reales.

| Operación | Método y ruta | Datos |
| --- | --- | --- |
| Registro | POST `/api/v1/auth/register` | JSON: correo, password, nombreUsuario, rol Cliente, plan Basico |
| Login | POST `/api/v1/auth/login` | Formulario URL encoded: username, password, grant_type password |
| Perfil | GET `/api/v1/usuarios/me` | Bearer; respuesta envuelta en usuario: correo, id, rol, plan |
| Renovación | POST `/api/v1/auth/refresh` | Header refreshToken |
| Logout | POST `/api/v1/auth/logout` | Bearer; el cliente elimina sus tokens aunque falle la conexión |
| Catálogo | GET `/api/v1/competiciones/`, `/equipos/`, `/jugadores/` | Bearer; listas con IDs de la BD |
| Búsqueda | GET `/api/v1/busqueda/?q=cesar` | Bearer; ligas, equipos, jugadores; mínimo tres caracteres |
| Favoritos | GET/POST `/api/v1/favoritos/` | Bearer; POST tipoFavorito y elementoId |
| Quitar favorito | DELETE `/api/v1/favoritos/{idPreferenciasUsuario}` | ID de la preferencia, no ID del equipo |

Todas las solicitudes a FastAPI incluyen `Heart: CHOKXEN SPORT` y `Chokxen-SPORT: true`. Estos headers identifican el cliente; la autenticación depende del Bearer validado por el backend.

El backend actual no devuelve nombreUsuario en `/usuarios/me`; el frontend muestra el nombre derivado del correo hasta que el backend incluya ese campo. No se crea ni modifica un endpoint de onboarding: se utilizan favoritos para las selecciones y almacenamiento local únicamente para recordar que se vio la bienvenida.

## Pendiente confirmado en el backend

La prueba HTTP real de `/auth/refresh` devuelve 200, pero `/usuarios/me` con el token renovado devuelve `id: null`. En `backend/routes/auth.py`, `newAccessToken` incluye sub/rol/plan y omite el ID que sí incluye login. El frontend verifica el perfil después de renovar, elimina la sesión incompleta y solicita volver a ingresar. Daniel debe incluir el ID del usuario en el token renovado para que la renovación sea transparente. La lógica del backend se dejó intacta.

Logout devuelve un mensaje; no revoca tokens en el servidor. La SPA elimina sus tokens y vuelve al acceso. Una revocación de servidor requiere implementación del backend.

## ESPN para el equipo

- Partidos Liga MX: https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard
- Equipos Liga MX: https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/teams
- Detalle de un partido: https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/summary?event=ID_DEL_EVENTO

La fecha de scoreboard se puede indicar con `?dates=YYYYMMDD`. La SPA consulta fechas individuales y filtra la fecha en Ciudad de México para incluir partidos nocturnos. Hay cobertura configurada de Liga MX, Premier League, LaLiga, Champions, NFL y NBA. Solo se ofrecen deportes y ligas con feed configurado.

En vivo se consulta cada 10 segundos; en otras condiciones, cada 60 segundos. El detalle conserva la última respuesta en caso de fallo y muestra que no se pudo actualizar. Es un servicio externo: su frecuencia de publicación y disponibilidad no dependen de Chokxen.
