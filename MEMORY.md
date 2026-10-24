# MEMORY — Registro de cambios de El Meu Foc

Registro de los cambios, actualizaciones y mejoras hechos en la web. Las entradas más recientes van arriba.

---

## 2026-10-24 — Eventos: calendario mensual, tablón de anuncios y gestión en el panel (en curso)

**Contexto:** primera prueba del flujo `develop` → `main`. Se cambia el calendario de tira a hoja de mes, se añade un tablón de anuncios (publicaciones con vigencia sin fecha de fin, temporal o de un día) que avisa por webhook a n8n como los eventos, y el panel podrá listar, editar y borrar. Decisión del usuario: usar la BD real también en local (sin BD de pruebas). Regla para las pruebas: eventos con fecha pasada y sin foto (la web pública no los muestra), y borrarlos al acabar.

**Progreso:**
- [x] Tarea 1: entorno local.
  - `astro.config.mjs`: proxy `/api` → `localhost:8533` solo en `dev` y `preview`.
  - `middleware/upload.js`: `UPLOADS_DIR` configurable por env (por defecto igual que antes).
  - `server/eventos-api/package.json`: script `dev` (puerto 8533, fotos en la carpeta de producción, URLs de n8n vacías a la fuerza, `node --watch`). Documentado en el README.
  - Para abrirlo desde el equipo del usuario (conectado por VPN desde 10.9.0.10; el reenvío de puertos de VS Code no le llegaba): `server.host: '0.0.0.0'` en `astro.config.mjs` (solo dev/preview), y la API de desarrollo arranca con `COOKIE_SECURE=false` (`routes/admin.js` lee esa variable; en producción la cookie sigue siendo `secure`). URL local: http://10.20.20.250:4321. El usuario entró al panel desde Opera.
  - Verificado: `/eventos/` en :4321 muestra lo mismo que la web pública (1 evento, día 31 marcado, 8 imágenes en la galería, sin errores JS), las fotos se sirven por el proxy y `/api/admin/me` da 401 sin sesión.
- [ ] Tarea 2: calendario mensual.
- [ ] Tarea 3: tabla `anuncios`.
- [ ] Tarea 4: API pública y creación de publicaciones.
- [ ] Tarea 5: API de gestión (listar, editar, borrar).
- [ ] Tarea 6: panel admin.
- [ ] Tarea 7: tablón en `/eventos`.
- [ ] Tarea 8: verificación final y despliegue.

---

## 2026-10-24 — Nuevo flujo de trabajo: rama `develop` y producción separada (terminado)

**Contexto:** se trabajaba directamente sobre `main` y en la misma carpeta que sirve producción, así que cualquier build salía a internet. Plan: trabajar en `develop` en esta carpeta, y que producción se sirva desde otra carpeta (`/home/hostv01/meu-foc-prod`, worktree de `main`), actualizada solo mediante un script de despliegue tras la aprobación del usuario.

