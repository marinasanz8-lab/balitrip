import { useState, useEffect, useRef } from "react";
import heroImg from "@/imports/image-4.jpg";
import hotelGrandmasImg from "@/imports/image-5.jpg";
import hotelHydeImg from "@/imports/image-6.jpg";
import {
  Plane, MapPin, Edit2, X, Check,
  Plus, Trash2, Save, Navigation, ExternalLink, Link, Share2, ArrowDownUp, RefreshCw,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

const copyToClipboard = (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    resolve();
  });
};

const encodeShare = (data: object) => {
  try {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const str = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    return btoa(str);
  } catch { return ""; }
};

const decodeShare = (str: string): object | null => {
  try {
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
};

function usePersisted<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV] as const;
}

/* ─── types ───────────────────────────────────────────── */
type CheckItem = { id: string; text: string; done: boolean };
type CheckCat = { id: string; name: string; items: CheckItem[] };
type FlightData = {
  leg: string; date: string; dep: string; arr: string;
  from: string; to: string; duration: string;
  airline: string; stops: string; notes: string;
};
type HotelData = {
  id: string; name: string; zone: string; checkin: string;
  checkout: string; address: string; notes: string; stars: number;
};
type Activity = { id: string; text: string };
type Day = { id: string; label: string; activities: Activity[] };
type Zone = { id: string; name: string; emoji: string; days: Day[] };
type BudgetItem = { id: string; desc: string; cat: string; zone: string; amount: number };

/* ─── default data ────────────────────────────────────── */
const DEF_CHECK: CheckCat[] = [
  {
    id: "docs", name: "Documentación", items: [
      { id: uid(), text: "Pasaporte (vigente +6 meses desde la vuelta)", done: false },
      { id: uid(), text: "e-VOA Indonesia — visado electrónico", done: false },
      { id: uid(), text: "Seguro de viaje con cobertura médica", done: false },
      { id: uid(), text: "Reservas impresas (vuelos y hoteles)", done: false },
      { id: uid(), text: "Carnet de conducir internacional", done: false },
      { id: uid(), text: "Fotocopia del pasaporte en el móvil", done: false },
    ],
  },
  {
    id: "gear", name: "Equipaje", items: [
      { id: uid(), text: "Adaptador de enchufe (tipo C/F → tipo I)", done: false },
      { id: uid(), text: "Protector solar SPF50+", done: false },
      { id: uid(), text: "Ropa ligera y transpirable", done: false },
      { id: uid(), text: "Bañador / bikini", done: false },
      { id: uid(), text: "Repelente de mosquitos", done: false },
      { id: uid(), text: "Botiquín básico", done: false },
      { id: uid(), text: "Calzado para templos (sarong)", done: false },
      { id: uid(), text: "Cámara / GoPro / batería extra", done: false },
      { id: uid(), text: "Bolsa impermeable para ferry", done: false },
    ],
  },
];

const DEF_FLIGHTS: FlightData[] = [
  {
    leg: "IDA", date: "Sábado, 12 Sep 2026",
    dep: "22:30", arr: "23:30 +1",
    from: "Barcelona (BCN)", to: "Denpasar (DPS)",
    duration: "19h 00min", airline: "—",
    stops: "1 escala", notes: "Llegada domingo 13 Sep",
  },
  {
    leg: "VUELTA", date: "Viernes, 25 Sep 2026",
    dep: "18:45", arr: "07:35 +1",
    from: "Denpasar (DPS)", to: "Barcelona (BCN)",
    duration: "18h 50min", airline: "—",
    stops: "1 escala", notes: "Llegada sábado 26 Sep",
  },
];

const DEF_HOTELS: HotelData[] = [
  {
    id: "h1", name: "Grandmas Plus Hotel Airport", zone: "Kuta · Aeropuerto",
    checkin: "Dom 13 Sep · desde 15:00", checkout: "Lun 14 Sep · hasta 12:00",
    address: "Jl. Bypass Ngurah Rai No.99, Tuban, Kuta",
    notes: "Habitación Doble Cozy · Desayuno incluido · 2 hab, 4 adultos",
    stars: 3,
  },
  {
    id: "h2", name: "Por confirmar", zone: "Ubud",
    checkin: "Dom 14 Sep", checkout: "Jue 18 Sep",
    address: "", notes: "", stars: 0,
  },
  {
    id: "h3", name: "Por confirmar", zone: "Gili",
    checkin: "Jue 18 Sep", checkout: "Dom 21 Sep",
    address: "", notes: "", stars: 0,
  },
  {
    id: "h4", name: "Hyde Boutique Hotel", zone: "Lombok",
    checkin: "Lun 21 Sep · desde 14:00", checkout: "Jue 24 Sep · hasta 11:00",
    address: "Jl. Raya Kuta No.5, 83573 Kuta Lombok",
    notes: "Suite con vistas a la piscina · 3 noches · 2 hab, 4 adultos",
    stars: 4,
  },
  {
    id: "h5", name: "Por confirmar", zone: "Uluwatu",
    checkin: "Jue 24 Sep", checkout: "Vie 25 Sep",
    address: "", notes: "", stars: 0,
  },
];

