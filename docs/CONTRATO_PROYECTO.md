# Contrato del Proyecto TransmoviWebApp

Este documento formaliza lo que ya está establecido en el proyecto para mantener coherencia funcional, técnica y de seguridad.

## 1) Alcance del contrato
Aplica a toda funcionalidad visible en menú, rutas asociadas y control por permisos.

Artefactos normativos:
- `src/app/layouts/sidebar/menu.ts`
- `src/app/layouts/sidebar/menu.model.ts`
- `src/app/entities/Enums/permiso.enum.ts`

## 2) Contrato funcional (navegación)
1. Toda opción navegable del sistema debe definirse con un `MenuItem` válido.
2. Toda entrada con `link` debe tener módulo/página operativa en su ruta.
3. Toda agrupación con `subItems` debe representar una capacidad de negocio coherente.
4. Los títulos (`isTitle`) son organización visual y no deben usarse para lógica de permisos.

## 3) Contrato de seguridad (permisos)
1. Ninguna opción funcional debe quedar sin permiso cuando su acceso sea restringido.
2. La visibilidad de módulos y submódulos debe depender de `permiso`.
3. Los permisos se declaran de forma centralizada en `Permiso` (enum).
4. Para nuevas entidades, se mantiene el patrón mínimo:
   - `Listado_*`
   - `Crear_*`
   - `Actualizar_*`
   - `CambiarEstatus_*`
5. Para secciones agrupadoras del menú, usar permisos `Desplegable_*` cuando aplique.

## 4) Contrato de rutas
1. Cada `link` del menú debe corresponder a una ruta válida del proyecto.
2. No deben existir rutas productivas huérfanas (sin posibilidad de acceso según diseño funcional).
3. Los nombres de rutas deben mantenerse estables para evitar regresiones de navegación.

## 5) Contrato de consistencia entre capas
Todo cambio funcional debe estar alineado en tres capas:
1. **UI/Navegación**: alta/ajuste de item en `MENU`.
2. **Autorización**: alta/ajuste de permiso en `Permiso`.
3. **Módulo/Ruta**: alta/ajuste de componente, módulo y ruta.

Un cambio no se considera completo si falta una de estas capas.

## 6) Convenciones de cambios
Cuando se agregue una nueva opción funcional:
1. Definir permiso en `permiso.enum.ts`.
2. Crear/actualizar ruta y pantalla.
3. Agregar entrada en `menu.ts` con:
   - `label` claro,
   - `link` correcto,
   - `permiso` correspondiente.
4. Validar comportamiento con usuario sin permiso y con usuario autorizado.

Cuando se retire una opción:
1. Eliminar entrada del menú.
2. Revisar uso del permiso y de la ruta.
3. Documentar impacto en este contrato/contexto.

## 7) Criterios de aceptación (Definition of Done)
Se considera correcto un cambio de módulo cuando:
- El módulo aparece/oculta según permiso.
- La navegación llega a la ruta esperada sin errores.
- El permiso usado pertenece al enum y no está hardcodeado.
- No se rompe la estructura de secciones existentes:
  - Coordinación,
  - Administración,
  - Configuración,
  - Operación,
  - Reportes.

## 8) Exclusiones y notas
- IDs de `MenuItem` pueden requerir revisión por duplicados; este contrato no redefine IDs históricos.
- Comentarios de funcionalidades desactivadas en `menu.ts` se consideran fuera de alcance hasta su reactivación formal.

## 9) Mantenimiento del contrato
Este archivo y `docs/CONTEXTO_PROYECTO.md` deben actualizarse en cada cambio estructural de:
- menú,
- permisos,
- dominios funcionales principales.
