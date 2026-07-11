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
| `npm run build`    | Genera la build de producción en `./dist/`    |
| `npm run preview`  | Previsualiza la build de producción           |
| `npx astro check`  | Comprueba tipos de TypeScript en los `.astro` |