const DEF_ZONES: Zone[] = [
  {
    id: "z1", name: "Vuelo", emoji: "✈️",
    days: [
      { id: "d1a", label: "Sáb 12 Sep", activities: [{ id: uid(), text: "Salida BCN 22:30" }, { id: uid(), text: "Escala (pendiente confirmar)" }] },
      { id: "d1b", label: "Dom 13 Sep", activities: [{ id: uid(), text: "Llegada DPS 23:30" }] },
    ],
  },
  {
    id: "z2", name: "Kuta", emoji: "🌴",
    days: [
      {
        id: "d2a", label: "Dom 13 Sep", activities: [
          { id: uid(), text: "Llegada aeropuerto DPS" },
          { id: uid(), text: "Check-in Grandmas Plus Hotel" },
          { id: uid(), text: "Descanso y primera noche en Bali" },
        ],
      },
    ],
  },
  {
    id: "z3", name: "Ubud", emoji: "🌿",
    days: [
      { id: "d3a", label: "Lun 14 Sep", activities: [{ id: uid(), text: "Traslado a Ubud" }, { id: uid(), text: "Check-in hotel · exploración del centro" }] },
      { id: "d3b", label: "Mar 15 Sep", activities: [{ id: uid(), text: "Monkey Forest Sanctuary" }, { id: uid(), text: "Mercado artesanal de Ubud" }] },
      { id: "d3c", label: "Mié 16 Sep", activities: [{ id: uid(), text: "Campos de arroz de Tegallalang" }, { id: uid(), text: "Cascada Tegenungan" }] },
      { id: "d3d", label: "Jue 17 Sep", activities: [{ id: uid(), text: "Clase de cocina balinesa" }, { id: uid(), text: "Templo Pura Tirta Empul" }] },
      { id: "d3e", label: "Vie 18 Sep", activities: [{ id: uid(), text: "Mañana libre · compras" }, { id: uid(), text: "Traslado al ferry hacia Gili" }] },
    ],
  },
  {
    id: "z4", name: "Gili", emoji: "🐠",
    days: [
      { id: "d4a", label: "Vie 18 Sep", activities: [{ id: uid(), text: "Ferry Bali → Gili Trawangan" }, { id: uid(), text: "Check-in hotel" }] },
      { id: "d4b", label: "Sáb 19 Sep", activities: [{ id: uid(), text: "Snorkeling con tortugas marinas" }, { id: uid(), text: "Bicicleta por la isla" }] },
      { id: "d4c", label: "Dom 20 Sep", activities: [{ id: uid(), text: "Visita Gili Meno" }, { id: uid(), text: "Puesta de sol en la playa" }] },
      { id: "d4d", label: "Lun 21 Sep", activities: [{ id: uid(), text: "Mañana libre · preparar maletas" }, { id: uid(), text: "Ferry → Lombok" }] },
    ],
  },
  {
    id: "z5", name: "Lombok", emoji: "🏔️",
    days: [
      { id: "d5a", label: "Lun 21 Sep", activities: [{ id: uid(), text: "Llegada · Check-in Hyde Boutique Hotel" }, { id: uid(), text: "Tarde libre · piscina" }] },
      { id: "d5b", label: "Mar 22 Sep", activities: [{ id: uid(), text: "Playa Kuta Lombok" }, { id: uid(), text: "Atardecer desde la costa" }] },
      { id: "d5c", label: "Mié 23 Sep", activities: [{ id: uid(), text: "Exploración por los alrededores" }, { id: uid(), text: "Mercado local" }] },
      { id: "d5d", label: "Jue 24 Sep", activities: [{ id: uid(), text: "Check-out · traslado a Uluwatu" }] },
    ],
  },
  {
    id: "z6", name: "Uluwatu", emoji: "🌊",
    days: [
      {
        id: "d6a", label: "Jue 24 Sep", activities: [
          { id: uid(), text: "Llegada a Uluwatu" },
          { id: uid(), text: "Templo de Uluwatu (acantilados)" },
          { id: uid(), text: "Danza Kecak al atardecer" },
          { id: uid(), text: "Playa Padang Padang" },
        ],
      },
    ],
  },
  {
    id: "z7", name: "Vuelta", emoji: "🏠",
    days: [
      {
        id: "d7a", label: "Vie 25 Sep", activities: [
          { id: uid(), text: "Traslado aeropuerto DPS" },
          { id: uid(), text: "Salida DPS 18:45" },
          { id: uid(), text: "Llegada BCN 07:35 (+1)" },
        ],
      },
    ],
  },
];

