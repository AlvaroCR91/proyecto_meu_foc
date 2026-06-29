import { useState, useEffect } from 'react';

const THEFORK = 'https://www.thefork.es/restaurante/el-meu-foc-r841568';

export default function Nav({ logoSrc }: { logoSrc: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`hd${scrolled ? ' scrolled' : ''}`}>
      <a className="brand" href="/">
        <img src={logoSrc} alt="El Meu Foc" />
        <span className="bn">El Meu Foc</span>
      </a>
      <nav className="nav">
        <a className="lnk" href="#historia">Historia</a>
        <a className="lnk" href="#especialidades">Especialidades</a>
        <a className="lnk" href="#restaurante">Restaurante</a>
        <a className="lnk" href="/carta">Carta</a>
        <a className="lnk" href="#llegar">Cómo llegar</a>
        <a className="btn" href={THEFORK} target="_blank" rel="noopener noreferrer">
          Reservar mesa <span className="ar">→</span>
        </a>
      </nav>
    </header>
  );
}
