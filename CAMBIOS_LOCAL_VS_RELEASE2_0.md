# Cambios: release2_0 (rama) vs código local (working copy)

Comparación entre el commit actual de la rama **release2_0** y el **working copy** (código en disco, incluyendo cambios sin commitear).  
Generado con `git diff release2_0 --numstat`.

---

## Ficheros modificados (26)

| Fichero | +líneas | −líneas | Tipo de cambio (local respecto a release2_0) |
|---------|--------:|--------:|---------------------------------------------|
| `components/dashboard/PropertySetupWizard.tsx` | 494 | 261 | **Grande:** mucho más código en local (nuevos pasos, estado, handlers, integración con Step*). |
| `components/dashboard/steps/StepAcceso.tsx` | 125 | 31 | Ampliación: geocodificación, validación, alertas, TransportInfo con progreso/regenerar. |
| `components/dashboard/steps/StepBranding.tsx` | 159 | 226 | Refactor: menos líneas netas; temas base, harmonizer, ThemePreviewCard, logo. |
| `lib/supabase/server.ts` | 75 | 25 | Más lógica en local (helpers, creación de cliente/servidor o cookies). |
| `components/dashboard/steps/StepInfoBasica.tsx` | 131 | 134 | Refactor: orden imagen/grid/descripción, labels, h-11; tamaño similar. |
| `components/dashboard/steps/StepContacts.tsx` | 64 | 29 | Ampliación: IA, sync teléfono a check-in, hasAddress. |
| `components/dashboard/steps/StepInventory.tsx` | 28 | 19 | Pequeña ampliación/ajuste. |
| `components/dashboard/steps/StepCheckin.tsx` | 18 | 10 | Pequeña ampliación. |
| `components/dashboard/steps/StepRules.tsx` | 17 | 10 | Pequeña ampliación. |
| `components/dashboard/steps/StepWelcome.tsx` | 17 | 10 | Pequeña ampliación. |
| `components/dashboard/steps/StepWifi.tsx` | 17 | 10 | Pequeña ampliación. |
| `app/layout.tsx` | 12 | 21 | Menos líneas en local (simplificación o reordenación). |
| `app/globals.css` | 13 | 12 | Ajustes de estilos. |
| `app/auth/login/page.tsx` | 13 | 1 | Ampliación en login. |
| `components/dashboard/WizardStepper.tsx` | 16 | 16 | Sustitución de lógica/estilos (mismo tamaño). |
| `components/dashboard/SetupHeader.tsx` | 16 | 14 | Pequeña ampliación. |
| `scripts/README.md` | 20 | 0 | Solo añadidos (documentación). |
| `middleware.ts` | 12 | 57 | **Menos código en local:** simplificación o eliminación de rutas/checks. |
| `app/api/auth/callback/route.ts` | 5 | 4 | Ajuste en callback de auth. |
| `app/dashboard/properties/[id]/setup/page.tsx` | 5 | 5 | Sustitución (misma longitud). |
| `components/properties/PropertyCard.tsx` | 5 | 5 | Sustitución (misma longitud). |
| `app/auth/callback/page.tsx` | 2 | 1 | Pequeño cambio. |
| `components/dashboard/PropertySetupHub.tsx` | 9 | 2 | Pequeña ampliación. |
| `components/dashboard/QuickStartStepper.tsx` | 3 | 3 | Sustitución. |
| `components/dashboard/SetupCard.tsx` | 1 | 1 | Cambio mínimo. |
| `app/dashboard/properties/new/page.tsx` | 1 | 1 | Cambio mínimo. |
| `public/sw.js` | 4 | 52 | **Menos código en local:** service worker reducido o simplificado. |

---

## Ficheros solo en local (untracked)

Existen en disco pero no están en la rama release2_0 (no entran en el diff):

- `CAMBIOS_MAIN_VS_RELEASE2_0.md`
- `_main_stepper.txt`, `_main_wizard.txt`, `_step_main.txt`, `_wizard_main.txt`
- `env.local`
- `proxy.ts`

---

## Resumen por categoría

- **Wizard y steps:** En local hay más funcionalidad (geocodificación, IA, temas, validaciones, progreso) y refactor en StepBranding y StepInfoBasica.
- **Auth:** Cambios pequeños en callback y login; más líneas en la página de login en local.
- **Supabase:** Más lógica en `server.ts` en local.
- **Middleware y service worker:** Menos código en local (simplificación).
- **Layout y estilos:** Menos líneas en layout, ajustes en `globals.css`.
- **Documentación:** Solo añadidos en `scripts/README.md`.
