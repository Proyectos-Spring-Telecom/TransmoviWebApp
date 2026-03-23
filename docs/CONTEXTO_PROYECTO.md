# Contexto del Proyecto TransmoviWebApp

## 1) Propósito funcional
`TransmoviWebApp` es una aplicación web administrativa orientada a la operación de transporte, configuración de recursos y consulta de reportes.  
El menú lateral en `src/app/layouts/sidebar/menu.ts` representa el mapa funcional actual del sistema y define qué módulos ve cada usuario según permisos.

## 2) Base de referencia de navegación
La estructura de navegación se construye con `MENU: MenuItem[]` y cada entrada puede incluir:
- `label`: nombre visible en UI.
- `link`: ruta navegable.
- `subItems`: agrupación de opciones hijas.
- `isTitle`: separador/cabecera visual.
- `permiso`: permiso requerido para visualizar/acceder.

Modelo base: `src/app/layouts/sidebar/menu.model.ts`.

## 3) Dominios funcionales actuales (según menú)

### 3.1 Coordinación
- `Dashboard` (`/`) con permiso `Consultar_Dashboard`.

### 3.2 Administración
- `Módulos`, `Permisos`, `Roles`, `Tipo Pasajero`, `Bitácora`.
- Controlados por permiso de agrupador: `Desplegable_Administracion`.

### 3.3 Configuración
- `Usuarios`, `Clientes`, `Dispositivos`, `Bluevox`, `Vehículos`, `Operadores`, `Instalaciones`, `Pasajeros`, `Perfil`.
- Enfocado en catálogos y mantenimiento de entidades operativas.

### 3.4 Operación
- `Centro de Pagos`:
  - `Punto de Venta`, `Monederos`, `Transacciones`.
- `Gestión de Viajes`:
  - `Regiones`, `Rutas`, `Derroteros`, `Tarifas`, `Viajes`.
- `Monitoreo`, `Turnos`, `Bitácora de Viajes`.
- `Gestión Vehícular`:
  - `Mantenimiento`, `Verificaciones`, `Incidentes`, `Talleres`.

### 3.5 Reportes
- `Historial de Posiciones`.
- Recaudaciones:
  - `Día`,
  - `Operador`,
  - `Vehículo`,
  - `Dispositivo/Instalación`.

## 4) Contexto de seguridad y control de acceso
La autorización funcional está centralizada en `src/app/entities/Enums/permiso.enum.ts`.

Patrón observado:
- Permisos por entidad con acciones tipo `Listado`, `Crear`, `Actualizar`, `CambiarEstatus`.
- Permisos de consulta (`Consultar_*`) para módulos de monitoreo/reportes.
- Permisos de desplegable (`Desplegable_*`) para habilitar grupos del menú.

## 5) Contexto técnico base
- Framework: Angular (proyecto generado con Angular CLI).
- Frontend administrativo con navegación por rutas.
- El menú lateral y los permisos funcionan como contrato implícito entre:
  1. UI (navegación),
  2. Autorización (enum de permisos),
  3. Módulos/páginas disponibles.

## 6) Principios de evolución del proyecto (estado actual)
- Cada nueva capacidad funcional debe reflejarse en:
  - ruta,
  - permiso,
  - opción de menú (cuando aplique).
- Las secciones del menú son la vista de alto nivel del alcance funcional en producción.
- Los reportes y módulos operativos se habilitan por permisos explícitos, no por visibilidad fija.

## 7) Fuentes de verdad actuales
- Navegación: `src/app/layouts/sidebar/menu.ts`.
- Tipo de item de menú: `src/app/layouts/sidebar/menu.model.ts`.
- Catálogo de permisos: `src/app/entities/Enums/permiso.enum.ts`.
