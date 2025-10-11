import React from 'react'

/**
 * ReportFab
 * Botón flotante para reportar problema. Estilo tipo “Involúcrate” (píldora horizontal)
 * con acento púrpura y flecha, inspirado en el call-to-action de TECHO.
 */
export function ReportFab({ onClick, disabled, label = 'Reportar', href }) {
  const classes = "group fixed bottom-6 right-6 inline-flex items-center gap-2 px-5 md:px-6 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold tracking-wide shadow-elevated disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-400";
  const content = (
    <>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">+</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden>
        <path fillRule="evenodd" d="M3 10a1 1 0 0 1 1-1h9.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 1 1-1.414-1.414L13.586 11H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
      </svg>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={label}
        title={label}
      >
        {content}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={label}
      title={label}
    >
      {content}
    </button>
  )
}
