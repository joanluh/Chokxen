# Chokxen Sport frontend

Frontend en React y Vite, creado a partir de los mockups y requisitos compartidos. Demostración con tres perfiles de acceso, partidos de ejemplo y conexión a ESPN. La publicación del sitio requiere configurar su alojamiento.

## Generar una demo independiente

Después de instalar las dependencias, ejecuta `npm run build` y `node scripts/export-demo.mjs`. Esto genera `../chokxen-demo.html` (no versionado). Abre ese archivo con un navegador moderno. Incluye la interfaz completa, React, los estilos, escudos y fotografías en un solo archivo, sin dependencias de red. Este archivo usa cuentas y marcadores de demostración; la conexión real se realiza ejecutando el proyecto React. El almacenamiento de favoritos puede variar entre navegadores cuando se abre un archivo local.

En el login pulsa **Básico**, **Premium** o **Administrador**. También puedes escribir una de estas cuentas con la contraseña ficticia `Demo123!`:

| Perfil | Correo |
| --- | --- |
| Básico | basico@chokxen.demo |
| Premium | premium@chokxen.demo |
| Administrador | admin@chokxen.demo |

## Ejecutar y editar el proyecto

Requiere Node.js 22.12 o superior. Desde esta carpeta:

```sh
npm ci --ignore-scripts
npm run dev
```

Abre la URL local que aparece en la terminal y pulsa **Básico**, **Premium** o **Administrador**. La demo no necesita backend ni Tailscale para entrar. El formulario usa cuentas reales por defecto (`VITE_DATA_MODE=api`); mantén Tailscale conectado para utilizarlo. Puedes cambiar la configuración copiando `.env.example` a `.env.local`; el backend configurado es `http://100.75.117.118:8080`. Consulta [API.md](API.md) para las rutas y configuración. En Windows también puedes ejecutar `iniciar.cmd` con doble clic.

Para compilar:

```sh
npm run build
npm run preview
```

Para actualizar la demo de un archivo después de compilar:

```sh
node scripts/export-demo.mjs
```

La carpeta `frontend/` contiene el código React. El exportador genera `chokxen-demo.html` un nivel arriba para presentar sin red; ese resultado compilado no se sube al repositorio. No se deben subir `node_modules/`, `dist/`, `.env.local` ni archivos de credenciales.

## Pantallas e interacciones

- Login, registro con validación de contraseña y correo duplicado, y selección de favoritos al registrarse.
- Inicio con partidos destacados, preferencias, actividad y accesos a las demás pantallas.
- Resultados con búsqueda, filtros por deporte, liga, día y estado, y detalle del encuentro.
- Predicciones con barras de probabilidad, marcador ilustrativo y restricción de acceso para el plan Básico.
- Simulador de apuestas con selección, importe, revisión, confirmación, saldo virtual e historial.
- Tienda con búsqueda, categoría, filtros de precio, tallas, cantidades, carrito y pedidos ficticios. Aplica precios Premium.
- Administración con búsqueda y paginación de usuarios, edición de plan y estado, alta de registros de prueba, catálogo y pedidos de prueba.
- Mi cuenta, cierre de sesión y edición de favoritos.

## Organización

```text
src/
  App.jsx                 Sesión visual, rutas, navegación y datos locales
  data.js                 Datos deportivos y catálogo de ejemplo
  styles.css              Estilos y adaptación a móviles
  visual.css              Portadas fotográficas y ajustes visuales
  mobile.css              Distribución móvil, controles táctiles y navegación inferior
  media.js                Rutas de imágenes y escudos originales
  components/
    UI.jsx                Iconos, escudos, fotografías y diálogos
    MatchCard.jsx          Tarjeta reutilizable de encuentro
  pages/
    Auth.jsx              Login, registro y onboarding
    Sports.jsx            Inicio, resultados, predicciones y simulador
    Store.jsx             Productos y carrito
    Admin.jsx             Gestión de registros de prueba
  services/
    auth.js               Selección de acceso API o demostración
    auth-client.js        Login, registro, perfil, renovación y cierre
    auth-service.js       Perfiles de prueba y selección del acceso
    demo-matches.js       Ejemplos aleatorios y composición de fuentes
    onboarding.js         Estado local de bienvenida por cuenta verificada
    espn.js               Consulta y normalización de marcadores ESPN
    useScores.js          Estado y actualización de marcadores
```