**Progreso:**
- [x] Tarea 1: rama `develop` creada desde `idiomas-y-seo` (el estado publicado); `main` avanzada por fast-forward hasta `ee38cfe`, así que `main` = producción. Borradas en local las ramas ya integradas `idiomas-y-seo` y `eventos`. La web pública no se tocó.
- [x] Acceso a GitHub: clave SSH de despliegue `~/.ssh/github_meu_foc` (con escritura, añadida por el usuario en Deploy keys), alias `github-meu-foc` en `~/.ssh/config` y remoto `origin` = `git@github-meu-foc:AlvaroCR91/proyecto_meu_foc.git`. Subidas `main` y `develop`.
- [x] Borrada la rama remota `origin/eventos` (ya integrada en `main`).
- [x] Tarea 2: carpeta de producción `/home/hostv01/meu-foc-prod` creada como `git worktree` de `main` (comparte el repositorio con esta carpeta). Instaladas las dependencias (`npm ci` en la raíz y en `server/eventos-api`), copiado `server/eventos-api/.env` y compilado su `dist/`. Comprobado que es idéntico al `dist/` publicado salvo los `uid` aleatorios de las islas de Astro. Todavía ningún servicio usa esa carpeta.
- [x] Tarea 3: servicios `meu-foc` y `eventos-api` movidos a `/home/hostv01/meu-foc-prod` (rutas cambiadas en `/etc/systemd/system/{meu-foc,eventos-api}.service`; copia de los originales en `/home/hostv01/scripts/backup-units-2026-10-24/`). Copiado `server/eventos-api/uploads/` justo antes de reiniciar. Verificado: 7 rutas responden 200 en local y en restaurantemeufoc.es, `/api/health` ok, las imágenes de eventos se sirven y la portada pública es igual al build de producción (la única diferencia es la ocultación del email que añade Cloudflare). Desde ahora `dist/` y `uploads/` de esta carpeta (`proyecto_meu_foc`) ya no son los de producción: las fotos que se suban desde el panel van a `meu-foc-prod`.
- [x] Tarea 4: script de despliegue `/home/hostv01/scripts/deploy-meu-foc.sh` (el usuario eligió fast-forward):
  - `--check`: lista los commits y archivos que se publicarían, sin tocar nada.
  - Sin opciones: comprueba que `meu-foc-prod` está limpia y en `main` (avisa si `proyecto_meu_foc` tiene cambios sin commitear, que no se publican), hace `git merge --ff-only develop`, `npm ci` solo si cambió el lockfile, compila en `dist-new` (si falla, deshace el merge y no toca producción), cambia `dist` → `dist-prev` y `dist-new` → `dist`, reinicia `eventos-api` solo si cambió `server/eventos-api`, comprueba que web y API responden, etiqueta `deploy-AAAAMMDD-HHMM` y sube `main`, `develop` y la etiqueta a GitHub.
  - `--rollback`: intercambia `dist` y `dist-prev` (solo la web; `main` no se toca).
  - `--rebuild`: recompila y publica `main` tal cual, sin merge ni etiqueta (para volver tras un `--rollback`). Añadido durante la tarea 5.
  - `dist-new/`, `dist-prev/` y `dist-rollback/` añadidos a `.git/info/exclude`. Comprobado aparte que `serve` sirve la carpeta nueva tras el cambio de nombre sin reiniciarse.
- [x] Tarea 5: prueba completa.
  - Build en `proyecto_meu_foc` con un archivo de prueba en `public/`: aparece en su `dist/` pero da 404 en restaurantemeufoc.es, y el `dist/` de producción no se tocó.
  - Desplegado el commit `44fc128` (este changelog) con el script: fast-forward de `main`, build, cambio de carpeta, 5 comprobaciones en 200, etiqueta `deploy-20261024-1836` y subida a GitHub de `main`, `develop` y la etiqueta.
  - `--rollback` devolvió la carpeta anterior (mismo inode) con la web respondiendo; `--rebuild` volvió a publicar `main`. Después, `--check` dice "Nada que publicar".
  - La web pública coincide con el build de producción en `/`, `/en/`, `/carta/` y `/eventos/`; solo cambian los emails, que Cloudflare cifra de forma distinta en cada petición.
- [x] Tarea 6: README con la sección "Cómo trabajar y desplegar" (y `npm run build` marcado como solo local); memoria del asistente actualizada con el flujo final.

---

**Aviso importante (2026-10-08, ya no vigente desde el 2026-10-24, ver arriba):** la web pública restaurantemeufoc.es se sirve directamente desde `dist/` (servicio `meu-foc`: `serve -l 8521 dist`). Cada `npm run build` publica al instante. Todos los cambios de estas secciones ya están en producción, y durante el trabajo también lo estuvieron los estados intermedios. A partir de ahora las pruebas se compilan en otra carpeta.

## 2026-10-08 — SEO (2): "paella" visible, corrección de "leña" y velocidad (terminado)

**Contexto:** el usuario buscó en Google "arroces", "paella"… y no salía la web. Explicado: las búsquedas genéricas sin ciudad son nacionales; las locales dependen sobre todo de Google Business Profile y las reseñas; los cambios tardan días o semanas sin Search Console. Medición de la web real en móvil con 4G lento: FCP 1,2 s, LCP 1,5 s (bien), CLS 0,122 (mejorable), 502 KB, de los que 239 KB son tipografías. `www.restaurantemeufoc.es` responde 200 en vez de redirigir (pendiente: regla de redirección en Cloudflare).

**Dato importante del usuario:** no se usa leña sino **brasas de carbón**. "A la leña" estaba en el original (descripciones, comentarios y la carta visible) y se había arrastrado a los textos de SEO.

