# Frontend Chokxen

El frontend vive en `frontend/`, al mismo nivel que `backend/` y `database/`.

## Carpetas

| Ruta | Contenido |
| --- | --- |
| `frontend/src/pages/` | Acceso, onboarding, deportes, tienda y administración |
| `frontend/src/components/` | Controles, diálogos, escudos y tarjetas |
| `frontend/src/services/` | Autenticación, estado de bienvenida, ESPN y ejemplos |
| `frontend/public/assets/` | Escudos y fotografías originales |
| `frontend/contracts/` | Contrato OpenAPI suministrado |
| `frontend/tests/` | Pruebas de autenticación, onboarding y marcadores |
| `frontend/scripts/` | Exportador opcional de demo independiente |

## Acceso y bienvenida

Login envía formulario URL encoded; registro envía JSON con rol Cliente. Tras recibir un token, se verifica `/api/v1/usuarios/me` antes de abrir la cuenta. El cliente añade `Heart: CHOKXEN SPORT` y conserva Bearer en las rutas protegidas. Heart identifica al frontend; los permisos reales corresponden al backend.

Una cuenta sin bienvenida completada en este navegador abre la selección de equipos y ligas. Las preferencias y su estado de finalización se guardan por correo localmente; no se llama a un endpoint de onboarding. El botón Cerrar sesión aparece tanto en la bienvenida como en Mi cuenta.

Los tres botones de demo usan perfiles ficticios y funcionan sin backend. Para ocultarlos en modo API usa `VITE_ENABLE_DEMO=false`; para simular también el formulario usa `VITE_DATA_MODE=demo`. El formulario real es el predeterminado.

## Móvil y datos deportivos

El diseño apila contenidos, adapta formularios y preferencias, usa navegación inferior de cinco destinos y controles táctiles. Escritorio y móvil comparten el mismo cliente API.

ESPN se consulta cada 10 segundos durante encuentros en vivo y cada minuto en los demás casos. La actualización depende de la fuente. Los perfiles demo agregan 42 encuentros ficticios elegidos al cargar, separados de ESPN y filtrables por fuente.

## Validación

36 pruebas automatizadas y compilación de producción aprobadas antes de la integración. El backend respondió en OpenAPI y rechazó el perfil sin token. La sesión real sigue pendiente de comprobar con credenciales introducidas por el usuario; los esquemas de respuesta exitosos no están definidos en OpenAPI. La herramienta de navegador no pudo arrancar para la nueva revisión visual.

Más detalles: [configuración API](../frontend/API.md), [README del frontend](../frontend/README.md) y [procedencia de imágenes](../frontend/FUENTES-IMAGENES.md).

Dependencias: Vite actualizado a 7.3.7; npm audit sin vulnerabilidades reportadas al integrar.
