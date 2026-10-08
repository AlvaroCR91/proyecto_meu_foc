import { useState, useEffect } from 'react';
import { THEFORK } from '../lib/constants';
import type { Lang } from '../i18n/ui';
import { t, localePath } from '../i18n/utils';
import LangSwitch from './LangSwitch';

function getLinks(lang: Lang) {
  const tr = t(lang);
  return [
    { href: '#historia', label: tr('nav.historia') },
    { href: '#especialidades', label: tr('nav.especialidades') },
    { href: '#restaurante', label: tr('nav.restaurante') },
    { href: '#arroces', label: tr('nav.carta') },
    { href: '#llegar', label: tr('nav.llegar') },
    // eventos solo existe en español
    { href: '/eventos', label: tr('nav.eventos') },
  ];
}

interface NavProps {
  logoSrc: string;
  lang: Lang;
  esHref: string;
  enHref: string;
}

export default function Nav({ logoSrc, lang, esHref, enHref }: NavProps) {
  const tr = t(lang);
  const links = getLinks(lang);
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
      <a className="brand" href={localePath(lang, '/')}>
        <img src={logoSrc} alt="El Meu Foc" />
        <span className="bn">El Meu Foc</span>
      </a>
      <div className="hd-right">
        <nav className="nav">
          {links.map((l) => (
            <a key={l.href} className="lnk" href={l.href} onClick={closeMenu}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn" href={THEFORK} target="_blank" rel="noopener noreferrer">
          {tr('nav.reservar')} <span className="ar">→</span>
        </a>
        <LangSwitch lang={lang} esHref={esHref} enHref={enHref} />
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? tr('nav.cerrarMenu') : tr('nav.abrirMenu')}
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
