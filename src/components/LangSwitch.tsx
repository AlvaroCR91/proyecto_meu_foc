import type { Lang } from '../i18n/ui';
import '../styles/lang-switch.css';

function FlagES() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  );
}

function FlagGB() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <clipPath id="flag-gb-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

interface LangSwitchProps {
  lang: Lang;
  esHref: string;
  enHref: string;
}

// Banderas para cambiar de idioma; la del idioma actual va resaltada (.active)
export default function LangSwitch({ lang, esHref, enHref }: LangSwitchProps) {
  return (
    <div className="lang-switch" role="group" aria-label="Idioma / Language">
      <a
        className={`flag${lang === 'es' ? ' active' : ''}`}
        href={esHref}
        hrefLang="es"
        lang="es"
        aria-label="Español"
        aria-current={lang === 'es' ? 'true' : undefined}
      >
        <FlagES />
      </a>
      <a
        className={`flag${lang === 'en' ? ' active' : ''}`}
        href={enHref}
        hrefLang="en"
        lang="en"
        aria-label="English"
        aria-current={lang === 'en' ? 'true' : undefined}
      >
        <FlagGB />
      </a>
    </div>
  );
}
