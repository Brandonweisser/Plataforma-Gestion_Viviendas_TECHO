import React from 'react'
import { createPortal } from 'react-dom'

/**
 * ReportFab
 * Botón flotante para reportar problema. Estilo tipo “Involúcrate” (píldora horizontal)
 * con acento púrpura y flecha, inspirado en el call-to-action de TECHO.
 */
export function ReportFab({
  onClick,
  disabled,
  label = 'Reportar',
  href,
  className = '',
  animate = false,
  fixed = true,
  variant = 'techo', // 'techo' | 'default'
  side = 'right', // 'right' | 'left'
  offset = 24, // px
  zIndex = 40,
  autoHideOnScroll = false,
  hideDirection = 'down', // 'down' | 'up'
  scrollDelta = 12, // px mínimos para considerar cambio de dirección
  showOnIdle = true,
  idleMs = 350 // tiempo sin scroll para reaparecer
}) {
  const animation = animate ? 'motion-safe:animate-bounce' : ''
  const [hiddenByScroll, setHiddenByScroll] = React.useState(false)
  const lastYRef = React.useRef(typeof window !== 'undefined' ? window.scrollY : 0)

  React.useEffect(() => {
    if (!autoHideOnScroll) return
    let ticking = false
    let idleTimer = null
    const onScroll = () => {
      const y = window.scrollY || 0
      const last = lastYRef.current
      const diff = Math.abs(y - last)
      if (diff < scrollDelta) return
      const goingDown = y > last
      lastYRef.current = y
      const shouldHide = (hideDirection === 'down' ? goingDown : !goingDown)
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHiddenByScroll(shouldHide)
          ticking = false
        })
        ticking = true
      }
      // Reaparecer tras inactividad
      if (showOnIdle) {
        if (idleTimer) window.clearTimeout(idleTimer)
        idleTimer = window.setTimeout(() => {
          setHiddenByScroll(false)
        }, idleMs)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (idleTimer) window.clearTimeout(idleTimer)
    }
  }, [autoHideOnScroll, hideDirection, scrollDelta, idleMs, showOnIdle])
  const base = [
    'group',
    'inline-flex items-center gap-2 px-6 h-12 rounded-full',
    'font-semibold tracking-wide',
    'disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    animation
  ]
  const look = variant === 'techo'
    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white hover:brightness-105 focus-visible:ring-purple-300 ring-1 ring-white/50 shadow-lg shadow-purple-500/30 hover:shadow-xl transition-transform hover:-translate-y-0.5'
    : 'bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-400 shadow-elevated'
  const sideClass = side === 'left' ? 'left-6' : 'right-6'
  const positioning = fixed ? `fixed bottom-6 ${sideClass} z-50` : ''
  const hideAnim = hiddenByScroll ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
  const classes = [
    base.join(' '), look, positioning,
    'transition-transform duration-300 ease-out will-change-transform', hideAnim,
    className
  ].filter(Boolean).join(' ')
  const style = fixed ? { position: 'fixed', bottom: offset, [side]: offset, zIndex } : undefined
  const content = (
    <>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">+</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden>
        <path fillRule="evenodd" d="M3 10a1 1 0 0 1 1-1h9.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L13.586 11H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
      </svg>
    </>
  );
  const AnchorOrButton = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      style={style}
      aria-label={label}
      title={label}
    >
      {content}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={style}
      aria-label={label}
      title={label}
    >
      {content}
    </button>
  )

  // Cuando es fijo, inyectar en body para evitar clipping por overflow/transform de ancestros
  if (fixed && typeof document !== 'undefined' && document.body) {
    return createPortal(AnchorOrButton, document.body)
  }
  return AnchorOrButton
}