**Progreso:**
- [x] Corrección "leña" + Tarea A ("paella" visible). Compilado primero en `~/.cache/meu-foc-dist-test` y publicado tras la aprobación del usuario.
  - Descripciones (home y carta, ES/EN), datos estructurados y descripción por defecto de `Layout.astro`: "a la brasa de carbón" / "grilled over charcoal" / "charcoal-grilled".
  - Carta visible (Rossellat): "fideuà a la brasa, con nuestro sello" / EN "fideuà cooked over embers, with our own touch". Comentarios internos de `Especialidades.astro` corregidos.
  - Home, especialidades: H3 "Arroz y paellas en Alicante" (EN "Rice and paella in Alicante") y "…a su ritmo en la paella, hasta que…" (EN "…in the paella pan…").
  - Verificado: ningún "leña"/"wood-fired" en la build ni en la web pública; maquetación igual en 1440/768px; en móvil ES el párrafo gana una línea (+27px en la sección).
- [x] Tarea C: salto de contenido al cargar (CLS). Publicada el 2026-10-08 tras la aprobación del usuario.
  - Causa: el cambio de la fuente de reserva (Georgia) a las de Google (Cormorant Garamond y EB Garamond) recolocaba la portada y el banner de cookies (0,120 de 0,122).
  - Solución sin cambiar qué fuentes se cargan (Google Fonts sigue igual):
    - nuevo `src/styles/font-fallbacks.css`, importado en `Layout.astro`, con fuentes de reserva de medidas ajustadas (size-adjust y ascent/descent-override, misma fórmula que Astro/Capsize);
    - se calculan con las métricas reales de los archivos de Google para Times New Roman (y sus clones Liberation Serif/Tinos) y para Noto Serif (Android);
    - `unicode-range` limitado a letras latinas, acentos, puntuación y €, para que símbolos como → ← sigan saliendo de Georgia/serif como antes;
    - `--serif` y `--body` (en `landing.css` y `carta.css`) añaden las reservas detrás de la fuente de Google.
  - Se descartó la API de fuentes de Astro: combina todos los pesos con todos los estilos y habría añadido la cursiva 400 de Cormorant, cambiando el subtítulo de la portada.
  - Resultado (móvil con 4G lento): CLS de 0,122-0,135 a 0,004 (3 mediciones). Escritorio sin cambios (≤ 0,01).
  - Sin cambios visibles: posiciones y tamaños de todos los textos idénticos en `/`, `/en/`, `/carta/`, `/eventos/` y `/aviso-legal/` a 1440/390px. Las únicas diferencias son las llamas animadas, que también varían comparando la web publicada consigo misma. Pruebas generales 18/18 y cabecera 63/63.
  - Limitación: la reserva de Android (Noto Serif) no se puede probar en este servidor (no tiene Noto Serif); está calculada con sus métricas reales.

---

## 2026-10-08 — SEO: palabras clave (terminado)

**Objetivo:** posicionar en Google por arrocería, arroz, arroz Alicante, arrocería Alicante, brasas y otras sugeridas: paella Alicante, restaurante de arroces Alicante, dónde comer arroz en Alicante, arroz a la leña, brasería Alicante, carne a la brasa Alicante, menú arrocero, restaurante Babel Alicante, menús de grupo y degustación. Sin cambiar nada visible de la web.

**Decisiones:** se puede usar "paella" (se sirven arroces en paella). Las coordenadas para los datos estructurados las aporta el usuario (no se inventan).

**Revisión inicial:** base correcta (H1 y H2 con palabras clave, alt descriptivos, sitemap, robots, canonical, hreflang, Search Console). Mejoras: títulos y descripciones, datos estructurados (coordenadas, mapa, @id, cocinas, URL de la carta con `/`), etiquetas para compartir (og:image, og:url, og:site_name, Twitter).

**Progreso:**
- [x] Tarea 1: títulos y descripciones (solo cambian `<title>`, `description` y sus `og:`; el resto del HTML es idéntico).
  - Home ES: "Arrocería en Alicante | Arroces, paellas y brasas · El Meu Foc"
  - Home EN: "Rice & Paella Restaurant in Alicante | El Meu Foc"
  - Carta ES: "Carta de arroces, paellas y brasas en Alicante | El Meu Foc"; EN: "Menu: Rice, Paella & Grill in Alicante | El Meu Foc"
  - Eventos: "Eventos y catas en Alicante | El Meu Foc"
  - Descripciones de 142-155 caracteres con arrocería/arroces/paellas/brasas/Alicante/Babel y "Menú arrocero desde 25 €".
