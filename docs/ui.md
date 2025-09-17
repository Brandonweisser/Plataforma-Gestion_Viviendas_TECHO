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

## Variantes por Rol (Administrador / Técnico / Beneficiario)

Se reutiliza el mismo sistema de componentes con acentos de color para diferenciar contexto funcional sin romper consistencia.

### Colores de Acento
Usados vía prop `accent` en `StatCard` y `ActionCard`:
- `blue` (administración / usuarios)
- `green` (viviendas / estado positivo)
- `orange` (incidencias / técnico operativo)
- `red` (crítico / urgente)
- `purple` (analítica / reportes ejecutivos)
- `indigo` (configuración / parámetros avanzados)
- `cyan` (asignaciones / coordinación)
- `teal` (comunicación / interacción)

### Ejemplos
```
<StatCard icon={<UsersIcon />} label="Total Usuarios" value="125" accent="blue" />
<ActionCard title="Incidencias Críticas" urgent accent="red" ... />
<SectionPanel title="Incidencias Urgentes" variant="highlight">...</SectionPanel>
```

### Modo Oscuro
- Se controla con `localStorage('theme')` y la clase raíz `dark`.
- Cada página de dashboard incluye un botón toggle (Sun/Moon heroicons).
- Componentes utilizan utilidades `dark:*` y variantes suaves (`bg-<color>-500/15`).

### Accesibilidad Adicional
- Listas de actividad e incidencias usan `<ul>` + `<li>` con `aria-label` en contenedores críticos.
- Badges de prioridad con contraste y tamaños mínimos (11px) manteniendo legibilidad.
- Uso de `time` para marcas temporales.

### Extensión Rápida a Nuevos Roles
1. Definir acento principal (ej: coordinación => `accent="cyan"`).
2. Reutilizar `StatCard` y `ActionCard` pasando `accent` adecuado.
3. Para panel destacado usar `SectionPanel variant="highlight"` (aplica gradiente y barra vertical).
4. Agregar toggle de tema si la vista no hereda layout global.

---
Actualizado: Roles Admin y Técnico integrados con sistema (sept 2025).

## Layout Global
`DashboardLayout` centraliza cabecera (título, subtítulo, usuario, toggle tema y logout), área principal y pie de página.

Uso:
```
<DashboardLayout
	title="Panel Técnico"
	subtitle="Área de trabajo operativo"
	user={user}
	onLogout={handleLogout}
	accent="orange"
>
	{...contenido...}
</DashboardLayout>
```

Beneficios:
- Unifica espaciados verticales (`space-y-10`).
- Gestiona modo oscuro vía `ThemeContext`.
- Facilita añadir breadcrumbs o global actions en el futuro.

## PriorityBadge
Componente para mostrar prioridades con colores consistentes dark/light.

Props: `level` ('Alta'|'Media'|'Baja'), `small` (boolean).

Ejemplo:
```
<PriorityBadge level="Alta" />
<PriorityBadge level="Media" small />
```

Mapeo de colores:
- Alta: rojo semántico.
- Media: amarillo.
- Baja: verde.

## ThemeContext
Encapsula `theme` y `toggleTheme`; aplica clase `dark` al `<html>` y persiste en `localStorage`.
Se envuelve la app en `<ThemeProvider>` (ver `ThemeContext.jsx`).

---
Cualquier duda o mejora futura puede documentarse aquí para mantener coherencia visual.
