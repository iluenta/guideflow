# Cambios entre origin/main y release2_0 (excl. Step*, Setup*, PropertySetupHub, Requisitos/Fase 16)

Archivos del **resto del proyecto** que tienen diferencias y tipo de cambio.

---

## Resumen por fichero

| Fichero | Líneas añadidas | Líneas eliminadas | Tipo de cambio |
|---------|-----------------|-------------------|----------------|
| **app/api/auth/callback/route.ts** | 2 | 9 | Menos código en release2_0 (simplificación o eliminación de lógica). |
| **app/dashboard/properties/[id]/setup/page.tsx** | 5 | 5 | Sustitución de lógica (mismo tamaño, contenido distinto). |
| **components/dashboard/InventorySelector.tsx** | 6 | 1 | Pequeña ampliación en release2_0. |
| **components/dashboard/PropertySetupWizard.tsx** | 379 | 2130 | **Grande:** en release2_0 hay mucho menos código; en main el wizard está todo inline (Tabs + contenido por paso). |
| **components/guide/BottomNav.tsx** | 17 | 8 | Más código en release2_0 (nuevas opciones o estilos). |
| **components/guide/Fase11Home.tsx** | 95 | 85 | Refactor/ajustes: ~igual líneas, contenido cambiado. |
| **components/guide/GuideViewContainer.tsx** | 12 | 0 | Solo añadidos en release2_0. |
| **components/guide/HamburgerMenu.tsx** | 34 | 14 | Ampliación en release2_0. |
| **components/guide/HouseInfoView.tsx** | 3 | 0 | Pequeño añadido en release2_0. |
| **components/guide/ManualsView.tsx** | 1 | 0 | Cambio mínimo. |
| **components/guide/MenuGrid.tsx** | 86 | 47 | Ampliación neta en release2_0 (más funcionalidad o bloques). |
| **components/properties/PropertyCard.tsx** | 1 | 1 | Cambio mínimo (sustitución de una línea). |
| **lib/maps/overpass.ts** | 21 | 7 | Ampliación en release2_0. |
| **lib/supabase/client.ts** | 1 | 7 | Menos código en release2_0 (simplificación o eliminación). |
| **lib/supabase/server.ts** | 9 | 35 | Menos código en release2_0 (menos lógica o opciones en servidor). |
| **middleware.ts** | 57 | 12 | Más lógica en release2_0 (middleware ampliado). |

---

## Tipo de cambios (resumido)

- **PropertySetupWizard.tsx**: En **main** el wizard es un solo archivo con Tabs y todo el contenido por paso. En **release2_0** ese contenido se reparte en Step* y otros componentes, por eso main tiene muchas más líneas en este fichero.
- **Auth/callback y Supabase (client/server)**: En **release2_0** hay menos código (posible simplificación de auth o de creación de cliente/servidor).
- **Guía (guide/)**: En **release2_0** hay más código en BottomNav, GuideViewContainer, HamburgerMenu, MenuGrid y Fase11Home (nuevas opciones o refactor).
- **middleware.ts**: En **release2_0** hay bastante más lógica (nuevas comprobaciones o rutas).
- **Setup page**: Mismo tamaño aproximado; cambio de implementación (qué componente usa para el setup).
- **InventorySelector, PropertyCard, HouseInfoView, ManualsView**: Cambios pequeños (pocas líneas).
- **overpass.ts**: Más código en release2_0 (más uso de mapas/Overpass).

---

## Excluidos (no contados aquí)

- Toda la carpeta **Requisitos/Fase 16/** (solo en release2_0).
- **PropertySetupHub.tsx**, **QuickStartStepper.tsx**, **SetupCard.tsx**, **SetupHeader.tsx** (solo en release2_0).
- **components/dashboard/steps/Step*.tsx** (solo en release2_0; en main ese contenido está dentro de PropertySetupWizard).
