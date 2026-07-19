export type ModuleId =
  | "conversor"
  | "checklist"
  | "vuelos"
  | "hoteles"
  | "itinerario"
  | "tours"
  | "presupuesto";

export const MODULE_LABELS: Record<ModuleId, string> = {
  conversor: "Conversor de divisas",
  checklist: "Checklist",
  vuelos: "Vuelos",
  hoteles: "Hoteles",
  itinerario: "Itinerario",
  tours: "Tours y excursiones",
  presupuesto: "Presupuesto",
};

export const ALL_MODULES: ModuleId[] = [
  "conversor",
  "checklist",
  "vuelos",
  "hoteles",
  "itinerario",
  "tours",
  "presupuesto",
];

export const DEFAULT_MODULES: ModuleId[] = [...ALL_MODULES];

export type CheckItem = { id: string; text: string; done: boolean };
export type CheckCat = { id: string; name: string; items: CheckItem[] };

export type FlightData = {
  leg: string;
  date: string;
  dep: string;
  arr: string;
  from: string;
  to: string;
  duration: string;
  airline: string;
  stops: string;
  notes: string;
};

export type HotelData = {
  id: string;
  name: string;
  zone: string;
  checkin: string;
  checkout: string;
  address: string;
  notes: string;
  stars: number;
  photo?: string;
  bookingLink?: string;
};

export type Activity = { id: string; text: string };
export type Day = {
  id: string;
  label: string;
  date?: string;
  title?: string;
  description?: string;
  photos?: string[];
  activities: Activity[];
};
export type Zone = { id: string; name: string; emoji: string; days: Day[] };
export type Itinerary = { id: string; name: string; zones: Zone[] };

export type Tour = {
  id: string;
  name: string;
  notes: string;
  price: number | null;
  link: string;
  dayId?: string; // linked itinerary day, or unassigned
};

export type Person = { id: string; name: string };

export type BudgetItem = {
  id: string;
  desc: string;
  cat: string;
  zone: string;
  amount: number;
  paidBy?: string; // Person.id
  splitAmong?: string[]; // Person.id[] — omitted/empty means "everyone"
};

export type TripMeta = {
  id: string;
  name: string;
  destination: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  emoji: string;
  color: string;
  cover?: string; // data URL, optional
  currency: string; // ISO code, e.g. "IDR" — local currency for the converter module
  modules: ModuleId[];
  createdAt: number;
};

export const COMMON_CURRENCIES = [
  "USD", "EUR", "GBP", "IDR", "THB", "JPY", "MXN", "MAD", "TRY", "VND", "AED", "BRL",
];

export type TripData = {
  checklist: CheckCat[];
  flights: FlightData[];
  hotels: HotelData[];
  itineraries: Itinerary[];
  tours: Tour[];
  budget: BudgetItem[];
  people: Person[];
};

export const EMPTY_TRIP_DATA: TripData = {
  checklist: [],
  flights: [],
  hotels: [],
  itineraries: [],
  tours: [],
  budget: [],
  people: [],
};

/** Firebase Realtime Database silently drops any array/object field that's
 * empty at save time (e.g. a freshly-created itinerary with no zones yet),
 * so it can come back from sync missing entirely instead of as `[]`. These
 * normalize a nested structure back to always having its array fields. */
function normalizeDay(raw: unknown): Day {
  const d = (raw ?? {}) as Partial<Day>;
  return { id: d.id ?? "", label: d.label ?? "", date: d.date, title: d.title, description: d.description, photos: d.photos, activities: Array.isArray(d.activities) ? d.activities : [] };
}
function normalizeZone(raw: unknown): Zone {
  const z = (raw ?? {}) as Partial<Zone>;
  return { id: z.id ?? "", name: z.name ?? "", emoji: z.emoji ?? "", days: Array.isArray(z.days) ? z.days.map(normalizeDay) : [] };
}
function normalizeItinerary(raw: unknown): Itinerary {
  const it = (raw ?? {}) as Partial<Itinerary>;
  return { id: it.id ?? "", name: it.name ?? "", zones: Array.isArray(it.zones) ? it.zones.map(normalizeZone) : [] };
}
function normalizeCheckCat(raw: unknown): CheckCat {
  const c = (raw ?? {}) as Partial<CheckCat>;
  return { id: c.id ?? "", name: c.name ?? "", items: Array.isArray(c.items) ? c.items : [] };
}

/** Fills in any fields missing from trip data saved by an older version of
 * the app — in particular, before `itineraries` existed, trips stored a
 * single flat `zones` array directly — and repairs the empty-array gaps
 * Firebase leaves behind. Safe to run on already-current data. */
export function normalizeTripData(raw: unknown): TripData {
  const r = (raw ?? {}) as Partial<TripData> & { zones?: Zone[] };
  const itineraries = Array.isArray(r.itineraries)
    ? r.itineraries.map(normalizeItinerary)
    : Array.isArray(r.zones) && r.zones.length > 0
    ? [{ id: "legacy", name: "Itinerario", zones: r.zones.map(normalizeZone) }]
    : [];
  return {
    checklist: Array.isArray(r.checklist) ? r.checklist.map(normalizeCheckCat) : [],
    flights: Array.isArray(r.flights) ? r.flights : [],
    hotels: Array.isArray(r.hotels) ? r.hotels : [],
    itineraries,
    tours: Array.isArray(r.tours) ? r.tours : [],
    budget: Array.isArray(r.budget) ? r.budget : [],
    people: Array.isArray(r.people) ? r.people : [],
  };
}

export const BUDGET_CATS = ["Vuelo", "Hotel", "Traslado", "Excursión", "Comida", "Compras", "Otros"];
export const ZONE_COLORS = ["#D97706", "#16A34A", "#0891B2", "#7C3AED", "#C2410C", "#0369A1", "#475569"];

export const TRIP_COLORS = ["#B85525", "#5E8E65", "#3B7DA8", "#8B5CF6", "#C2410C", "#0F766E", "#BE185D"];
export const TRIP_EMOJIS = ["🏝️", "🏔️", "🏛️", "🌆", "🗼", "🏜️", "🌋", "⛩️", "🏰", "🚢", "🎡", "🧭"];
