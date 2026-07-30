import { useState, useEffect } from 'react';
import { THEFORK } from '../lib/constants';

const LINKS = [
  { href: '#historia', label: 'Historia' },
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#restaurante', label: 'Restaurante' },
  { href: '#arroces', label: 'Carta' },
  { href: '#llegar', label: 'Cómo llegar' },
  { href: '/eventos', label: 'Eventos' },
];

export default function Nav({ logoSrc }: { logoSrc: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    // Al volver mediante el boton "atras", el navegador puede restaurar la
    // pagina desde la bfcache a mitad de la transicion de cierre del menu.
    // Forzamos que quede cerrado para evitar que se vea a medio animar.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) setMenuOpen(false);
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`hd${scrolled ? ' scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}>
      <a className="brand" href="/">
        <img src={logoSrc} alt="El Meu Foc" />
        <span className="bn">El Meu Foc</span>
      </a>
      <div className="hd-right">
        <nav className="nav">
          {LINKS.map((l) => (
            <a key={l.href} className="lnk" href={l.href} onClick={closeMenu}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn" href={THEFORK} target="_blank" rel="noopener noreferrer">
          Reservar mesa <span className="ar">→</span>
        </a>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
