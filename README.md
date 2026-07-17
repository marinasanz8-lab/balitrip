# Mis viajes

Plataforma para planificar todos tus viajes, no solo uno: una pantalla
**Mis viajes** (con pestañas de próximos/pasados) para crearlos e ir
guardándolos, y dentro de cada uno, módulos configurables (activa o
desactiva los que no necesites):

- Cuenta atrás
- Conversor de divisas (moneda local del viaje ↔ EUR)
- Checklist de preparativos — manual o con propuestas generadas por IA
- Vuelos — manual o importando los datos desde una captura de pantalla con IA
- Hoteles, con foto y enlace de reserva
- Itinerario día a día por zonas/etapas, con foto por día y la opción de
  mover actividades de un día a otro
- Tours y excursiones, asignables a un día del itinerario o sin asignar
- Presupuesto compartido tipo Splitwise: quién ha pagado cada gasto y
  entre quién se reparte, con balances y sugerencias de pago automáticas

Un asistente paso a paso te guía al crear un viaje nuevo: destino y
portada, fechas, y luego cada módulo se pregunta por separado ("¿quieres
añadir X ahora?") — todo es opcional y se puede rellenar más tarde desde
el propio viaje. Cada viaje tiene su portada (foto propia o icono+color),
fechas, destino y moneda. El botón **Compartir** genera un enlace con el
estado completo de ese viaje codificado, para mandar la última versión a
otra persona.

## Publicar la web (GitHub Pages)

El sitio ya está compilado en la raíz del repo (`index.html` + `assets/` +
`firebase-config.js`), así que no hace falta build ni servidor:

1. En el repositorio de GitHub: **Settings → Pages → Deploy from a
   branch**, elige esta rama y la carpeta raíz (`/`).
2. Al cabo de un minuto la web queda disponible en tu dominio de GitHub
   Pages — ese es el enlace que compartes con la familia.

## Sincronización entre dispositivos (Firebase)

Por defecto la lista de viajes y sus datos se guardan en cada navegador
(`localStorage`). Para que se sincronicen en tiempo real entre todos los
dispositivos que abran el enlace, rellena `app/public/firebase-config.js`
— ya trae comentadas las instrucciones paso a paso (crear proyecto
gratuito en Firebase, activar Realtime Database, pegar las reglas). Sin
este paso la web sigue funcionando con normalidad, solo que cada persona
ve su propia copia hasta que usa **Compartir**.

## IA (captura de vuelos y checklist)

Los botones con ✨ ("Importar de captura", "Generar con IA") llaman
directamente desde tu navegador a la API de Anthropic. Necesitan tu propia
clave de API, que se pega una vez en **Ajustes del viaje → Clave de API**
y se guarda solo en ese navegador (nunca se sincroniza ni sale de tu
dispositivo salvo hacia Anthropic). Sin clave configurada, esos botones
simplemente avisan y el resto de la web funciona igual.

## Editar el diseño

El código fuente (React + TypeScript + Tailwind v4) vive en `app/`.

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
`assets/`) junto con tus cambios en `app/src/`, y haz push.

## Estructura

- `index.html`, `assets/`, `firebase-config.js` — la web compilada, lo
  que sirve GitHub Pages.
- `app/` — código fuente editable (Vite + React + Tailwind v4).
  - `app/src/app/App.tsx` — enrutado entre "Mis viajes", el asistente de
    creación, un viaje y sus ajustes.
  - `app/src/app/TripsHome.tsx` — lista de viajes (pestañas próximos/
    pasados) y alta de uno nuevo.
  - `app/src/app/wizard/` — asistente paso a paso para crear un viaje
    (`TripWizard.tsx` es el marco con la navegación; `steps.tsx` tiene
    cada pantalla).
  - `app/src/app/TripView.tsx` — la página de un viaje (hero + módulos).
  - `app/src/app/TripSettings.tsx` — portada, datos del viaje, módulos
    activos, clave de IA, borrar viaje.
  - `app/src/app/modules/` — cada sección (Checklist, Vuelos, Hoteles,
    Itinerario, Tours, Presupuesto, Conversor) como componente
    independiente, reutilizado tanto en el viaje como en el asistente.
  - `app/src/app/lib/firebase.ts` / `workspace.tsx` — sincronización y
    estado compartido entre viajes.
  - `app/src/app/lib/ai.ts` — llamadas a la API de Anthropic desde el
    navegador.
  - `app/src/app/lib/split.ts` — cálculo de balances y pagos sugeridos
    del módulo de presupuesto (tipo Splitwise).
  - `app/src/app/types.ts` — modelo de datos (viaje, módulos, vuelos,
    hoteles, tours, personas...).
  - `app/src/styles/theme.css` — paleta de colores y tipografías.
