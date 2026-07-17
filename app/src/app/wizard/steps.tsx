import { useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { OptionalStepFrame, type WizardState } from "./shared";
import { fieldSetter, fileToResizedDataUrl, dayLabelAt, tripLengthDays, uid } from "../lib/util";
import { ChecklistSection } from "../modules/ChecklistSection";
import { FlightsSection } from "../modules/FlightsSection";
import { TourSection } from "../modules/TourSection";
import { PeopleEditor } from "../modules/shared";
import { COMMON_CURRENCIES, MODULE_LABELS, TRIP_COLORS, TRIP_EMOJIS, type Day, type TripData, type TripMeta } from "../types";

export type StepProps = { state: WizardState; setState: (s: WizardState) => void };

function useTripSetters(state: WizardState, setState: (s: WizardState) => void) {
  const setMeta = (meta: TripMeta) => setState({ ...state, meta });
  const updateData = (updater: TripData | ((p: TripData) => TripData)) =>
    setState({ ...state, data: typeof updater === "function" ? (updater as (p: TripData) => TripData)(state.data) : updater });
  return { setMeta, updateData };
}

/* ─── 1. Dónde vamos ──────────────────────────────────────── */
export function StepDestination({ state, setState }: StepProps) {
  const { meta } = state;
  const { setMeta } = useTripSetters(state, setState);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const onCoverChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400, 0.75);
      setMeta({ ...meta, cover: dataUrl });
    } catch { /* ignore */ }
  };

  return (
    <div>
      <p className="text-lg font-medium mb-4">¿Dónde vamos?</p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Nombre del viaje</label>
          <input autoFocus className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" placeholder="ej. Japón 2027" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Destino</label>
          <input className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" placeholder="ej. Tokio y Kioto, Japón" value={meta.destination} onChange={(e) => setMeta({ ...meta, destination: e.target.value })} />
        </div>
      </div>

      <label className="text-xs text-muted-foreground block mb-2">Portada y color</label>
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverChosen} />
      <div className="flex items-center gap-4 mb-4">
        <div className="w-24 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: meta.cover ? undefined : `linear-gradient(135deg, ${meta.color}, ${meta.color}99)` }}>
          {meta.cover ? <img src={meta.cover} className="w-full h-full object-cover" /> : <span className="text-3xl">{meta.emoji}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => coverInputRef.current?.click()} className="text-xs px-3 py-2 bg-muted rounded-xl hover:bg-muted/70 transition-colors w-fit">Subir foto de cabecera</button>
          {meta.cover && <button onClick={() => setMeta({ ...meta, cover: undefined })} className="text-xs text-muted-foreground hover:text-destructive transition-colors w-fit">Quitar foto</button>}
        </div>
      </div>
      {!meta.cover && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TRIP_EMOJIS.map((em) => (
              <button key={em} onClick={() => setMeta({ ...meta, emoji: em })} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${meta.emoji === em ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"}`}>
                {em}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRIP_COLORS.map((c) => (
              <button key={c} onClick={() => setMeta({ ...meta, color: c })} className="w-7 h-7 rounded-full transition-all" style={{ backgroundColor: c, outline: meta.color === c ? "2px solid var(--foreground)" : "none", outlineOffset: 2 }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── 2. Fechas ───────────────────────────────────────────── */
export function StepDates({ state, setState }: StepProps) {
  const { meta } = state;
  const { setMeta } = useTripSetters(state, setState);
  return (
    <div>
      <p className="text-lg font-medium mb-1">¿Cuándo viajáis?</p>
      <p className="text-sm text-muted-foreground mb-4">Con las fechas podemos calcular la cuenta atrás y repartir los días del itinerario.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Salida</label>
          <input type="date" className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={meta.startDate} onChange={(e) => setMeta({ ...meta, startDate: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Vuelta</label>
          <input type="date" className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={meta.endDate} onChange={(e) => setMeta({ ...meta, endDate: e.target.value })} min={meta.startDate || undefined} />
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Vuelos ───────────────────────────────────────────── */
export function StepFlights({ state, setState }: StepProps) {
  const { meta, data } = state;
  const { setMeta, updateData } = useTripSetters(state, setState);
  return (
    <OptionalStepFrame question="¿Quieres añadir los vuelos?" moduleId="vuelos" meta={meta} setMeta={setMeta}>
      <FlightsSection flights={data.flights} setFlights={fieldSetter(updateData, "flights")} />
    </OptionalStepFrame>
  );
}

/* ─── 4. Checklist ────────────────────────────────────────── */
export function StepChecklist({ state, setState }: StepProps) {
  const { meta, data } = state;
  const { setMeta, updateData } = useTripSetters(state, setState);
  return (
    <OptionalStepFrame question="¿Quieres añadir una checklist?" hint="Puedes generar propuestas con IA a partir del destino, o crearla a mano." moduleId="checklist" meta={meta} setMeta={setMeta}>
      <ChecklistSection cats={data.checklist} setCats={fieldSetter(updateData, "checklist")} trip={meta} />
    </OptionalStepFrame>
  );
}

/* ─── 5. Conversor ────────────────────────────────────────── */
export function StepCurrency({ state, setState }: StepProps) {
  const { meta } = state;
  const { setMeta } = useTripSetters(state, setState);
  return (
    <OptionalStepFrame question="¿Quieres añadir el conversor de divisas?" hint="Elige la moneda local del destino." moduleId="conversor" meta={meta} setMeta={setMeta}>
      <div className="flex flex-wrap gap-1.5">
        {COMMON_CURRENCIES.map((c) => (
          <button key={c} onClick={() => setMeta({ ...meta, currency: c })} className={`text-xs font-medium px-3 py-2 rounded-xl transition-colors ${meta.currency === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {c}
          </button>
        ))}
      </div>
    </OptionalStepFrame>
  );
}

/* ─── 6. Itinerario (huecos) ─────────────────────────────── */
export function StepItinerary({ state, setState }: StepProps) {
  const { meta, data } = state;
  const { setMeta, updateData } = useTripSetters(state, setState);
  const totalDays = tripLengthDays(meta.startDate, meta.endDate);
  const allocated = data.zones.reduce((s, z) => s + z.days.length, 0);
  const remaining = Math.max(1, totalDays - allocated || 1);

  const [place, setPlace] = useState("");
  const [count, setCount] = useState(remaining);

  const addZone = () => {
    const name = place.trim();
    if (!name) return;
    const emoji = TRIP_EMOJIS[data.zones.length % TRIP_EMOJIS.length];
    const n = Math.max(1, count);
    const days: Day[] = Array.from({ length: n }).map((_, i) => {
      const offset = allocated + i;
      if (meta.startDate) {
        const { iso, label } = dayLabelAt(meta.startDate, offset);
        return { id: uid(), label, date: iso, activities: [] };
      }
      return { id: uid(), label: `Día ${offset + 1}`, activities: [] };
    });
    updateData((p) => ({ ...p, zones: [...p.zones, { id: uid(), name, emoji, days }] }));
    setPlace("");
    setCount(Math.max(1, remaining - n));
  };

  const delZone = (id: string) => updateData((p) => ({ ...p, zones: p.zones.filter((z) => z.id !== id) }));

  return (
    <OptionalStepFrame
      question="¿Quieres añadir el itinerario?"
      hint="Reparte los días del viaje entre los sitios que vais a visitar. Los planes de cada día los iréis rellenando después, dentro del viaje."
      moduleId="itinerario"
      meta={meta}
      setMeta={setMeta}
    >
      {totalDays > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{allocated} de {totalDays} días repartidos</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (allocated / totalDays) * 100)}%` }} />
          </div>
        </div>
      )}

      {data.zones.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.zones.map((z) => (
            <div key={z.id} className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5">
              <span className="text-lg">{z.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{z.name}</div>
                <div className="text-xs text-muted-foreground">
                  {z.days.length} día{z.days.length !== 1 ? "s" : ""}{z.days[0] ? ` · desde ${z.days[0].label}` : ""}
                </div>
              </div>
              <button onClick={() => delZone(z.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          placeholder="Sitio (ej. Ubud)" value={place}
          onChange={(e) => setPlace(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addZone()}
        />
        <input
          type="number" min={1}
          className="w-20 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none text-center"
          value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)}
        />
        <button onClick={addZone} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0 text-sm font-medium">Añadir</button>
      </div>
    </OptionalStepFrame>
  );
}

/* ─── 7. Tours ────────────────────────────────────────────── */
export function StepTours({ state, setState }: StepProps) {
  const { meta, data } = state;
  const { setMeta, updateData } = useTripSetters(state, setState);
  return (
    <OptionalStepFrame
      question="¿Quieres añadir algún tour o excursión?"
      hint={data.zones.length === 0 ? "Puedes dejarlos sin asignar a un día, o volver al paso anterior para añadir primero el itinerario." : "Puedes asignar cada uno a un día del itinerario, o dejarlo sin asignar."}
      moduleId="tours"
      meta={meta}
      setMeta={setMeta}
    >
      <TourSection tours={data.tours} setTours={fieldSetter(updateData, "tours")} zones={data.zones} />
    </OptionalStepFrame>
  );
}

/* ─── 8. Presupuesto ──────────────────────────────────────── */
export function StepBudget({ state, setState }: StepProps) {
  const { meta, data } = state;
  const { setMeta, updateData } = useTripSetters(state, setState);
  return (
    <OptionalStepFrame
      question="¿Quieres añadir el módulo de presupuesto?"
      hint="Añade quién viaja para poder repartir los gastos automáticamente. Los gastos en sí los iréis añadiendo durante el viaje, según vayáis pagando cosas."
      moduleId="presupuesto"
      meta={meta}
      setMeta={setMeta}
    >
      <PeopleEditor people={data.people} setPeople={fieldSetter(updateData, "people")} />
    </OptionalStepFrame>
  );
}

/* ─── 9. Listo ────────────────────────────────────────────── */
export function StepDone({ state }: StepProps) {
  const { meta } = state;
  return (
    <div className="text-center py-6">
      <div
        className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-4xl overflow-hidden"
        style={{ background: meta.cover ? undefined : `linear-gradient(135deg, ${meta.color}, ${meta.color}99)` }}
      >
        {meta.cover ? <img src={meta.cover} className="w-full h-full object-cover" /> : meta.emoji}
      </div>
      <p className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>{meta.name || "Tu viaje"}</p>
      <p className="text-sm text-muted-foreground mb-6">{meta.destination}</p>
      {meta.modules.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
          {meta.modules.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full bg-primary/10 text-primary">
              <Check size={11} /> {MODULE_LABELS[m]}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Sin módulos activados todavía — podrás añadirlos cuando quieras desde Ajustes.</p>
      )}
    </div>
  );
}
