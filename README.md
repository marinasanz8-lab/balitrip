# Bali · Gili · Lombok — Septiembre 2026

Microsite del viaje: cuenta atrás, vuelos, itinerario día a día, hoteles,
checklist de preparativos y presupuesto compartido. Es una web estática,
sin build ni servidor: abre `index.html` con cualquier hosting estático
(o incluso localmente) y funciona.

## Fotos pendientes

Faltan las 13 fotos originales en `uploads/` (el fondo del hero, las 4
fotos de zona, y las galerías de Grandmas Plus Hotel Airport y Hyde
Boutique Hotel). Cópialas con estos nombres exactos dentro de `uploads/`:

```
pasted-1783927006868-0.png   (fondo hero / Ubud)
pasted-1783927374569-0.png   (Gili Islands)
pasted-1783927471048-0.png   (Lombok)
pasted-1783927404856-0.png   (Uluwatu)
pasted-1783928043788-0.png   (Grandmas, foto 1)
pasted-1783928063661-0.png   (Grandmas, foto 2)
pasted-1783928076809-0.png   (Grandmas, foto 3)
lombok-hyde-1.png … lombok-hyde-6.png   (Hyde, 6 fotos)
```

## Checklist y presupuesto compartidos (Firebase)

Por defecto, cada persona que abre el enlace ve solo su propia checklist
y presupuesto (guardados en su navegador). Para que se sincronicen entre
todos los que abráis el enlace — checklist y gastos en tiempo real para
toda la familia — hay que rellenar `firebase-config.js` una sola vez:

1. Crea un proyecto gratuito en https://console.firebase.google.com
   (plan "Spark", sin coste).
2. Dentro del proyecto: **Añadir app → Web (`</>`)**. No hace falta
   Firebase Hosting. Copia el objeto `firebaseConfig` que te da.
3. Pégalo en `firebase-config.js`, en `window.FIREBASE_CONFIG`.
4. En el menú lateral, **Realtime Database → Crear base de datos**
   (modo de prueba está bien para empezar).
5. En la pestaña **Reglas**, pega:
   ```json
   {
     "rules": {
       "trips": {
         "$tripId": { ".read": true, ".write": true }
       }
     }
   }
   ```
6. Cambia `window.TRIP_ID` en `firebase-config.js` por algo único (p. ej.
   añade unas letras/números al final) — es la única protección de esa
   base de datos, ya que no hay usuarios ni contraseña por diseño (el
   enlace es de acceso libre para toda la familia).

Sin este paso la web sigue funcionando con normalidad, solo que sin
sincronizar entre dispositivos — con este cambio, cualquier marca en la
checklist o gasto añadido se ve al instante en todos los móviles/portátiles
que tengan la página abierta.

## Publicar la web (GitHub Pages)

1. En el repositorio de GitHub: **Settings → Pages → Deploy from a
   branch**, elige la rama `main` y la carpeta raíz (`/`).
2. Al cabo de un minuto la web queda disponible en
   `https://<usuario>.github.io/balitrip/` — ese es el enlace que
   compartes con la familia.

## Estructura

- `index.html` — la página (diseño + lógica del componente).
- `support.js` / `image-slot.js` — runtime que interpreta la plantilla
  (carga React/ReactDOM/Babel desde CDN, no requiere build).
- `firebase-config.js` — configuración de sincronización (ver arriba).
- `uploads/` — fotos del viaje.
