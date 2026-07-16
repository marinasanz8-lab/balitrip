# Bali · Sep 2026

Microsite del viaje: cuenta atrás, conversor de divisas, checklist de
preparativos, vuelos, hoteles, itinerario día a día y presupuesto
compartido. Cada persona ve su propia copia guardada en el navegador
(`localStorage`); el botón **Compartir** genera un enlace con el estado
completo codificado, para mandar la última versión al resto del grupo.

## Publicar la web (GitHub Pages)

El sitio ya está compilado en la raíz del repo (`index.html` + `assets/`),
así que no hace falta build ni servidor:

1. En el repositorio de GitHub: **Settings → Pages → Deploy from a
   branch**, elige la rama `main` y la carpeta raíz (`/`).
2. Al cabo de un minuto la web queda disponible en
   `https://<usuario>.github.io/balitrip/` — ese es el enlace que
   compartes con la familia.

## Editar el diseño

El código fuente (React + TypeScript + Tailwind) vive en `app/`.

```bash
cd app
npm install
npm run dev      # servidor local con recarga en caliente
```

Para publicar cambios, compila y copia el resultado a la raíz del repo:

```bash
cd app
npm run build
cp -r dist/. ..
```

Luego haz commit de los archivos cambiados en la raíz (`index.html`,
`assets/`) junto con tus cambios en `app/src/`, y haz push a `main`.

## Estructura

- `index.html`, `assets/` — la web compilada, lo que sirve GitHub Pages.
- `app/` — código fuente editable (Vite + React + Tailwind v4).
  - `app/src/app/App.tsx` — toda la lógica y el diseño de la app.
  - `app/src/imports/` — fotos (hero de Ubud, hoteles).
  - `app/src/styles/theme.css` — paleta de colores y tipografías.