const DEF_BUDGET: BudgetItem[] = [
  { id: uid(), desc: "Grandmas Plus Hotel Airport", cat: "Hotel", zone: "Kuta", amount: 51 },
  { id: uid(), desc: "Hyde Boutique Hotel · 3 noches", cat: "Hotel", zone: "Lombok", amount: 252 },
];

const BUDGET_CATS = ["Vuelo", "Hotel", "Traslado", "Excursión", "Comida", "Compras", "Otros"];
const BUDGET_ZONES = ["General", "Kuta", "Ubud", "Gili", "Lombok", "Uluwatu"];
const ZONE_COLORS = ["#D97706", "#16A34A", "#0891B2", "#7C3AED", "#C2410C", "#0369A1", "#475569"];

/* ─── Countdown ───────────────────────────────────────── */
function Countdown() {
  const target = new Date("2026-09-12T00:00:00+02:00").getTime();
  const calc = () => Math.max(0, target - Date.now());
  const [rem, setRem] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  const days = Math.floor(rem / 86400000);
  const hrs = Math.floor((rem % 86400000) / 3600000);
  const min = Math.floor((rem % 3600000) / 60000);
  const sec = Math.floor((rem % 60000) / 1000);
  return (
    <div className="flex gap-5 md:gap-10 justify-center flex-wrap">
      {([["Días", days], ["Horas", hrs], ["Min", min], ["Seg", sec]] as [string, number][]).map(
        ([label, val]) => (
          <div key={label} className="text-center min-w-[3.5rem]">
            <div
              className="tabular-nums leading-none text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: 700 }}
            >
              {String(val).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 mt-2">{label}</div>
          </div>
        )
      )}
    </div>
  );
}

/* ─── Section header ──────────────────────────────────── */
function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1.5">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
    </div>
  );
}