Las rutas utilizan el hash (`#/inicio`, `#/resultados`, etc.), por lo que la demo funciona sin configurar un servidor para rutas de SPA.

## Fotografías y escudos

Los archivos WebP están en `public/assets/`. Incluyen 16 escudos de equipos, fotografías deportivas y fotografías de referencia de productos de Chivas. Se muestran sin recortar los escudos; las fotografías de productos tienen vistas de detalle y tarjetas adaptadas al móvil. El exportador incrusta todas las imágenes en la demo HTML.

Consulta [FUENTES-IMAGENES.md](FUENTES-IMAGENES.md) para las procedencias y `public/assets/sources.json` para el registro de cada archivo. Inicio y Resultados presentan por separado los encuentros reales de ESPN y los ejemplos ficticios de las sesiones demo. Cada tarjeta indica su fuente. Los precios y las simulaciones son de demostración.

## Alcance de la demostración y conexión posterior

El formulario usa autenticación API y marcadores ESPN por defecto. A su lado se mantienen los tres botones de demostración (`VITE_ENABLE_DEMO=true`); configura `false` para ocultarlos en modo API. Los tres botones funcionan también en la compilación de producción, sin credenciales. El perfil elegido se recupera al recargar la misma pestaña; Cambiar perfil cierra la experiencia para seleccionar otra. Los perfiles ficticios no crean usuarios ni permisos en el servidor. El HTML independiente usa modo demo para funcionar sin red. Los precios, créditos, pedidos, administración y predicciones continúan siendo simulaciones. El backend debe comprobar los permisos de todas las operaciones reales.

En modo API se consulta `/usuarios/me` después de entrar y se recupera la sesión de la pestaña al recargar. Los tokens se guardan en sessionStorage y se eliminan al cerrar sesión. Los campos de respuesta de tokens/perfil no están definidos en OpenAPI; las variantes admitidas y la comprobación pendiente con un usuario real están documentadas en [API.md](API.md).

El registro ficticio de la demo conserva su contraseña solamente en memoria; las cuentas creadas en ese modo desaparecen al recargar. No uses contraseñas reales en la demo. Favoritos, carrito, créditos, historial y registros administrativos de prueba se guardan en localStorage con claves `chokxen:*`; los favoritos e historiales se separan por correo. No hay ruta de preferencias ni recuperación de contraseña en el contrato.

Inicio y Resultados consultan ESPN, sin clave, cada 10 segundos durante encuentros en vivo y cada minuto en los demás casos. La latencia de los goles depende de ESPN y no está garantizada. Al cargar se generan 42 ejemplos aleatorios de siete ligas entre ayer, hoy y mañana, con 14 encuentros por día. Estos ejemplos se mantienen durante las consultas ESPN, se muestran en otra sección y se pueden filtrar por fuente. Un fallo de ESPN conserva su mensaje y no convierte los ejemplos en resultados reales. Las cuentas reales solo reciben ESPN en Inicio y Resultados; los ejemplos se agregan cuando se elige un perfil de prueba. Consulta [API.md](API.md) para la cobertura y los límites de esta integración.

## Accesibilidad y móvil

Controles táctiles con mínimo de 44 px, foco visible, formularios etiquetados, mensajes de error, preferencias con estado seleccionado, diálogos nativos con foco y Escape, navegación por teclado y soporte para movimiento reducido. Se revisó la ausencia de desbordamiento horizontal en móvil. No constituye una auditoría completa de conformidad WCAG.

## Docker para desarrollo

```sh
docker compose up --build
```

Abre `http://localhost:5173`. El servicio es solo de frontend, ligado a la máquina local. Esta configuración de Docker se entrega como opción; no se ha ejecutado aquí.

## Validación realizada

Compilación de producción, navegación de las pantallas, registro a onboarding, guardado de favoritos, acceso Básico/Premium/Administrador, edición de usuario, filtro de resultados, predicciones, descuento de créditos y carrito con precio Premium y pedido de prueba. Revisión en navegador de escritorio y móvil. No se ejecutaron pruebas del backend.

Actualización visual: compilación de producción, carga de fotografías y escudos, inicio y tienda a 1440 px, revisión de desbordamiento a 390 y 320 px, predicciones y fotografía de producto en diálogo móvil. Las imágenes se incluyen en la demo para uso sin conexión.

