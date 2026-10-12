# Conexión local de Chokxen

El formulario inicia en modo API para cuentas reales; a su lado aparecen los botones Básico, Premium y Administrador, que no necesitan servidor. `VITE_ENABLE_DEMO=false` los oculta en modo API. El HTML independiente fuerza modo demo para funcionar sin red. El backend indicado es `http://100.75.117.118:8080`, accesible con Tailscale conectado. Vite reenvía `/api/*` a ese servidor; el navegador utiliza el mismo origen del frontend. La dirección se puede cambiar con `BACKEND_URL` en `.env.local`. Este proxy está configurado tanto para desarrollo como para `npm run preview` y solo escucha en la máquina local.

```env
VITE_DATA_MODE=api
VITE_ENABLE_DEMO=true
VITE_API_URL=/api/v1
BACKEND_URL=http://100.75.117.118:8080
VITE_SPORTS_MODE=espn
```

Ejecuta `npm run dev`. Abre `http://127.0.0.1:5173`. El formulario permite entrar con una cuenta existente o registrarse y seleccionar favoritos. Al publicar algún día como archivos estáticos, el servidor que entregue el frontend deberá reenviar `/api`, o se tendrá que configurar `VITE_API_URL` con la URL completa de un backend que admita ese origen. Aún no hay publicación.

## Solicitudes del documento

| Acción | Solicitud |
| --- | --- |
| Registro | `POST /api/v1/auth/register`, JSON con `correo`, `password`, `nombreUsuario`, `rol: Cliente`, `plan` |
| Login | `POST /api/v1/auth/login`, formulario URL encoded con `username` y `password` |
| Perfil | `GET /api/v1/usuarios/me`, `Authorization: Bearer <access token>` |
| Renovación | `POST /api/v1/auth/refresh`, encabezado `refreshToken` |
| Logout | `POST /api/v1/auth/logout`, Bearer |

El contrato original se conserva en `contracts/openapi.json`. El backend respondió HTTP 200 en `/openapi.json` y HTTP 401 al consultar el perfil sin token. Las pruebas de registro, login, perfil, renovación y logout utilizan un servidor simulado local y no crean usuarios de prueba en la VPN.

## Respuestas que faltan en OpenAPI

El documento tiene esquemas `{}` en las respuestas exitosas. El adaptador admite los siguientes campos habituales, **pendientes de contrastar con una sesión real**:

```json
{"access_token":"...","refresh_token":"..."}
```

También admite `accessToken` / `refreshToken`. `access_token` es obligatorio para entrar. Si no viene un refresh token, la cuenta puede iniciar sesión, pero deberá volver a entrar cuando caduque el acceso. Si refresh no rota su token, se conserva el anterior.

```json
{"correo":"usuario@ejemplo.com","nombreUsuario":"Usuario","rol":"Cliente","plan":"Basico"}
```

El perfil debe incluir `correo` o `email`. Se admiten `nombreUsuario` / `name`, `rol` / `role`; a falta de nombre se muestra la parte inicial del correo. Solo se presenta Administrador cuando el perfil lo indica expresamente; ante un rol/plan desconocido la interfaz muestra Cliente/Básico. Los permisos de operaciones reales siempre corresponden al backend. No se deducen privilegios de la contraseña, del correo ni del formulario.

Los tokens se conservan en `sessionStorage` para recuperar la sesión de la pestaña al recargar; nunca se guardan contraseñas de API en el navegador. Una respuesta 401 intenta renovar una vez y reconsultar el perfil. Un refresh rechazado elimina la sesión local. Logout intenta cerrar la sesión en el servidor y elimina siempre los tokens locales. No existe una ruta de recuperación de contraseña en el contrato; el botón informa que todavía no está disponible.

Los favoritos permanecen locales porque el contrato no define una ruta para guardarlos. Tienda, créditos, apuestas y predicciones conservan sus datos de simulación.

## ESPN

Inicio y Resultados consultan directamente el marcador público de ESPN sin clave, usando `site.api.espn.com/apis/site/v2/sports`. El adaptador incluye Liga MX, Premier League, LaLiga, Champions, NFL y NBA. Tenis muestra falta de cobertura ESPN. En las experiencias demo se muestran encuentros ficticios de ATP en una sección separada, marcada como ejemplo. Las fechas y horarios se convierten a Ciudad de México. Se muestran escudos recibidos de ESPN, con alternativa si una imagen falla.

La página consulta cada 10 segundos cuando hay un encuentro en vivo hoy y cada minuto en los demás casos; pausa consultas mientras la pestaña esté oculta. **Esto no garantiza que un gol llegue en 10 segundos**: depende de la actualización de ESPN. El endpoint no ofrece aquí un contrato de disponibilidad, cuota ni latencia. Un error conserva la última consulta identificándola como desactualizada; un día vacío informa que ESPN no tiene encuentros. Las experiencias demo agregan 42 ejemplos aleatorios identificados, separados por fuente y sin alterar las respuestas ESPN; las cuentas API solo ven ESPN en Inicio y Resultados. No se generan momios ni probabilidades a partir de este marcador.

Para simular también el formulario y registro usa `VITE_DATA_MODE=demo`. En cualquier modo con demos habilitadas, los tres perfiles se abren con botones, se guardan en sessionStorage y pueden cambiarse desde Cambiar perfil. Estos perfiles no emiten tokens ni permisos del servidor. El registro ficticio solo conserva cuentas en memoria hasta recargar. Para datos deportivos ficticios también: `VITE_SPORTS_MODE=demo`. El archivo `../chokxen-demo.html` fuerza ambos modos de demostración para funcionar sin red.

## Comprobación

`npm test` ejecuta pruebas de solicitudes contra el contrato, renovación de sesión, fallos de acceso, registro parcial, logout y normalización de ESPN. `npm run build` compila la interfaz. Las respuestas reales de login/perfil/refresh deben verificarse con una cuenta que el usuario introduzca en el panel local; no se ha solicitado ni usado su contraseña por chat.

Última comprobación de conectividad: panel local disponible, OpenAPI real HTTP 200 y perfil sin token HTTP 401 enviando Heart. Para utilizar cuentas reales deben estar activos Tailscale y el backend.

## Encabezado Heart y bienvenida local

Cada solicitud del cliente de autenticación lleva el encabezado literal `Heart: CHOKXEN SPORT`, incluidos registro, login, perfil, refresh y logout. Las rutas protegidas siguen autenticadas por Bearer; Heart no concede roles. La integración usa el mismo cliente en móvil y escritorio. Si se configura una URL de backend en otro origen, su CORS debe admitir el origen del frontend y los encabezados `Heart`, `Authorization`, `Content-Type` y `refreshToken`. El proxy local evita solicitudes entre orígenes desde el navegador.

El contrato no declara onboarding. Tras validar `/usuarios/me`, `withLocalOnboarding` decide si hace falta la bienvenida usando preferencias locales con `completed: true`, indexadas por el correo verificado. No utiliza estos datos para cambiar rol o plan. Guardar no envía una petición nueva; Cerrar sesión llama a logout y elimina los tokens locales aunque el servidor falle. La acción está disponible en el panel de bienvenida y en Mi cuenta.