/* ─── Currency Converter ──────────────────────────────── */
function CurrencyConverter() {
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [idr, setIdr] = useState("100000");
  const [eur, setEur] = useState("");
  const [reversed, setReversed] = useState(false);

  const fetchRate = () => {
    setLoading(true);
    fetch("https://api.frankfurter.app/latest?from=IDR&to=EUR")
      .then((r) => r.json())
      .then((data) => {
        const r: number = data.rates.EUR;
        setRate(r);
        setRateDate(data.date);
        setEur((100000 * r).toFixed(2));
        setLoading(false);
      })
      .catch(() => {
        const fallback = 0.000057;
        setRate(fallback);
        setEur((100000 * fallback).toFixed(2));
        setLoading(false);
      });
  };

  useEffect(() => { fetchRate(); }, []);

  const fmtIdr = (n: number) =>
    n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
  const fmtEur = (n: number) =>
    n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleIdr = (val: string) => {
    const clean = val.replace(/\./g, "").replace(/,/g, "");
    setIdr(clean);
    const n = parseFloat(clean);
    if (!isNaN(n) && rate) setEur(fmtEur(n * rate));
    else setEur("");
  };

  const handleEur = (val: string) => {
    const clean = val.replace(/\./g, "").replace(",", ".");
    setEur(val);
    const n = parseFloat(clean);
    if (!isNaN(n) && rate) setIdr(String(Math.round(n / rate)));
    else setIdr("");
  };

  const idrNum = parseFloat(idr.replace(/\./g, "").replace(",", ".")) || 0;
  const eurNum = rate ? idrNum * rate : 0;

  return (
    <section id="conversor" className="py-14 px-4 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-7">
        <SectionHeader eyebrow="Divisas" title="Conversor" />
        <button
          onClick={fetchRate}
          disabled={loading}
          className="pb-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* IDR row */}
        <div className={`p-5 ${reversed ? "order-2" : "order-1"}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Rupia indonesia
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IDR</span>
          </div>
          <input
            className="w-full bg-transparent outline-none font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 6vw, 2.5rem)" }}
            value={fmtIdr(idrNum)}
            onChange={(e) => handleIdr(e.target.value)}
            inputMode="numeric"
          />
        </div>

        {/* Divider + swap */}
        <div className="relative h-px bg-border">
          <button
            onClick={() => setReversed((r) => !r)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            <ArrowDownUp size={14} />
          </button>
        </div>

        {/* EUR row */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Euro
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">EUR</span>
          </div>
          <div
            className="font-bold text-primary"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 6vw, 2.5rem)" }}
          >
            {loading ? (
              <span className="text-muted-foreground text-2xl animate-pulse">—</span>
            ) : (
              fmtEur(eurNum)
            )}
          </div>
        </div>
      </div>

      {/* Rate info */}
      {rate && !loading && (
        <p className="text-[11px] text-muted-foreground mt-3 text-center" style={{ fontFamily: "var(--font-mono)" }}>
          1 EUR = {fmtIdr(1 / rate)} IDR · actualizado {rateDate}
        </p>
      )}

      {/* Quick amounts */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
          <button
            key={amt}
            onClick={() => handleIdr(String(amt))}
            className="text-xs px-3 py-1.5 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
          >
            {fmtIdr(amt)} Rp
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Checklist ───────────────────────────────────────── */
function ChecklistSection({ cats, setCats }: { cats: CheckCat[]; setCats: (v: CheckCat[]) => void }) {
  const [newTexts, setNewTexts] = useState<Record<string, string>>({});

  const toggle = (cid: string, iid: string) =>
    setCats(cats.map((c) =>
      c.id === cid ? { ...c, items: c.items.map((i) => i.id === iid ? { ...i, done: !i.done } : i) } : c
    ));

  const addItem = (cid: string) => {
    const text = (newTexts[cid] || "").trim();
    if (!text) return;
    setCats(cats.map((c) => c.id === cid ? { ...c, items: [...c.items, { id: uid(), text, done: false }] } : c));
    setNewTexts((p) => ({ ...p, [cid]: "" }));
  };

  const del = (cid: string, iid: string) =>
    setCats(cats.map((c) => c.id === cid ? { ...c, items: c.items.filter((i) => i.id !== iid) } : c));

  const total = cats.reduce((s, c) => s + c.items.length, 0);
  const done = cats.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section id="checklist" className="py-14 px-4 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <SectionHeader eyebrow="Antes de salir" title="Checklist" />
        <div className="text-right pb-1">
          <div className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{pct}%</div>
          <div className="text-xs text-muted-foreground">{done}/{total}</div>
        </div>
      </div>
      <div className="h-1 bg-muted rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {cats.map((cat) => (
          <div key={cat.id} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">{cat.name}</h3>
            <ul className="space-y-3">
              {cat.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => toggle(cat.id, item.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.done ? "bg-primary border-primary" : "border-border hover:border-primary/60"
                    }`}
                  >
                    {item.done && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm leading-relaxed ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                  <button onClick={() => del(cat.id, item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5 flex-shrink-0">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <input
                className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground"
                placeholder="Añadir ítem..."
                value={newTexts[cat.id] || ""}
                onChange={(e) => setNewTexts((p) => ({ ...p, [cat.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addItem(cat.id)}
              />
              <button onClick={() => addItem(cat.id)} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
                <Plus size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Flights ─────────────────────────────────────────── */
function FlightsSection({ flights, setFlights }: { flights: FlightData[]; setFlights: (v: FlightData[]) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<FlightData | null>(null);
  const startEdit = (i: number) => { setEditIdx(i); setDraft({ ...flights[i] }); };
  const save = () => {
    if (editIdx === null || !draft) return;
    const u = [...flights]; u[editIdx] = draft;
    setFlights(u); setEditIdx(null); setDraft(null);
  };
  const EDIT_LABELS: { key: keyof FlightData; label: string }[] = [
    { key: "airline", label: "Aerolínea" }, { key: "dep", label: "Salida" },
    { key: "arr", label: "Llegada" }, { key: "from", label: "Origen" },
    { key: "to", label: "Destino" }, { key: "duration", label: "Duración" },
    { key: "stops", label: "Escalas" }, { key: "notes", label: "Notas" },
  ];
  return (
    <section id="vuelos" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Trayectos" title="Vuelos" />
      <div className="flex items-center justify-center gap-4 mb-8">
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 7vw, 3.5rem)", fontWeight: 900 }}>BCN</span>
        <div className="flex flex-col items-center gap-0.5">
          <Plane size={16} className="text-primary rotate-45" />
          <div className="w-16 h-px bg-border" />
          <Plane size={16} className="text-muted-foreground -rotate-[135deg]" />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 7vw, 3.5rem)", fontWeight: 900 }}>DPS</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {flights.map((f, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${i === 0 ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                {f.leg}
              </span>
              <button onClick={() => editIdx === i ? save() : startEdit(i)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                {editIdx === i ? <Save size={14} /> : <Edit2 size={14} />}
              </button>
            </div>
            {editIdx === i && draft ? (
              <div className="space-y-2.5">
                {EDIT_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{label}</label>
                    <input className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none" value={draft[key] as string} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  </div>
                ))}
                <button onClick={() => { setEditIdx(null); setDraft(null); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{f.date}</p>
                <div className="flex items-center gap-2 mb-4">
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{f.dep}</div>
                    <div className="text-xs text-muted-foreground mt-1">{f.from}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1 px-1">
                    <div className="text-[10px] text-muted-foreground">{f.duration}</div>
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 h-px bg-border" />
                      <Plane size={12} className="text-primary" />
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{f.stops}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{f.arr}</div>
                    <div className="text-xs text-muted-foreground mt-1">{f.to}</div>
                  </div>
                </div>
                {f.notes && <p className="text-xs text-muted-foreground italic">{f.notes}</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Hotels carousel ─────────────────────────────────── */
const HOTEL_PHOTOS: Record<string, string> = {
  h1: hotelGrandmasImg,
  h2: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=700&h=500&fit=crop&auto=format&q=80",
  h3: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=700&h=500&fit=crop&auto=format&q=80",
  h4: hotelHydeImg,
  h5: "https://images.unsplash.com/photo-1776761420375-c50a5a3b2e0d?w=700&h=500&fit=crop&auto=format&q=80",
};

const HOTEL_MAPS_LINKS: Record<string, string> = {
  h1: "https://maps.app.goo.gl/GqpZvGqBqUJk2AsN7",
};

const HOTEL_BOOKING_LINKS: Record<string, string> = {
  h1: "https://secure.booking.com/confirmation.es.html?label=gen173bo-10CAsoaEIZZ3JhbmRtYXNob3RlbHMtbmd1cmFoLXJhaUgKWANoRogBAZgBM7gBB8gBDNgBA-gBAfgBAYgCAZgCBKgCAbgCrovT0gbAAgHSAiQzMGI5ZTg0Zi03ODI3LTQwM2EtOTgwNC1mNTRiOWEzNWJjZTXYAgHgAgE&sid=c840599003ac262d05154338455d9920&aid=304142&auth_key=10Dlw9E5FWyZsh9w&source=mytrips",
  h4: "https://secure.booking.com/confirmation.es.html?label=gen173bo-10CAsoaEIZZ3JhbmRtYXNob3RlbHMtbmd1cmFoLXJhaUgKWANoRogBAZgBM7gBB8gBDNgBA-gBAfgBAYgCAZgCBKgCAbgCrovT0gbAAgHSAiQzMGI5ZTg0Zi03ODI3LTQwM2EtOTgwNC1mNTRiOWEzNWJjZTXYAgHgAgE&sid=c840599003ac262d05154338455d9920&aid=304142&auth_key=MeFBPz7KvwFLIiDG&source=mytrips",
};

function HotelsSection({ hotels, setHotels }: { hotels: HotelData[]; setHotels: (v: HotelData[]) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HotelData | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startEdit = (h: HotelData) => { setEditId(h.id); setDraft({ ...h }); };
  const save = () => {
    if (!draft) return;
    setHotels(hotels.map((h) => (h.id === draft.id ? draft : h)));
    setEditId(null); setDraft(null);
  };

  const EDIT_LABELS: { key: keyof HotelData; label: string }[] = [
    { key: "name", label: "Nombre" }, { key: "checkin", label: "Check-in" },
    { key: "checkout", label: "Check-out" }, { key: "address", label: "Dirección" }, { key: "notes", label: "Notas" },
  ];

  // Track which card is centered via scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = el.scrollWidth / hotels.length;
      const idx = Math.round(el.scrollLeft / cardW);
      setActiveIdx(Math.max(0, Math.min(idx, hotels.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hotels.length]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[idx] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const confirmed = (h: HotelData) => h.name !== "Por confirmar";

  return (
    <section id="hoteles" className="py-14">
      <div className="px-4 max-w-4xl mx-auto mb-6">
        <SectionHeader eyebrow="Alojamientos" title="Hoteles" />
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingInline: "clamp(1rem, calc(50% - 140px), 5rem)",
        }}
      >
        {hotels.map((h, idx) => {
          const photo = HOTEL_PHOTOS[h.id];
          const isConf = confirmed(h);
          return (
            <div
              key={h.id}
              style={{
                scrollSnapAlign: "center",
                flexShrink: 0,
                width: "clamp(260px, 75vw, 300px)",
                transition: "transform 0.3s, opacity 0.3s",
                transform: idx === activeIdx ? "scale(1)" : "scale(0.93)",
                opacity: idx === activeIdx ? 1 : 0.65,
              }}
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
                {/* Photo */}
                <div className="relative h-52 bg-muted overflow-hidden flex-shrink-0">
                  {photo ? (
                    <img src={photo} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏨</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {h.stars > 0 && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-0.5">
                      {Array.from({ length: h.stars }).map((_, i) => (
                        <span key={i} className="text-amber-400 text-[10px]">★</span>
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {h.zone}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-1.5 mb-2">
                    <h3 className="font-bold leading-snug text-[0.95rem]" style={{ fontFamily: "var(--font-display)" }}>
                      {h.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isConf && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-accent bg-accent/12 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Check size={8} strokeWidth={3} /> Reservado
                        </span>
                      )}
                      <button onClick={() => startEdit(h)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                  {(h.checkin || h.checkout) && (
                    <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">
                      {h.checkin && h.checkout ? `${h.checkin} → ${h.checkout}` : h.checkin || h.checkout}
                    </p>
                  )}
                  {h.address && (
                    <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                      <MapPin size={10} className="flex-shrink-0 mt-px" />
                      <span className="line-clamp-2">{h.address}</span>
                    </p>
                  )}
                  {h.notes && (
                    <p className="text-[11px] text-muted-foreground/75 italic line-clamp-2 mt-2 pt-2 border-t border-border">{h.notes}</p>
                  )}
                  {!isConf && (
                    <p className="text-[11px] text-muted-foreground/60 italic mt-2">Pendiente de reservar</p>
                  )}

                  {/* Action buttons */}
                  {(HOTEL_BOOKING_LINKS[h.id] || h.address) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                      {HOTEL_BOOKING_LINKS[h.id] && (
                        <a
                          href={HOTEL_BOOKING_LINKS[h.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink size={10} /> Ver reserva
                        </a>
                      )}
                      {h.address && (
                        <a
                          href={HOTEL_MAPS_LINKS[h.id] ?? `https://maps.google.com/?q=${encodeURIComponent(h.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                        >
                          <Navigation size={10} /> Cómo llegar
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-5 px-4">
        {hotels.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="transition-all"
            style={{
              width: i === activeIdx ? "1.5rem" : "0.5rem",
              height: "0.5rem",
              borderRadius: "9999px",
              backgroundColor: i === activeIdx ? "var(--primary)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* Edit panel */}
      {editId && draft && (
        <div className="mt-6 mx-4 max-w-4xl md:mx-auto bg-card border border-primary/30 rounded-2xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Editando · {draft.zone}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {EDIT_LABELS.map(({ key, label }) => (
              <div key={key} className={key === "notes" || key === "name" ? "sm:col-span-2" : ""}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input
                  className="w-full text-sm bg-muted rounded-xl px-3 py-2 outline-none"
                  value={draft[key] as string}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
              <Save size={12} /> Guardar
            </button>
            <button onClick={() => { setEditId(null); setDraft(null); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Itinerary (tabs + days) ─────────────────────────── */
function ItinerarySection({ zones, setZones }: { zones: Zone[]; setZones: (v: Zone[]) => void }) {
  const [activeZone, setActiveZone] = useState(0);
  const [newActs, setNewActs] = useState<Record<string, string>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  const zone = zones[activeZone];
  const color = ZONE_COLORS[activeZone % ZONE_COLORS.length];
  const days = zone?.days ?? [];

  const addAct = (did: string) => {
    const text = (newActs[did] || "").trim();
    if (!text) return;
    setZones(zones.map((z, i) =>
      i === activeZone
        ? { ...z, days: z.days.map((d) => d.id === did ? { ...d, activities: [...d.activities, { id: uid(), text }] } : d) }
        : z
    ));
    setNewActs((p) => ({ ...p, [did]: "" }));
  };

  const delAct = (did: string, aid: string) => {
    setZones(zones.map((z, i) =>
      i === activeZone
        ? { ...z, days: z.days.map((d) => d.id === did ? { ...d, activities: d.activities.filter((a) => a.id !== aid) } : d) }
        : z
    ));
  };

  // Scroll active tab into view
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const tab = el.children[activeZone] as HTMLElement;
    if (tab) tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeZone]);

  return (
    <section id="itinerario" className="py-14">
      <div className="px-4 max-w-4xl mx-auto">
        <SectionHeader eyebrow="Día a día" title="Itinerario" />
      </div>

      {/* Tab bar */}
      <div
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {zones.map((z, i) => {
          const isActive = i === activeZone;
          const col = ZONE_COLORS[i % ZONE_COLORS.length];
          return (
            <button
              key={z.id}
              onClick={() => setActiveZone(i)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? col : "var(--muted)",
                color: isActive ? "#fff" : "var(--muted-foreground)",
              }}
            >
              <span className="text-base">{z.emoji}</span>
              <span className="whitespace-nowrap">{z.name}</span>
            </button>
          );
        })}
      </div>

      {/* Zone content */}
      {zone && (
        <div className="px-4 max-w-4xl mx-auto mt-6 space-y-4">
          {days.map((day) => (
            <div key={day.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Day header */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ backgroundColor: color + "18", borderBottom: `1px solid ${color}30` }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color }}>
                  {day.label}
                </span>
              </div>

              {/* Activities */}
              <div className="p-4">
                {day.activities.length > 0 ? (
                  <ul className="space-y-2 mb-3">
                    {day.activities.map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5 group">
                        <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="flex-1 text-sm leading-relaxed">{a.text}</span>
                        <button
                          onClick={() => delAct(day.id, a.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic mb-3">Sin actividades aún</p>
                )}

                {/* Add input */}
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground"
                    placeholder="Añadir actividad..."
                    value={newActs[day.id] || ""}
                    onChange={(e) => setNewActs((p) => ({ ...p, [day.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addAct(day.id)}
                  />
                  <button
                    onClick={() => addAct(day.id)}
                    className="px-3 py-2 rounded-xl text-white transition-opacity hover:opacity-80 flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Budget ──────────────────────────────────────────── */
function BudgetSection({ items, setItems, onShare }: { items: BudgetItem[]; setItems: (v: BudgetItem[]) => void; onShare: () => void }) {
  const [form, setForm] = useState({ desc: "", cat: "Hotel", zone: "General", amount: "" });
  const add = () => {
    const amount = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amount) || amount <= 0) return;
    setItems([...items, { id: uid(), desc: form.desc.trim(), cat: form.cat, zone: form.zone, amount }]);
    setForm((p) => ({ ...p, desc: "", amount: "" }));
  };
  const total = items.reduce((s, i) => s + i.amount, 0);
  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const byCategory = BUDGET_CATS.map((cat) => ({
    cat, total: items.filter((i) => i.cat === cat).reduce((s, i) => s + i.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <section id="presupuesto" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Control de gastos" title="Presupuesto" />
      <div className="flex items-baseline gap-2 mb-7">
        <span className="text-primary" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
          {fmt(total)} €
        </span>
        <span className="text-muted-foreground text-sm">total</span>
      </div>

      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
          {byCategory.map(({ cat, total: t }) => (
            <div key={cat} className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{cat}</div>
              <div className="font-semibold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{fmt(t)} €</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Añadir gasto</p>
        <div className="space-y-2">
          <input
            className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
            placeholder="Descripción"
            value={form.desc}
            onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="text-sm bg-muted rounded-xl px-3 py-2.5 outline-none cursor-pointer" value={form.cat} onChange={(e) => setForm((p) => ({ ...p, cat: e.target.value }))}>
              {BUDGET_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="text-sm bg-muted rounded-xl px-3 py-2.5 outline-none cursor-pointer" value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}>
              {BUDGET_ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number" min={0}
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
              placeholder="Importe (€)"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button onClick={add} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Descripción</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Cat.</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Zona</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">€</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 !== 0 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-3">{item.desc}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{item.cat}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{item.zone}</td>
                    <td className="px-4 py-3 text-right text-xs" style={{ fontFamily: "var(--font-mono)" }}>{fmt(item.amount)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setItems(items.filter((x) => x.id !== item.id))} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-4 py-3 font-bold text-xs uppercase tracking-wide" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
          Añade tu primer gasto para empezar a llevar el control
        </div>
      )}

      {/* Share button */}
      <button
        onClick={onShare}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-all active:scale-95"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Share2 size={16} /> Compartir actualización
      </button>
    </section>
  );
}

/* ─── Divider ─────────────────────────────────────────── */
function Divider() {
  return <div className="max-w-4xl mx-auto px-4"><div className="h-px bg-border" /></div>;
}

/* ─── App ─────────────────────────────────────────────── */
export default function App() {
  const [checklist, setChecklist] = usePersisted<CheckCat[]>("bali-check", DEF_CHECK);
  const [flights, setFlights] = usePersisted<FlightData[]>("bali-flights", DEF_FLIGHTS);
  const [hotels, setHotels] = usePersisted<HotelData[]>("bali-hotels", DEF_HOTELS);
  const [zones, setZones] = usePersisted<Zone[]>("bali-zones-v2", DEF_ZONES);
  const [budget, setBudget] = usePersisted<BudgetItem[]>("bali-budget-v2", DEF_BUDGET);

  // Scroll to top on mount + load shared data from URL hash
  useEffect(() => {
    window.scrollTo(0, 0);
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      const encoded = hash.slice(7);
      const data = decodeShare(encoded) as Record<string, unknown> | null;
      if (data) {
        if (data.checklist) setChecklist(data.checklist as CheckCat[]);
        if (data.flights) setFlights(data.flights as FlightData[]);
        if (data.hotels) setHotels(data.hotels as HotelData[]);
        if (data.zones) setZones(data.zones as Zone[]);
        if (data.budget) setBudget(data.budget as BudgetItem[]);
        // Clean the hash so refreshing doesn't re-import
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  // Migrate stale zone data that lacks the `days` structure
  useEffect(() => {
    if (zones.some((z) => !Array.isArray((z as Zone).days))) {
      setZones(DEF_ZONES);
    }
  }, []);

  const buildShareUrl = () => {
    const data = { checklist, flights, hotels, zones, budget };
    const encoded = encodeShare(data);
    return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
  };

  const [copied, setCopied] = useState(false);
  const shareLink = () => {
    const url = buildShareUrl();
    copyToClipboard(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
      .catch(() => prompt("Copia este enlace:", url));
  };

  const shareUpdate = async () => {
    const url = buildShareUrl();
    if (navigator.share) {
      await navigator.share({
        title: "Bali 2026 🌴",
        text: "Aquí tienes la última versión de nuestra planificación del viaje:",
        url,
      });
    } else {
      copyToClipboard(url)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => prompt("Copia este enlace:", url));
    }
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const NAV = [
    { id: "conversor", label: "Conversor" },
    { id: "checklist", label: "Checklist" },
    { id: "vuelos", label: "Vuelos" },
    { id: "hoteles", label: "Hoteles" },
    { id: "itinerario", label: "Itinerario" },
    { id: "presupuesto", label: "Presupuesto" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative flex flex-col" style={{ minHeight: "100svh", maxHeight: "980px" }}>
        <img
          src={heroImg}
          alt="Arrozales de Tegallalang, Bali"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3">
          <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase" style={{ fontFamily: "var(--font-mono)" }}>
            Bali · Sep 2026
          </span>
          <div className="flex gap-3">
            <button onClick={shareLink} className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors">
              <Link size={11} /> {copied ? "¡Copiado!" : "Compartir"}
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.35em] mb-4">Marina · Eva · Mercè · Víctor</p>
          <h1
            className="text-white leading-none tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(5rem, 20vw, 10rem)", fontWeight: 900 }}
          >
            BALI
          </h1>
          <p className="text-white/50 mb-12" style={{ fontSize: "clamp(0.8rem, 3vw, 1.1rem)" }}>
            12 — 25 Septiembre 2026
          </p>
          <Countdown />
          <p className="text-white/25 text-[9px] mt-5 uppercase tracking-[0.25em]">hasta el despegue</p>
        </div>

        {/* Hero nav */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-4 pb-6">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="px-3.5 py-1.5 text-[11px] font-medium text-white/65 hover:text-white hover:bg-white/12 rounded-full transition-all border border-white/15 backdrop-blur-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-bold text-sm text-primary mr-3 whitespace-nowrap flex-shrink-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bali 2026
          </button>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all whitespace-nowrap flex-shrink-0"
            >
              {item.label}
            </button>
          ))}
          <div className="ml-auto flex gap-1 flex-shrink-0 pl-2">
            <button
              onClick={shareLink}
              className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg transition-all whitespace-nowrap"
              style={{ color: copied ? "var(--accent)" : "var(--muted-foreground)", backgroundColor: copied ? "var(--accent)" + "18" : undefined }}
            >
              <Link size={11} /> {copied ? "¡Copiado!" : "Compartir"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Sections ── */}
      <CurrencyConverter />
      <Divider />
      <ChecklistSection cats={checklist} setCats={setChecklist} />
      <Divider />
      <FlightsSection flights={flights} setFlights={setFlights} />
      <Divider />
      <HotelsSection hotels={hotels} setHotels={setHotels} />
      <Divider />
      <ItinerarySection zones={zones} setZones={setZones} />
      <Divider />
      <BudgetSection items={budget} setItems={setBudget} onShare={shareUpdate} />

      <footer className="py-8 text-center border-t border-border mt-8">
        <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          Bali 2026 · Datos guardados en tu navegador
        </p>
      </footer>
    </div>
  );
}
