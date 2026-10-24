# El Meu Foc

Web de El Meu Foc, arrocería y brasería en Alicante. Construida con [Astro](https://astro.build) y una isla de [React](https://react.dev) para la navegación.

## Estructura

```
src/
  components/
    Nav.tsx                 nav con estado de scroll (isla React)
    sections/               un componente por sección de la home
  layouts/
    Layout.astro            <head>, meta tags, fuentes
  lib/
    constants.ts            constantes compartidas (enlace de TheFork)
  pages/
    index.astro             home: importa y ordena las secciones
    carta.astro              carta completa en formato de páginas
  styles/
    landing.css              estilos de la home
    carta.css                estilos de la carta
public/
  assets/                    fotos, logos, ilustraciones
  *.pdf                      cartas descargables (carta, bebidas, menús)
```

## Comandos

Todos los comandos se ejecutan desde la raíz del proyecto (`proyecto_meu_foc/`):

| Comando           | Acción                                      |
| :---------------- | :------------------------------------------- |
| `npm install`      | Instala las dependencias                     |
| `npm run dev`      | Levanta el servidor de desarrollo             |
| `npm run build`    | Genera la build en `./dist/` (solo local)     |
| `npm run preview`  | Previsualiza la build de producción           |
| `npx astro check`  | Comprueba tipos de TypeScript en los `.astro` |

## Cómo trabajar y desplegar

Hay dos carpetas del mismo repositorio (`git worktree`):

| Carpeta                         | Rama      | Para qué                                             |
| :------------------------------ | :-------- | :--------------------------------------------------- |
| `/home/hostv01/proyecto_meu_foc` | `develop` | Trabajo diario. Lo que se compila aquí no se publica. |
| `/home/hostv01/meu-foc-prod`     | `main`    | Producción. No se toca a mano: solo el script.       |

restaurantemeufoc.es la sirven los servicios systemd `meu-foc` (`serve -l 8521 dist`) y `eventos-api` (:8523) desde `meu-foc-prod`. Las fotos subidas desde el panel de eventos se guardan en `meu-foc-prod/server/eventos-api/uploads/`. Ojo: la base de datos es la misma en local y en producción.

1. **Trabajar** en `proyecto_meu_foc` (rama `develop`) y ver los cambios en local con `npm run dev` (http://localhost:4321) o con `npm run build && npm run preview`.
2. **Hacer commit** en `develop` cuando esté bien. Lo que no esté commiteado no se publica.
3. **Revisar qué se publicaría:** `~/scripts/deploy-meu-foc.sh --check`
4. **Publicar:** `~/scripts/deploy-meu-foc.sh`. Hace fast-forward de `main` a `develop`, compila en `dist-new` (si falla, no toca nada), cambia la web de golpe dejando la anterior en `dist-prev`, reinicia la API solo si cambió `server/eventos-api`, comprueba que todo responde, etiqueta `deploy-AAAAMMDD-HHMM` y sube `main`, `develop` y la etiqueta a GitHub.
5. **Si algo sale mal:** `~/scripts/deploy-meu-foc.sh --rollback` vuelve a la web anterior al instante (solo la web; `main` no cambia). Después, corregir en `develop` y desplegar, o `--rebuild` para volver a publicar `main` tal cual.

`main` solo debe avanzar mediante el script; si alguien hace commits directos en `main`, el fast-forward fallará y habrá que integrarlos primero en `develop`.
