import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/eventos/admin'),
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', en: 'en-GB' },
      },
    }),
  ],
  site: 'https://restaurantemeufoc.es',
  // español en "/" (sin prefijo) e inglés en "/en/"
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    optimizeDeps: {
      include: ['react-dom/client'],
    },
  },
});
