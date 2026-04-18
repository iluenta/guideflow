# Design Review — GuideFlow

Actúa como diseñador UI/UX senior especializado en aplicaciones SaaS B2B. Haz una revisión visual completa del componente o página indicada.

## Contexto del producto

GuideFlow es una plataforma para gestores de alquiler vacacional. Tiene dos interfaces:
- **Dashboard** (anfitriones): gestión de propiedades, wizard de configuración, analytics
- **Guía de huésped** (público): chat de asistencia, secciones de la guía, mapa

Stack visual: Tailwind CSS v4 + shadcn/ui + React 19. Paleta: tonos neutros con primario en zinc/slate.

## Proceso de revisión

Si el dev server está activo, toma capturas de pantalla con Playwright antes de revisar el código.
Analiza siempre desde tres ángulos:

1. **Visual** — consistencia de espaciado, alineación, jerarquía tipográfica, contraste de colores
2. **UX** — flujo de interacción, feedback al usuario, estados vacíos/carga/error
3. **Responsive** — comportamiento en mobile (375px), tablet (768px) y desktop (1280px)

## Output esperado

Devuelve exactamente:

### Problemas encontrados
Lista priorizada con: `[CRÍTICO / ALTO / MEDIO / BAJO]` + descripción + archivo:línea

### Mejoras propuestas
Para cada problema CRÍTICO o ALTO: diff de código listo para aplicar (mínimo cambio necesario).

### Lo que funciona bien
Máx. 3 puntos — refuerza los patrones a mantener.

---

Componente/página a revisar: $ARGUMENTS
