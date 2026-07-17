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

export const BUDGET_CATS = ["Vuelo", "Hotel", "Traslado", "Excursión", "Comida", "Compras", "Otros"];
export const ZONE_COLORS = ["#D97706", "#16A34A", "#0891B2", "#7C3AED", "#C2410C", "#0369A1", "#475569"];

export const TRIP_COLORS = ["#B85525", "#5E8E65", "#3B7DA8", "#8B5CF6", "#C2410C", "#0F766E", "#BE185D"];
export const TRIP_EMOJIS = ["🏝️", "🏔️", "🏛️", "🌆", "🗼", "🏜️", "🌋", "⛩️", "🏰", "🚢", "🎡", "🧭"];
