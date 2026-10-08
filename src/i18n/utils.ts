import { DEFAULT_LANG, LANGS, ui, type Lang, type UiKey } from './ui';

// Idioma a partir de Astro.currentLocale (o cualquier string); por defecto español
export function getLang(locale: string | undefined): Lang {
  return (LANGS as readonly string[]).includes(locale ?? '') ? (locale as Lang) : DEFAULT_LANG;
}

// Devuelve la función de traducción para un idioma
export function t(lang: Lang) {
  return (key: UiKey): string => ui[lang][key];
}

// Ruta interna en el idioma indicado: "/carta" -> "/en/carta" (español sin prefijo).
// Se construye a mano para no alterar los href actuales en español.
export function localePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG) return path;
  return path === '/' ? `/${lang}/` : `/${lang}${path}`;
}

// Ruta equivalente en el otro idioma: "/carta" <-> "/en/carta"
export function altPath(pathname: string, target: Lang): string {
  const base = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return localePath(target, base);
}
