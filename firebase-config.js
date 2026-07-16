// Configuración de Firebase para que la checklist y el presupuesto se
// sincronicen entre todos los que abran esta web (familia).
//
// Sin rellenar esto, la web sigue funcionando perfectamente pero cada
// persona ve solo su propia copia guardada en su navegador (como hasta
// ahora). En cuanto se rellena con datos reales y se publica, los cambios
// de cualquiera se ven al instante en todos los dispositivos.
//
// Cómo obtener estos valores (una sola vez, ~5 minutos):
//   1. Entra en https://console.firebase.google.com y crea un proyecto
//      gratuito (plan "Spark").
//   2. Dentro del proyecto: "Añadir app" → icono </> (Web). Ponle el nombre
//      que quieras, no hace falta Firebase Hosting.
//   3. Copia el objeto "firebaseConfig" que te muestra y pégalo aquí abajo.
//   4. En el menú lateral, ve a "Realtime Database" → "Crear base de
//      datos" → modo de prueba está bien para empezar.
//   5. En la pestaña "Reglas" de Realtime Database, pega esto para limitar
//      la escritura/lectura a la ruta de este viaje:
//        {
//          "rules": {
//            "trips": {
//              "$tripId": { ".read": true, ".write": true }
//            }
//          }
//        }
//   6. Cambia TRIP_ID más abajo por algo único y difícil de adivinar
//      (por ejemplo añade unas letras/números al final) — es la única
//      protección de esta base de datos al no haber usuarios ni contraseña.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCs2l5bVN11v9ZWh6UzswpXbYFePvi34Tk",
  authDomain: "balitrip-fa283.firebaseapp.com",
  databaseURL: "https://balitrip-fa283-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "balitrip-fa283",
  storageBucket: "balitrip-fa283.firebasestorage.app",
  messagingSenderId: "596704615050",
  appId: "1:596704615050:web:515f3c1430bb55d8b16b73"
};

window.TRIP_ID = "bali-gili-lombok-2026-mvem4";