Actualización de acceso y ESPN: 21 pruebas automatizadas, compilación y prueba en navegador de login incorrecto/correcto, perfil, recuperación de sesión al recargar, logout, registro, confirmación de contraseña y onboarding con servidor local simulado. Se comprobó la disponibilidad del OpenAPI real por Tailscale y la protección del perfil sin token. No se crearon cuentas de prueba en ese backend; falta comprobar una sesión real con las credenciales que introduzca el usuario.


## Ajuste móvil basado en US-06 y US-07

La vista de hasta 760 px apila el contenido: acceso con portada compacta, cinco destinos de navegación inferior sin carrusel, filtros desplegables con cierre, partidos con equipos y marcador en una fila completa y acciones debajo. Ayuda y Administración siguen accesibles desde Mi cuenta en móvil. En pantallas de hasta 420 px la tienda y la selección de favoritos usan una columna; el carrito y los diálogos se acomodan al ancho disponible. La tabla administrativa se presenta como tarjetas.

Los controles de acciones tienen al menos 44 px, los campos de texto usan 16 px para evitar el zoom automático de iOS y la navegación respeta el área segura de la pantalla. Los radios de plan dejan de heredar los 52 px de altura de los campos de texto. El botón principal móvil tiene contraste calculado de 5.10:1 entre texto blanco y fondo, y la navegación activa 6.39:1. Esto no constituye una auditoría completa de WCAG AA.

Validación de este ajuste: compilación de producción y comprobación de los archivos servidos por Vite. La revisión visual nueva en navegador no pudo ejecutarse porque la herramienta de navegador falló al arrancar su entorno. Las capturas anteriores de esta carpeta corresponden a la versión previa. Para comprobarla, recarga el panel local y revisa login, registro, inicio, resultados, predicciones, apuestas, tienda y Mi cuenta a 320, 390 y 760 px; confirma que la navegación inferior no tape la última acción ni el aviso.

## Última revisión de la demo

30 pruebas automatizadas aprobadas y compilación de producción correcta. Incluyen acceso a los tres perfiles sin backend, restauración y cambio de experiencia, separación de cuentas reales, generación de encuentros, fechas, IDs únicos y conservación de las respuestas ESPN. La herramienta de navegador no pudo iniciar su entorno para una nueva comprobación visual; las capturas anteriores no prueban este ajuste. El servidor local se inicia en `http://127.0.0.1:5173/`.

## Login y onboarding según el contrato FastAPI

El formulario real envía login como `application/x-www-form-urlencoded`, registro como JSON y consulta `/usuarios/me` antes de permitir la entrada. Todas las solicitudes al backend llevan `Heart: CHOKXEN SPORT`; las rutas protegidas también llevan `Authorization: Bearer ...`, y refresh conserva `refreshToken`. El encabezado Heart identifica el frontend y no sustituye la comprobación del token.

Una cuenta verificada sin bienvenida completada en este navegador abre el panel de selección de equipos y ligas. Guardar y continuar conserva `{ teams, leagues, completed: true }` por correo; no llama a un endpoint de onboarding inexistente. La recarga recupera ese estado después de verificar el perfil. El panel muestra Sesión verificada y permite Cerrar sesión incluso antes de guardar favoritos. Escritorio y móvil usan los mismos componentes y servicio de autenticación; el móvil apila el encabezado, la acción de cierre y las preferencias.

Validación de este cambio: 36 pruebas automatizadas y compilación de producción aprobadas. Backend real `/openapi.json`: HTTP 200; `/api/v1/usuarios/me` con Heart y sin token: HTTP 401, como corresponde. No se crearon usuarios ni se introdujeron credenciales reales. Los esquemas exitosos de OpenAPI siguen vacíos: falta comprobar la forma de token y perfil con una cuenta real. La herramienta de navegador falló al iniciar su entorno, por lo que la nueva revisión visual sigue pendiente.

## Integración actual con main

Consulta [la comprobación integrada](../docs/integracion-login.md), que reemplaza las limitaciones anteriores sobre respuestas de perfil y favoritos. El login lee el perfil anidado en `usuario`; equipos, ligas, jugadores, favoritos, búsqueda y detalles usan las rutas actuales del backend. Hay 53 pruebas frontend y 14 backend aprobadas. El destino local predeterminado es `http://127.0.0.1:8080`; la IP de Tailscale puede configurarse con BACKEND_URL.