- [x] Tarea 2: datos estructurados del restaurante (`src/components/RestaurantSchema.astro`).
  - Añadidos: `@id` (`https://restaurantemeufoc.es/#restaurant`), `description` (ES/EN), `email`, `geo` (38.34847, -0.4950838, aportadas por el usuario desde Google Maps) y `hasMap` (mismo enlace que "Cómo llegar").
  - `servesCuisine` ES: Arrocería, Arroces, Paella, Brasería, Carnes a la brasa, Cocina mediterránea; EN: Rice dishes, Paella, Grill, Chargrilled meat, Mediterranean cuisine.
  - `menu` corregido a la URL canónica con `/` final (`/carta/`, `/en/carta/`).
  - Verificado: JSON válido con 18 campos en las 10 páginas; la URL de la carta existe; teléfono, correo, dirección y horario coinciden con lo que muestra la web; ningún otro cambio en el HTML.
- [x] Tarea 3: vista previa al compartir (redes y WhatsApp).
  - Nueva imagen `public/og-el-meu-foc.png` (1200×630, 75 KB): logo oscuro (`logo-ink.png`) centrado sobre el crema de la web (#f4ecdc). Elegido por el usuario; el PNG transparente del logo no sirve tal cual porque las redes pintan la transparencia de negro o blanco.
  - `Layout.astro`: `og:site_name`, `og:url` (= canonical), `og:image` (+ width/height/alt) y tarjeta de Twitter/X (`summary_large_image`, título, descripción e imagen).
  - `og:type` pasa de "restaurant" (no es un tipo válido de Open Graph; Facebook lo marca como error) a "website".
  - Verificado: 14/14 etiquetas en las 10 páginas, `og:url` igual a la canonical en todas, la imagen existe con 1200×630 y no cambia nada más del HTML.
- [x] Tarea 4: verificación y recomendaciones.
  - Verificado:
    - `astro check` sin errores ni avisos;
    - repaso de las 9 páginas a 1440/390px (18/18), cabecera y banderas (63/63), PDF (6/6), eventos (16/16), 16 enlaces internos sin ninguno roto;
    - `og-el-meu-foc.png`, `robots.txt` y `sitemap-index.xml` responden 200.
  - Palabras clave en el texto visible de la home: arroz 8, arroces 4, arrocería 2, brasa 11, Alicante 12, Babel 2, fideuà 1. "Paella" y "leña" no aparecen en texto visible (solo en el título, la descripción y los datos estructurados). Añadirlas cambiaría texto visible y queda a decisión del usuario.

**Recomendaciones fuera del código (para el usuario):**
1. Google Business Profile (lo que más pesa en "arrocería Alicante"):
   - categoría principal "Arrocería" y secundarias "Restaurante de paella", "Asador/Brasería" y "Restaurante mediterráneo";
   - mismo nombre, dirección y teléfono que en la web;
   - web `https://restaurantemeufoc.es/`, enlace a la carta y a TheFork;
   - horario, fotos de platos y sala, y publicaciones periódicas.
2. Reseñas en Google: pedirlas (el pie de la web ya enlaza a `g.page/elmeufoc/review`) y responderlas. Si los clientes mencionan "arroz", "paella" o "brasa", ayuda.
3. Search Console: enviar `https://restaurantemeufoc.es/sitemap-index.xml` tras publicar y solicitar la indexación de `/` y `/carta/`.
4. Prueba de resultados enriquecidos (search.google.com/test/rich-results) y depurador de Facebook (developers.facebook.com/tools/debug) tras publicar.
5. Dominio: si `elmeufoc.es` (el dominio anterior en `astro.config.mjs`) sigue activo, que redirija con 301 a `restaurantemeufoc.es`.
6. Mismos datos (nombre, dirección, teléfono, web) en TheFork, TripAdvisor, Instagram y directorios locales.
7. Opcional (cambia texto visible): mencionar "paella" y "a la leña" en algún texto de la home.

---

## 2026-10-01 — Ajuste: banderas solo en home y páginas legales; eventos solo en español

**Motivo:** el usuario informó de que las banderas "dentro del menú" no le funcionaban y decidió:
- banderas solo en la home (cabecera) y en aviso legal / política de cookies;
- sin banderas en la carta;
- eventos sin banderas y solo en español;
- en la home inglesa, "Events" enlaza a `/eventos`.

**Tareas (hechas seguidas a petición del usuario, verificando cada una):**
- [x] A. Carta: quitada la píldora `.carta-lang` (`src/views/Carta.astro`) y su CSS (`carta.css`); el CSS compilado de la carta vuelve a ser idéntico al original. `/en/carta` sigue existiendo y se llega desde la home en inglés.
- [x] B. Eventos solo en español:
  - eliminado `src/pages/en/eventos/`; `src/pages/eventos/index.astro` vuelve a su contenido original (se elimina `src/views/Eventos.astro`);
  - `EventList.tsx` y `SubscribeForm.tsx` vuelven a su versión de git; quitadas las claves `eventos.*`/`suscribir.*` y `API_MSG_EN` de `ui.ts` y el CSS `.eventos-top`;
  - `Nav.tsx`: "Events" → `/eventos`;
  - `Layout.astro`: nueva prop `alternates` (por defecto `true`); eventos pasa `alternates={false}` para no tener `hreflang`.
  - Resultado: el HTML de `/eventos` es igual al original. El sitemap tiene 9 páginas y `/en/eventos` da 404.
- [x] C. Banderas de aviso legal y política de cookies (y de la home) probadas como un usuario: clic de ratón en coordenadas, toque táctil a 390px y teclado, con la web compilada y con `npm run dev`. 36/36 correctas y nada tapa las banderas.
- [x] D. Verificación:
  - build correcto (10 páginas) y `astro check` sin errores ni avisos;
  - repaso de las 9 páginas públicas a 1440/390px (idioma, banderas donde tocan, cookies, sin scroll horizontal ni errores JS);
  - 16 enlaces internos sin ninguno roto y todos los `hreflang` apuntan a páginas existentes;
  - pruebas de la cabecera (63/63) y de los PDF (6/6).

---

## 2026-10-01 — Selector de idioma ES/EN (terminado)

**Objetivo:** dos botones-bandera (España / Reino Unido) a la derecha de "Reservar mesa". La bandera activa aparece resaltada y la web cambia de idioma; en inglés, el botón de menús abre un PDF en inglés. Por defecto la web está en español.

**Decisiones:**
- La versión inglesa vive en rutas `/en/` (i18n nativo de Astro); el español sigue en `/`.
- Se traduce todo el sitio (home, carta, eventos, aviso legal, cookies). `/eventos/admin` se queda en español.
- El PDF de menús en inglés se genera a partir del PDF en español.
- La versión en español no debe cambiar visualmente; lo único nuevo son las banderas.
- Se trabaja tarea a tarea, verificando cada una y con confirmación antes de pasar a la siguiente.
- Verificación: build + comparación del HTML compilado en español + pruebas de funcionamiento (sin comparar imágenes).

**Progreso:**
- [x] Tarea 0: referencia de la web actual. Build correcto (6 páginas) y copia del HTML/CSS compilado para comparar después. Se descartó comparar capturas de imagen porque daban falsos positivos (carga de imágenes y animaciones).
- [x] Tarea 1: configuración i18n y diccionarios.
  - `astro.config.mjs`: `i18n` (es por defecto sin prefijo, en en `/en/`) y la opción `i18n` del sitemap (es-ES / en-GB).
  - Nuevo `src/i18n/ui.ts`: idiomas y diccionario `es`/`en` (por ahora los textos de la cabecera).
  - Nuevo `src/i18n/utils.ts`: `getLang`, `t`, `localePath` (`/carta` → `/en/carta`) y `altPath` (ruta equivalente en el otro idioma).
  - `src/lib/constants.ts`: `MENUS_PDF` con el PDF de menús por idioma.
  - Verificado: build correcto, HTML/CSS idéntico a la referencia, `astro check` sin errores y pruebas de las funciones de rutas.
- [x] Tarea 2: plantilla (Layout) con idioma.
  - `Layout.astro` toma el idioma de la ruta (`Astro.currentLocale`): `<html lang>`, `og:locale` (es_ES / en_GB) y enlaces `hreflang` es / en / x-default. Estos enlaces no se ponen en páginas `noindex` (admin).
  - `CookieConsent.astro`: textos y enlace a la política de cookies según el idioma (textos en `src/i18n/ui.ts`).
  - `RestaurantSchema.astro`: cocina y URL de la carta según el idioma.
  - Verificado: build correcto y `astro check` sin errores. En el HTML en español solo se añaden los `hreflang`; los otros dos cambios (espacios en el texto del banner y orden de su `<style>`) no alteran la vista. Prueba funcional del banner (se muestra, enlace correcto, "Aceptar" lo oculta).
- [x] Tarea 3: home traducida (`/` y `/en/`).
  - El contenido de `src/pages/index.astro` (incluido su `<script>`) pasa a `src/views/Home.astro` (prop `lang`, título y descripción por idioma). `src/pages/index.astro` y `src/pages/en/index.astro` solo llaman a `<Home lang=… />`.
  - Cada sección de `src/components/sections/` recibe `lang` y lleva sus textos `es`/`en` en un objeto `tx` al principio del archivo; el marcado y las clases no cambian.
  - `Menus.astro`: el botón de menús usa `MENUS_PDF[lang]` (en inglés, `/menus-el-meu-foc-en.pdf`, que se crea en la Tarea 8).
  - Enlaces internos (`/carta`, `/aviso-legal`, `/politica-cookies`) con `localePath`; el título del iframe del mapa se traduce según `<html lang>`.
  - Se mantienen sin traducir: las frases manuscritas en valenciano ("des del cor —", "gràcies de tot cor —"), los nombres de plato (Mi Foc, Rossellat de Sepia y Gambas, La Muntanyeta), las direcciones y los precios. El PDF de bebidas sigue en español.
  - Verificado: build correcto (7 páginas) y `astro check` sin errores. El HTML en español es igual a la referencia salvo espacios en blanco y un atributo interno de Astro (`data-astro-cid`) que ya no llevan algunos `<br>`/`<em>`; ningún estilo depende de él. Pruebas en el navegador de `/` y `/en/`: idioma, enlace del PDF, enlaces a la carta, mapa, lightbox, animaciones y ningún error JS.
- [x] Tarea 4: banderas en la cabecera.
  - `Nav.tsx`: nuevas props `lang`, `esHref` y `enHref` (las calcula `Home.astro` con `altPath`). Enlaces, "Reservar mesa" y `aria-label` de la hamburguesa salen del diccionario. Tras el botón de reservar van dos enlaces-bandera con SVG inline (España y Reino Unido); el activo lleva la clase `.active` y `aria-current`. Los enlaces `#historia`, `#especialidades`… no cambian (la cabecera solo se usa en la home).
  - `landing.css`: bloque "selector de idioma". La bandera inactiva aparece atenuada (opacidad .5 y gris parcial) y la activa a color, con anillo crema + ascua y `scale(1.1)`.
  - Decisión del usuario sobre el espacio: en escritorio se deja que el texto "El Meu Foc" junto al logo se comprima (a 1440px pasa de 95 a 43px; la imagen del logo no cambia). En móvil (≤680px) se juntan los elementos para que el logo mantenga sus 54px: `.brand` sin encoger, `gap` de 10px, banderas de 22×15, botón con 12px de relleno lateral y `letter-spacing` .04em. El botón cabe en una línea hasta 375px, igual que en el original (a ≤360px ya se partía en dos líneas antes del cambio).
  - Verificado: build correcto; en el HTML en español solo cambia la cabecera y en el CSS solo se añaden las reglas nuevas. Pruebas en el navegador a 1440/1024/390/360px: banderas a la derecha del botón, centradas, sin scroll horizontal, la hamburguesa abre y cierra, la bandera activa está resaltada, los clics llevan de `/` a `/en/` y viceversa, y no hay errores JS.

  - Revisión completa pedida por el usuario (tras la Tarea 7), todo correcto en `/` y `/en/`:
    - enlaces y destinos, botón de TheFork, logo (corregido en la Tarea 7), `aria-label` de la hamburguesa;
    - banderas con su `href`, `hreflang` y `aria-label`; la activa con opacidad 1, escala 1.1, anillo ascua y no clicable; la inactiva con opacidad .5, que se ilumina al pasar el ratón;
    - acceso con Tab; banderas visibles con la cabecera "scrolled"; los enlaces de ancla bajan a su sección;
    - móvil (414/390/375/360px): logo a 54px, sin solapes, la hamburguesa abre y Escape la cierra, la bandera funciona con el menú abierto y no deja el scroll bloqueado;
    - el botón "atrás" vuelve con la bandera correcta. Sin errores JS.

**Problemas conocidos (anteriores a estos cambios, sin tocar):**
- Entre 681px y ~1280px de ancho la cabecera de escritorio no cabe en pantalla (a 1024px el botón de reservar ya terminaba en 1205px en la versión original). Con las banderas el bloque derecho es ~100px más ancho.
- [x] Tarea 5: carta traducida (`/carta` y `/en/carta`).
  - El contenido de `src/pages/carta.astro` (incluido su `<script>` de escalado) pasa a `src/views/Carta.astro`; `src/pages/carta.astro` y `src/pages/en/carta.astro` solo la llaman. Los textos usan el ayudante `L('español', 'inglés')` junto a cada texto (~100 textos cortos).
  - Se mantienen sin traducir los nombres propios de arroces (Mi Foc, Senyoret, Brisa Marina, La Muntanyeta, Del Huerto, Fondo Marino, El nieto consentido, El viejo puerto, La casa vieja), Rossellat, Pericana, Patatas bravas, los precios y las frases en valenciano ("des del cor —", "fet amb amor", "gràcies de tot cor —").
  - Banderas: se extraen de `Nav.tsx` a `src/components/LangSwitch.tsx`, y sus estilos base a `src/styles/lang-switch.css` (Astro los incrusta en el HTML). En `landing.css` los ajustes de móvil pasan a `.hd .lang-switch` para no depender del orden de carga.
  - Carta: las banderas van en una píldora `.carta-lang` (en `carta.css`), gemela de "Volver a la web", arriba a la derecha (decisión del usuario). Con ≤480px va debajo de "Volver" para no solaparse. En inglés el enlace es "← Back to the site" (más corto, para que quepa en una línea a 320px).
  - Verificado: build correcto (8 páginas) y `astro check` sin errores. El HTML de `/carta` en español es igual al original salvo las banderas. Las 7 páginas de la carta ocupan lo mismo en los dos idiomas (sin desbordes ni solapes con las notas). Las píldoras no se solapan entre 320 y 1440px, las banderas cambian de idioma y "Volver" lleva a `/` o `/en/`. Sin errores JS. Repetidas las pruebas de la cabecera de la home tras extraer `LangSwitch`.
  - Nota: al reiniciarse la sesión se perdió la copia de referencia del HTML original (scratchpad). Desde aquí la referencia es el build verificado de esta tarea; la cabecera original se reconstruyó desde git para comparar. Comparación con el original: el botón "Reservar mesa" ya ocupaba dos líneas por debajo de ~1600px y "Cómo llegar" ya se partía; no lo causan las banderas.
- [x] Tarea 6: eventos traducido (`/eventos` y `/en/eventos`).
  - El contenido de `src/pages/eventos/index.astro` (con sus dos `<script>`: lightbox y fotos de eventos pasados) pasa a `src/views/Eventos.astro` con `L('es', 'en')`. `src/pages/eventos/index.astro` y `src/pages/en/eventos/index.astro` solo la llaman. `/eventos/admin` y `AdminPanel.tsx` no se tocan.
  - `EventList.tsx` y `SubscribeForm.tsx` reciben `lang`: textos desde `src/i18n/ui.ts` (`eventos.*`, `suscribir.*`) y fechas con `Intl` en `es-ES` / `en-GB`.
  - La API de suscripción responde en español: en inglés se traducen sus mensajes conocidos con `API_MSG_EN` (en `ui.ts`) y, si llega otro, se muestra un mensaje genérico en inglés. El servidor no se toca. Los títulos y descripciones de los eventos (base de datos) se muestran tal cual.
  - Banderas: en la misma línea que "← Volver a la web", alineadas a la derecha (`.eventos-top` en `eventos.css`).
  - Verificado: build correcto (9 páginas) y `astro check` sin errores. El HTML de `/eventos` en español solo cambia por las banderas, y las posiciones de todos los bloques son idénticas a 1440/768/390/360px. Pruebas en el navegador con la API simulada: fechas y mes en cada idioma, calendario, mensajes sin eventos, foto de evento pasado, mensajes de suscripción (201/409/500), cambio de idioma y "volver". Sin errores JS. El panel de administración carga sin errores.
- [x] Tarea 7: páginas legales traducidas (`/aviso-legal`, `/politica-cookies` y sus versiones `/en/`).
  - El contenido pasa a `src/views/AvisoLegal.astro` y `src/views/PoliticaCookies.astro`; las páginas `src/pages/{aviso-legal,politica-cookies}.astro` y `src/pages/en/…` solo las llaman. El cuerpo en español se conserva tal cual y la versión inglesa va como bloque alternativo.
  - En inglés, bajo el título aparece la nota "This is a courtesy translation. In the event of any discrepancy, the Spanish version prevails." (`.legal-note`), aprobada por el usuario.
  - Banderas en la misma línea que "← Volver a la web" (`.legal-top`, en el `<style>` de cada vista).
  - Corrección de la Tarea 4: en `/en/` el logo de la cabecera llevaba a `/`; ahora usa `localePath` y lleva a `/en/` (en español sigue siendo `/`).
  - Verificado: build correcto (11 páginas), `astro check` sin errores y el sitemap con las 10 URLs (5 por idioma). En español el texto es idéntico y las posiciones de todos los bloques no cambian a 1440/768/390/360px. Pruebas de las cuatro páginas (idioma, título, nota, "volver", banderas). Revisión de todos los enlaces internos de las 10 páginas: todos responden 200 salvo `/menus-el-meu-foc-en.pdf` (pendiente de la Tarea 8), y las páginas en inglés no enlazan a páginas en español salvo la bandera ES.
- [x] Tarea 8: PDF de menús en inglés y erratas del PDF en español.
  - Nuevo `public/menus-el-meu-foc-en.pdf` (5 páginas, 2,4 MB, texto seleccionable). Lo abre el botón "See our other set menus (PDF)" de `/en/`.
  - Cómo se ha hecho (scripts en el scratchpad, no en el proyecto):
    - pdf.js para leer el texto y dibujar las páginas; pdf-lib para quitar del PDF original todos los bloques de texto (también los de formularios anidados) y las imágenes que eran sombras de texto.
    - Portadas (texto incrustado en la imagen): en la 1 se tapa el título con un parche de mármol de la misma imagen; en la 4 se rellena la franja interpolando los colores de arriba y abajo.
    - Encima va el texto en inglés en las mismas posiciones, con fuentes libres: Libre Baskerville, Open Sans, Bree Serif, Lato y League Spartan (en lugar de Glacial Indifference). Se exporta con Chromium y se une con pdf-lib.
  - Se mantienen los nombres propios: menús (Tresor de l´Atalaya, Luzón al Foc, Rambla, Explanada, Santa Bárbara), vinos, platos de la casa, marcas de bebida y precios.
  - Decisiones del usuario sobre la traducción:
    - "RESERVA MAX 7 DIAS PREVIOS" significa como mínimo 7 días antes → "BOOK AT LEAST 7 DAYS AHEAD".
    - "Lingote de cordero" → "Pressed lamb"; "Corvina" → "Meagre".
    - "Marinero (seafood)": Marinero es el nombre de ese rossellat, en referencia a la profesión.
  - Erratas corregidas en `public/menus-el-meu-foc.pdf` (español) sin mover nada, editando directamente el texto del PDF: "teroso" → "tesoro" (se reordenan r/s con sus avances; misma anchura), "Sécreto" → "Secreto" (la é y la e tienen el mismo avance), "Entrecort" → "Entrecot" (línea alineada a la izquierda). Comprobado que el resto del texto sigue en las mismas posiciones. El original sigue en git.
  - Verificado: build correcto; los dos PDF responden 200 y son válidos; al pulsar el botón de menús, `/` pide el PDF en español y `/en/` el inglés.
- [x] Tarea 9: verificación final.
  - `npm run build` correcto (11 páginas) y `astro check` con 0 errores y 0 avisos.
  - Rutas: `/`, `/carta/`, `/eventos/`, `/aviso-legal/`, `/politica-cookies/` y sus versiones en `/en/`, más `/eventos/admin/` (solo en español, sin `hreflang`).
  - El sitemap tiene las 10 páginas públicas, cada una enlazada a su versión en el otro idioma (es-ES / en-GB). Las etiquetas `hreflang` de todas las páginas apuntan a páginas que existen.
  - Repaso de las 10 páginas a 1440 y 390px: idioma de la página, bandera activa correcta y la otra apuntando a su equivalente, banner de cookies en el idioma correcto, sin scroll horizontal y sin errores JS. En las páginas en inglés no queda texto en español, salvo los nombres propios conservados a propósito.
  - Repetidas todas las pruebas de las tareas anteriores (cabecera, carta, eventos, legales y enlaces, PDF): 211 comprobaciones, todas correctas.

**Resumen de archivos:**
- Nuevos: `src/i18n/ui.ts`, `src/i18n/utils.ts`, `src/components/LangSwitch.tsx`, `src/styles/lang-switch.css`, `src/views/{Home,Carta,Eventos,AvisoLegal,PoliticaCookies}.astro`, `src/pages/en/**`, `public/menus-el-meu-foc-en.pdf`.
- Modificados: `astro.config.mjs`, `src/layouts/Layout.astro`, `src/components/{Nav.tsx,CookieConsent.astro,RestaurantSchema.astro}`, `src/components/sections/*.astro`, `src/components/eventos/{EventList,SubscribeForm}.tsx`, `src/lib/constants.ts`, `src/pages/*.astro` (ahora solo llaman a su vista), `src/styles/{landing,carta,eventos}.css`, `public/menus-el-meu-foc.pdf` (erratas).
- Sin commit: los cambios están en el directorio de trabajo, junto a los cambios que ya había antes de empezar.

**Notas:**
- Antes de empezar, el repositorio ya tenía cambios sin commitear (imágenes movidas de `public/assets/` a `src/assets/`, cambios en `package.json` y `astro.config.mjs`). No forman parte de esta tarea.
