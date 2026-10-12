# Contrato del frontend con el backend existente

La SPA consulta `/api/v1` en el mismo origen. Nginx reenvía esas solicitudes a `BACKEND_URL`, configurado al iniciar el contenedor. [Arranque con Docker Compose](README.md).

| Acción | Método y ruta bajo `/api/v1` | Formato |
| --- | --- | --- |
| Registro | POST `/auth/register` | JSON `correo`, `password`, `nombreUsuario`, `rol: Cliente`, `plan: Basico/Premium` |
| Login | POST `/auth/login` | URL encoded `username`, `password`, `grant_type: password` |
| Perfil | GET `/usuarios/me` | Bearer |
| Renovación | POST `/auth/refresh` | Header `refreshToken` |
| Salir | POST `/auth/logout` | Bearer |
| Favoritos | GET / POST `/favoritos/` | Bearer; POST `tipoFavorito`, `elementoId` |
| Eliminar favorito | DELETE `/favoritos/{idPreferenciasUsuario}` | Bearer |
| Ligas | GET `/competiciones/`, `/competiciones/{id}` | Bearer |
| Equipos | GET `/equipos/`, `/equipos/{id}` | Bearer |
| Jugadores | GET `/jugadores/`, `/jugadores/{id}` | Bearer |
| Búsqueda | GET `/busqueda/?q=...` | Bearer, mínimo tres caracteres |

Todas las solicitudes propias incluyen `Heart: CHOKXEN SPORT` y `Chokxen-SPORT: true`. Son encabezados de identificación: la autorización depende del Bearer validado por FastAPI. El proxy evita un preflight CORS entre el navegador y el backend. ESPN se consulta aparte sin tokens de usuarios.

Login responde `access_token`, `refreshToken`, `token_type`. El perfil original responde `{mensaje, usuario: {correo, id, rol, plan}}`; el nombre mostrado usa el correo si el backend no devuelve `nombreUsuario`. El rol no se deduce del formulario. Registro y credenciales inválidas pueden responder 400 con `detail`; validaciones 422 se muestran sin imprimir contraseñas. Los tokens se conservan en sessionStorage y se eliminan al salir.

No hay endpoint específico de onboarding: se usan catálogos y favoritos existentes. Los IDs de ESPN no se mezclan con los de la base de datos. La finalización sin preferencias se recuerda localmente. Las demos conservan sus preferencias en este navegador.

## Límites de la versión restaurada

Se restaura el backend sin editarlo. Su `/auth/refresh` devuelve un token nuevo con correo, rol y plan, pero omite el ID de usuario. Daniel debe resolver esa omisión en el backend para que las operaciones de favoritos sigan funcionando tras renovar la sesión. Mientras tanto, volver a iniciar sesión obtiene un token con ID. No se intenta fabricar ni modificar tokens desde React. Logout elimina los tokens del cliente; el backend original no revoca JWT de forma persistente.

Las rutas `/historico`, importaciones y dataset de la integración anterior ya no se invocan. No están en el contrato de la versión base. ESPN conserva la consulta de resultados recientes y de los detalles con goleadores/estadísticas; la disponibilidad depende de la fuente. Tienda, pagos, apuestas, créditos, predicciones y gestión administrativa siguen simulados.

El contrato OpenAPI adjunto se generó del código base, no del contenedor remoto en ejecución. Si la versión de Daniel difiere, usa el JSON obtenido de su `/openapi.json` como referencia para ajustar solo el frontend.
