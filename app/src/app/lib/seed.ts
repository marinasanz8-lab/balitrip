import { uid } from "./util";
import { DEFAULT_MODULES, type CheckCat, type FlightData, type HotelData, type TripData, type TripMeta, type Zone } from "../types";

const DEF_CHECK: CheckCat[] = [
  { id: "docs", name: "Documentación", items: [
    { id: uid(), text: "Pasaporte (vigente +6 meses desde la vuelta)", done: false },
    { id: uid(), text: "e-VOA Indonesia — visado electrónico", done: false },
    { id: uid(), text: "Seguro de viaje con cobertura médica", done: false },
    { id: uid(), text: "Reservas impresas (vuelos y hoteles)", done: false },
    { id: uid(), text: "Carnet de conducir internacional", done: false },
    { id: uid(), text: "Fotocopia del pasaporte en el móvil", done: false },
  ]},
  { id: "gear", name: "Equipaje", items: [
    { id: uid(), text: "Adaptador de enchufe (tipo C/F → tipo I)", done: false },
    { id: uid(), text: "Protector solar SPF50+", done: false },
    { id: uid(), text: "Ropa ligera y transpirable", done: false },
    { id: uid(), text: "Bañador / bikini", done: false },
    { id: uid(), text: "Repelente de mosquitos", done: false },
    { id: uid(), text: "Botiquín básico", done: false },
    { id: uid(), text: "Calzado para templos (sarong)", done: false },
    { id: uid(), text: "Cámara / GoPro / batería extra", done: false },
    { id: uid(), text: "Bolsa impermeable para ferry", done: false },
  ]},
];

const DEF_FLIGHTS: FlightData[] = [
  { leg: "IDA", date: "Sábado, 12 Sep 2026", dep: "22:30", arr: "23:30 +1", from: "Barcelona (BCN)", to: "Denpasar (DPS)", duration: "19h 00min", airline: "—", stops: "1 escala", notes: "Llegada domingo 13 Sep" },
  { leg: "VUELTA", date: "Viernes, 25 Sep 2026", dep: "18:45", arr: "07:35 +1", from: "Denpasar (DPS)", to: "Barcelona (BCN)", duration: "18h 50min", airline: "—", stops: "1 escala", notes: "Llegada sábado 26 Sep" },
];

const DEF_HOTELS: HotelData[] = [
  { id: "h1", name: "Grandmas Plus Hotel Airport", zone: "Kuta · Aeropuerto", checkin: "Dom 13 Sep · desde 15:00", checkout: "Lun 14 Sep · hasta 12:00", address: "Jl. Bypass Ngurah Rai No.99, Tuban, Kuta", notes: "Habitación Doble Cozy · Desayuno incluido · 2 hab, 4 adultos", stars: 3 },
  { id: "h2", name: "Por confirmar", zone: "Ubud", checkin: "Dom 14 Sep", checkout: "Jue 18 Sep", address: "", notes: "", stars: 0 },
  { id: "h3", name: "Por confirmar", zone: "Gili", checkin: "Jue 18 Sep", checkout: "Dom 21 Sep", address: "", notes: "", stars: 0 },
  { id: "h4", name: "Hyde Boutique Hotel", zone: "Lombok", checkin: "Lun 21 Sep · desde 14:00", checkout: "Jue 24 Sep · hasta 11:00", address: "Jl. Raya Kuta No.5, 83573 Kuta Lombok", notes: "Suite con vistas a la piscina · 3 noches · 2 hab, 4 adultos", stars: 4 },
  { id: "h5", name: "Por confirmar", zone: "Uluwatu", checkin: "Jue 24 Sep", checkout: "Vie 25 Sep", address: "", notes: "", stars: 0 },
];

