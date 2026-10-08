export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

// Textos comunes de la interfaz. Cada página/sección añade aquí los suyos
// cuando se traduce; el resto de idiomas debe tener las mismas claves.
export const ui = {
  es: {
    'nav.historia': 'Historia',
    'nav.especialidades': 'Especialidades',
    'nav.restaurante': 'Restaurante',
    'nav.carta': 'Carta',
    'nav.llegar': 'Cómo llegar',
    'nav.eventos': 'Eventos',
    'nav.reservar': 'Reservar mesa',
    'nav.abrirMenu': 'Abrir menú',
    'nav.cerrarMenu': 'Cerrar menú',
    'cookies.texto':
      'Usamos cookies propias, necesarias para el funcionamiento de la web, y de terceros\n      (Google Maps) para mostrarte cómo llegar al restaurante. Puedes aceptarlas o\n      rechazarlas. Más información en nuestra',
    'cookies.politica': 'Política de Cookies',
    'cookies.rechazar': 'Rechazar',
    'cookies.aceptar': 'Aceptar',
  },
  en: {
    'nav.historia': 'Our story',
    'nav.especialidades': 'Specialities',
    'nav.restaurante': 'Restaurant',
    'nav.carta': 'Menu',
    'nav.llegar': 'How to get here',
    'nav.eventos': 'Events',
    'nav.reservar': 'Book a table',
    'nav.abrirMenu': 'Open menu',
    'nav.cerrarMenu': 'Close menu',
    'cookies.texto':
      'We use our own cookies, which are necessary for the website to work, and third-party\n      cookies (Google Maps) to show you how to get to the restaurant. You can accept or\n      reject them. More information in our',
    'cookies.politica': 'Cookie Policy',
    'cookies.rechazar': 'Reject',
    'cookies.aceptar': 'Accept',
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type UiKey = keyof (typeof ui)['es'];

