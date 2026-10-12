# Integración API de Chokxen

El formulario real usa `/api/v1` en el mismo origen. Vite reenvía las solicitudes a `BACKEND_URL`, por defecto `http://127.0.0.1:8080`. Para VPN configura `http://100.75.117.118:8080` en `.env.local` y reinicia Vite. El servidor debe estar activo para utilizar cuentas reales; las tres demos no dependen de él.

Todas las solicitudes de backend llevan `Heart: CHOKXEN SPORT` y `Chokxen-SPORT: true`. Las protegidas también incluyen Bearer. Los marcadores ESPN se consultan directamente y no reciben tokens de usuario ni estos encabezados.

| Acción | Método y ruta | Datos |
| --- | --- | --- |
| Registro | POST `/api/v1/auth/register` | JSON `correo`, `password`, `nombreUsuario`, `rol: Cliente`, `plan` |
| Login | POST `/api/v1/auth/login` | URL encoded `username`, `password`, `grant_type: password` |
| Perfil | GET `/api/v1/usuarios/me` | Bearer |
| Renovación | POST `/api/v1/auth/refresh` | Header `refreshToken` |
| Cierre | POST `/api/v1/auth/logout` | Bearer |
| Favoritos | GET / POST `/api/v1/favoritos/` | POST JSON `tipoFavorito`, `elementoId`; Bearer |
| Eliminar favorito | DELETE `/api/v1/favoritos/{idPreferenciasUsuario}` | Bearer; ID de preferencia |
| Ligas y detalle | GET `/api/v1/competiciones/`, `/api/v1/competiciones/{id}` | Bearer |
| Equipos y detalle | GET `/api/v1/equipos/`, `/api/v1/equipos/{equipoId}` | Bearer |
| Jugadores y detalle | GET `/api/v1/jugadores/`, `/api/v1/jugadores/{idJugador}` | Bearer |
| Búsqueda | GET `/api/v1/busqueda/?q=...` | Bearer; mínimo tres caracteres |

## Respuestas comprobadas

Login devuelve `access_token`, `refreshToken` y `token_type`. Refresh devuelve `accessToken` y `tokenType`; si no rota refreshToken, el cliente conserva el anterior. El adaptador admite también las variantes en snake_case.

Perfil devuelve `{ mensaje, usuario: { correo, id, rol, plan, nombreUsuario } }`. El adaptador lee `usuario` y conserva compatibilidad con el perfil en la raíz. Comprueba el perfil antes de permitir la entrada; nunca deduce el rol del formulario. Un fallo de perfil elimina los tokens locales.

Registro duplicado y credenciales incorrectas pueden devolver 400 con `detail`. Se presentan errores del contrato sin revelar inputs de validación ni detalles internos de errores 500. Tokens se conservan en sessionStorage y se eliminan al cerrar sesión. Una respuesta 401 permite renovar una vez; un rechazo del refresh termina la sesión local.

## Favoritos y onboarding

El onboarding real carga ligas, equipos y jugadores de las rutas actuales y guarda preferencias con IDs de esos catálogos. La carga recupera los favoritos del servidor. Guardar agrega antes de eliminar, evita duplicados y elimina utilizando el ID de preferencia del backend. Un error se muestra y mantiene la bienvenida abierta; las rutas no ofrecen una transacción para todo el conjunto, por lo que una escritura parcialmente completada debe reconsultarse.

No existe una ruta específica de onboarding. La finalización sin preferencias se recuerda por correo en el navegador; los favoritos se almacenan en el servidor. Las demos guardan todo localmente. Los permisos reales siempre corresponden al backend.

## ESPN y simulaciones

ESPN cubre Liga MX, Premier League, LaLiga, Champions, NFL y NBA, con consulta cada 10 segundos durante encuentros en vivo y cada minuto en otros casos. La latencia depende de la fuente. Los ejemplos ficticios se muestran aparte solamente en las experiencias demo. Tienda, apuestas, créditos, predicciones y administración siguen simuladas porque sus APIs no existen en main.

## Comprobación

53 pruebas frontend, 14 pruebas backend, compilación y prueba HTTP del cliente real a través del proxy. Navegador: sesión real local, favoritos, recarga, búsqueda, detalle, logout y tres demos; móvil comprobado a 390 px. Backend de prueba con modelos/rutas reales y SQLite aislado; VPN y MySQL no se probaron porque el servidor está apagado. El contrato en `contracts/openapi.json` se generó de las rutas actuales.

Consulta [la guía integrada](../docs/integracion-login.md) para repetir la comprobación. Logout limpia el cliente y llama al backend; el backend no mantiene revocación persistente de JWT, por lo que no se afirma que un token copiado quede invalidado antes de caducar.

## Goleadores y estadísticas por encuentro

Ver detalle consulta `/summary?event=ID` en la liga ESPN correspondiente. Muestra autores y minutos de goles, autogoles/penales cuando estén informados, marcador y comparación de estadísticas. En fútbol incluye posesión, tiros, córners, faltas, tarjetas y pases. Los datos faltantes se muestran como no disponibles; los encuentros de demo no generan goleadores falsos. El detalle se consulta cada 10 segundos en vivo, cada minuto antes de comenzar y una vez al terminar; pausa al ocultar la pestaña y cancela al cerrar el diálogo. No recibe los tokens del backend.

Validación adicional: 7 pruebas del adaptador de resúmenes, resumen real reducido de Pumas–Cruz Azul, consultas reales de ese encuentro y América–Monterrey, y revisión móvil sin desbordamiento. Se eliminó del panel el bloque ESPN Actualizado y su botón; la consulta automática sigue activa.

## Histórico y Docker

La vista Histórico guardado consulta la BD con filtros de liga, equipo y fechas. El catálogo verificado contiene 20 competiciones ESPN; las seis fuentes de la vista en vivo se mantienen. La importación protegida para administradores guarda resultados terminados y estadísticas, evita duplicados y admite reintentos. Dataset y antecedentes autenticados proporcionan los datos para el futuro motor predictivo. La exportación de estadísticas del propio encuentro no debe utilizarse como una variable anterior al partido. Consulta [el contrato y la guía Docker](../docs/historico-docker.md) para rutas, lotes y arranque. Se importaron 79 partidos del 12/04/2025 con estadísticas en SQLite aislado; los contenedores y MySQL no se ejecutaron aquí.
