import React, { useState } from 'react';

// Footer inspirado en el sitio oficial de TECHO (Chile), adaptado a nuestro stack (Tailwind)
// Estilo corporativo: fondo oscuro púrpura, textos claros, columnas de enlaces, CTA y franja legal.
export function FooterTecho() {
  const year = new Date().getFullYear();
  const basePublic = process.env.PUBLIC_URL || '';
  const whiteLogo = `${basePublic}/assets/techo/logo-techo-white.png`;
  const colorLogo = `${basePublic}/LOGO-TECHO-COLOR-768x768.png`;
  const [logoSrc, setLogoSrc] = useState(whiteLogo);
  const [useInvert, setUseInvert] = useState(false);
  return (
    <footer className="mt-auto bg-[#241b33] text-white/90">
      <div className="app-container py-12 relative">
        {/* Sección superior: 3 columnas de enlaces + contacto nacional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Columna 1 */}
          <div>
            <ul className="space-y-3 text-[15px]">
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/por-que-existimos/" target="_blank" rel="noreferrer">Por qué existimos</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/que-hacemos/" target="_blank" rel="noreferrer">Qué hacemos</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/sobre-techo/" target="_blank" rel="noreferrer">Sobre TECHO</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://sites.google.com/a/techo.org/chile-personas/inicio" target="_blank" rel="noreferrer">Portal de Personas</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://docs.google.com/forms/d/1MZ9g8VUa_nvfsuxhyiy-5G_zBu2Wljt_joXojIh3-PE/edit" target="_blank" rel="noreferrer">Denuncia explotación y abuso sexual</a></li>
            </ul>
          </div>
          {/* Columna 2 */}
          <div>
            <ul className="space-y-3 text-[15px]">
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/donde-estamos/" target="_blank" rel="noreferrer">Dónde estamos</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/involucrate/" target="_blank" rel="noreferrer">Involúcrate</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/alianzas/" target="_blank" rel="noreferrer">Alianzas corporativas</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/productos_solidarios" target="_blank" rel="noreferrer">Productos Solidarios</a></li>
            </ul>
          </div>
          {/* Columna 3 */}
          <div>
            <ul className="space-y-3 text-[15px]">
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/transparencia/" target="_blank" rel="noreferrer">Transparencia</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/noticias/" target="_blank" rel="noreferrer">Noticias</a></li>
              <li><a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://cl.techo.org/contacto/" target="_blank" rel="noreferrer">Contacto</a></li>
            </ul>
          </div>
          {/* Columna 4: Contacto Nacional */}
          <div>
            <h3 className="text-base font-semibold text-white mb-3">Contacto Nacional</h3>
            <ul className="space-y-3 text-[15px]">
              <li>
                <a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="mailto:info.chile@techo.org">info.chile@techo.org</a>
              </li>
              <li>
                <a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="tel:+56228387300">+56 2 2838 7300</a>
              </li>
              <li>
                <a className="text-white/90 visited:text-white/90 hover:!text-white focus:!text-white active:!text-white transition-colors" href="https://goo.gl/maps/YFa8BTAXiM29x6p37" target="_blank" rel="noreferrer">
                  Departamental #440,<br/> San Joaquín, Santiago de Chile.
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Fila intermedia: logo + redes */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Logo (filtrado a blanco) */}
          <div className="flex items-center gap-4">
            <img
              src={logoSrc}
              alt="TECHO"
              className={`h-16 w-16 sm:h-20 sm:w-20 md:h-28 md:w-28 lg:h-32 lg:w-32 object-contain select-none ${useInvert ? 'filter invert' : ''}`}
              draggable="false"
              onError={() => { setLogoSrc(colorLogo); setUseInvert(true); }}
            />
            <span className="text-white/90 text-lg md:text-2xl lg:text-3xl font-semibold tracking-wide">UN TECHO PARA CHILE</span>
          </div>
          {/* Redes */}
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
            <li>
              <a className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 !text-white visited:!text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-full" href="https://www.facebook.com/TECHOchile" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true"><path d="M22 12.06C22 6.48 17.52 2 11.94 2S1.88 6.48 1.88 12.06C1.88 17.08 5.64 21.22 10.44 22v-7.02H7.9v-2.92h2.54v-2.23c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.22.2 2.22.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.89h2.74l-.44 2.92h-2.3V22c4.8-.78 8.56-4.92 8.56-9.94Z"/></svg>
                <span className="sr-only">Facebook</span>
              </a>
            </li>
            <li>
              <a className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 !text-white visited:!text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-full" href="https://twitter.com/techochile" target="_blank" rel="noreferrer" aria-label="Twitter/X">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true"><path d="M18.244 2H21l-6.5 7.43L22 22h-6.59l-5.16-6.7L3.9 22H1.14l7.03-8.03L2 2h6.73l4.66 6.18L18.24 2Zm-2.31 18h2.1L8.16 4h-2.2l10 16Z"/></svg>
                <span className="sr-only">Twitter</span>
              </a>
            </li>
            <li>
              <a className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 !text-white visited:!text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-full" href="https://www.instagram.com/techochile/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.75-.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"/></svg>
                <span className="sr-only">Instagram</span>
              </a>
            </li>
            <li>
              <a className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 !text-white visited:!text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-full" href="https://www.linkedin.com/company/techochile/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.5 8h4V24h-4V8Zm7.5 0h3.83v2.18h.05C12.7 8.84 14.44 8 16.66 8 21.3 8 22 10.95 22 15.27V24h-4v-7.74c0-1.84-.03-4.21-2.57-4.21-2.57 0-2.96 2.01-2.96 4.09V24h-4V8Z"/></svg>
                <span className="sr-only">LinkedIn</span>
              </a>
            </li>
            <li>
              <a className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 !text-white visited:!text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-full" href="https://www.youtube.com/channel/UCbzHPJJjW8n8Y1ORPiO0jtg" target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.8 31.8 0 0 0 0 12c0 1.9.2 3.8.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-2 .5-3.9.5-5.8s-.2-3.8-.5-5.8ZM9.75 15.5V8.5l6 3.5-6 3.5Z"/></svg>
                <span className="sr-only">YouTube</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Línea inferior y franja legal */}
        <div className="mt-10 pt-6 border-t border-white/30 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 pb-16 md:pb-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-wide text-white/80">
            <a href="https://cl.techo.org/politicas-de-privacidad/" className="text-white/80 visited:text-white/80 hover:!text-white focus:!text-white active:!text-white transition-colors" target="_blank" rel="noreferrer">Políticas de privacidad</a>
            <a href="https://cl.techo.org/terminos-y-condiciones-de-uso/" className="text-white/80 visited:text-white/80 hover:!text-white focus:!text-white active:!text-white transition-colors" target="_blank" rel="noreferrer">Términos de uso</a>
            <a href="https://duplika.com/" className="text-white/80 visited:text-white/80 hover:!text-white focus:!text-white active:!text-white transition-colors" target="_blank" rel="noreferrer">Hosting por Duplika</a>
            <a href="https://girolabs.com/" className="text-white/80 visited:text-white/80 hover:!text-white focus:!text-white active:!text-white transition-colors" target="_blank" rel="noreferrer">Desarrollado por QUERY GANG</a>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-white/80">© {year} TECHO INTERNACIONAL</div>
          {/* CTA Involúcrate flotante (derecha) */}
          
          
        </div>

        {/* CTA Involúcrate responsivo (mobile, en flujo) */}
       
      </div>
    </footer>
  );
}

export default FooterTecho;
