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
  // dev/preview: escuchar en todas las interfaces para abrirlo desde otro
  // equipo de la red (http://10.20.20.250:4321); por defecto solo [::1].
  server: { host: '0.0.0.0' },
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
    // Solo para `npm run dev` y `npm run preview`: en producción /api lo
    // enruta el proxy delante de la web. En local va a la API de desarrollo
    // (`npm run dev` en server/eventos-api, puerto 8533).
    server: { proxy: { '/api': 'http://localhost:8533' } },
    preview: { proxy: { '/api': 'http://localhost:8533' } },
  },
});
