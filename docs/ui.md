# Guía de Diseño UI / Beneficiario

Este documento resume la nueva capa visual aplicada al Home del Beneficiario inspirada en la identidad de TECHO Chile.

## Objetivos
- Claridad y jerarquía visual.
- Accesibilidad (contraste, focus visible, semántica HTML5, reducción de motion).
- Componentización para escalabilidad.
- Colores institucionales consistentes.

## Tokens Principales
Definidos en `tailwind.config.js` y expuestos como utilidades Tailwind.

| Token | Uso | Ejemplo |
|-------|-----|---------|
| `techo.blue.500/600/700` | Marca primario / enlaces / énfasis | Botones primarios |
| `techo.cyan.*` | Gradientes / fondos suaves | Encabezados hero |
| `techo.accent.500` | Estados positivos / badges | Badge "Activa" |
| `techo.gray.[50-900]` | Tipografía y fondos neutrales | Texto, bordes |

Variables CSS añadidas en `index.css` (root):
- `--color-bg-page`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-brand`
- `--color-brand-accent`

## Componentes UI
Ubicación: `src/components/ui/`

### `ActionCard`
Tarjeta para acciones principales (acceso rápido). Props:
- `title`, `description`, `badge`, `urgent`, `onClick`, `icon`.
- Aplica estilos de elevación + estado URGENTE con pulso.

### `StatCard`
Indicador compacto para métricas clave.
Props: `icon`, `label`, `value`, `subtitle`.

### `SectionPanel`
Contenedor seccionado reutilizable con barra superior y contenido.
Props: `title`, `description`, `actions`, `as`.

## Patrón de Layout
- Wrapper: clase utilitaria `app-container` (máximo 7xl + padding responsivo).
- Landmarks: `<header>`, `<main>`, `<section>`, `<footer>`.
- Grid: secciones primarias (stats, acciones, reportes, info vivienda) separadas en columnas adaptables.

## Accesibilidad
- Focus visible: anillos configurados con `focus-visible:outline-none` y ring de marca.
- Roles ARIA mínimos (no redundantes). Etiquetas `aria-label` en secciones críticas.
- Contraste: ratio mínimo ≥ 4.5:1 en botones primarios y texto sobre fondos.
- Listas: semántica nativa (`<ul>`/`<li>`). Labels en listas de reportes.
- Soporte preferencia de esquema de color (modo oscuro placeholder) y reduced motion (pendiente si se amplía animación).

## Gradientes y Efectos
- Clase `text-gradient-brand` para títulos destacados.
- Fondo general suave: `bg-gradient-to-b` combinando azul claro y blanco.
- Sombras definidas: `shadow-soft`, `shadow-elevated`.

## Cómo extender
1. Crear nuevo componente en `ui/` reutilizando tokens.
2. Evitar estilos inline pesados; preferir utilidades Tailwind.
3. Añadir variantes de badge en `index.css` si se requieren nuevos estados.

## Próximos pasos sugeridos
- Implementar modo oscuro completo usando los mismos tokens.
- Extraer sistema de iconografía consistente (lib como Heroicons).
- Añadir test visual (Storybook) para componentes UI.
- Integrar internacionalización (i18n) para textos fijos.

---
Cualquier duda o mejora futura puede documentarse aquí para mantener coherencia visual.