const DEF_ZONES: Zone[] = [
  { id: "z1", name: "Vuelo", emoji: "✈️", days: [
    { id: "d1a", label: "Sáb 12 Sep", activities: [{ id: uid(), text: "Salida BCN 22:30" }, { id: uid(), text: "Escala (pendiente confirmar)" }] },
    { id: "d1b", label: "Dom 13 Sep", activities: [{ id: uid(), text: "Llegada DPS 23:30" }] },
  ]},
  { id: "z2", name: "Kuta", emoji: "🌴", days: [
    { id: "d2a", label: "Dom 13 Sep", activities: [{ id: uid(), text: "Llegada aeropuerto DPS" }, { id: uid(), text: "Check-in Grandmas Plus Hotel" }, { id: uid(), text: "Descanso y primera noche en Bali" }] },
  ]},
  { id: "z3", name: "Ubud", emoji: "🌿", days: [
    { id: "d3a", label: "Lun 14 Sep", activities: [{ id: uid(), text: "Traslado a Ubud" }, { id: uid(), text: "Check-in hotel · exploración del centro" }] },
    { id: "d3b", label: "Mar 15 Sep", activities: [{ id: uid(), text: "Monkey Forest Sanctuary" }, { id: uid(), text: "Mercado artesanal de Ubud" }] },
    { id: "d3c", label: "Mié 16 Sep", activities: [{ id: uid(), text: "Campos de arroz de Tegallalang" }, { id: uid(), text: "Cascada Tegenungan" }] },
    { id: "d3d", label: "Jue 17 Sep", activities: [{ id: uid(), text: "Clase de cocina balinesa" }, { id: uid(), text: "Templo Pura Tirta Empul" }] },
    { id: "d3e", label: "Vie 18 Sep", activities: [{ id: uid(), text: "Mañana libre · compras" }, { id: uid(), text: "Traslado al ferry hacia Gili" }] },
  ]},
  { id: "z4", name: "Gili", emoji: "🐠", days: [
    { id: "d4a", label: "Vie 18 Sep", activities: [{ id: uid(), text: "Ferry Bali → Gili Trawangan" }, { id: uid(), text: "Check-in hotel" }] },
    { id: "d4b", label: "Sáb 19 Sep", activities: [{ id: uid(), text: "Snorkeling con tortugas marinas" }, { id: uid(), text: "Bicicleta por la isla" }] },
    { id: "d4c", label: "Dom 20 Sep", activities: [{ id: uid(), text: "Visita Gili Meno" }, { id: uid(), text: "Puesta de sol en la playa" }] },
    { id: "d4d", label: "Lun 21 Sep", activities: [{ id: uid(), text: "Mañana libre · preparar maletas" }, { id: uid(), text: "Ferry → Lombok" }] },
  ]},
  { id: "z5", name: "Lombok", emoji: "🏔️", days: [
    { id: "d5a", label: "Lun 21 Sep", activities: [{ id: uid(), text: "Llegada · Check-in Hyde Boutique Hotel" }, { id: uid(), text: "Tarde libre · piscina" }] },
    { id: "d5b", label: "Mar 22 Sep", activities: [{ id: uid(), text: "Playa Kuta Lombok" }, { id: uid(), text: "Atardecer desde la costa" }] },
    { id: "d5c", label: "Mié 23 Sep", activities: [{ id: uid(), text: "Exploración por los alrededores" }, { id: uid(), text: "Mercado local" }] },
    { id: "d5d", label: "Jue 24 Sep", activities: [{ id: uid(), text: "Check-out · traslado a Uluwatu" }] },
  ]},
  { id: "z6", name: "Uluwatu", emoji: "🌊", days: [
    { id: "d6a", label: "Jue 24 Sep", activities: [{ id: uid(), text: "Llegada a Uluwatu" }, { id: uid(), text: "Templo de Uluwatu (acantilados)" }, { id: uid(), text: "Danza Kecak al atardecer" }, { id: uid(), text: "Playa Padang Padang" }] },
  ]},
  { id: "z7", name: "Vuelta", emoji: "🏠", days: [
    { id: "d7a", label: "Vie 25 Sep", activities: [{ id: uid(), text: "Traslado aeropuerto DPS" }, { id: uid(), text: "Salida DPS 18:45" }, { id: uid(), text: "Llegada BCN 07:35 (+1)" }] },
  ]},
];

const DEF_BUDGET = [
  { id: uid(), desc: "Grandmas Plus Hotel Airport", cat: "Hotel", zone: "Kuta", amount: 51 },
  { id: uid(), desc: "Hyde Boutique Hotel · 3 noches", cat: "Hotel", zone: "Lombok", amount: 252 },
];

const OLD_KEYS = {
  checklist: "bali-check",
  flights: "bali-flights",
  hotels: "bali-hotels",
  zones: "bali-zones-v2",
  budget: "bali-budget-v2",
};

function readOld<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch {}
  return fallback;
}

/** Builds the initial "Bali 2026" trip. If this device has leftover data from
 * the previous single-trip version of the site (before the multi-trip
 * platform), that progress is reused instead of the blank defaults. */
export function buildBaliSeed(): { meta: TripMeta; data: TripData } {
  const id = uid();
  const meta: TripMeta = {
    id,
    name: "Bali 2026",
    destination: "Bali · Gili · Lombok, Indonesia",
    startDate: "2026-09-12",
    endDate: "2026-09-25",
    emoji: "🏝️",
    color: "#B85525",
    currency: "IDR",
    modules: DEFAULT_MODULES,
    createdAt: Date.now(),
  };
  const data: TripData = {
    checklist: readOld(OLD_KEYS.checklist, DEF_CHECK),
    flights: readOld(OLD_KEYS.flights, DEF_FLIGHTS),
    hotels: readOld(OLD_KEYS.hotels, DEF_HOTELS),
    zones: readOld(OLD_KEYS.zones, DEF_ZONES),
    tours: [],
    budget: readOld(OLD_KEYS.budget, DEF_BUDGET),
    people: [],
  };
  return { meta, data };
}
