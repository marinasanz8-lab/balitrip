import { useRef, useState } from "react";
import { ClipboardPaste, Edit2, Plane, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { SectionHeader } from "./shared";
import { extractFlightFromImage } from "../lib/ai";
import { parseFlightText } from "../lib/parseFlightText";
import type { FlightData } from "../types";

const EMPTY_FLIGHT: FlightData = {
  leg: "TRAYECTO", date: "", dep: "", arr: "", from: "", to: "",
  duration: "", airline: "", stops: "", notes: "",
};

const EDIT_LABELS: { key: keyof FlightData; label: string }[] = [
  { key: "leg", label: "Trayecto (ej. IDA)" }, { key: "date", label: "Fecha" },
  { key: "airline", label: "Aerolínea" }, { key: "dep", label: "Salida" },
  { key: "arr", label: "Llegada" }, { key: "from", label: "Origen" },
  { key: "to", label: "Destino" }, { key: "duration", label: "Duración" },
  { key: "stops", label: "Escalas" }, { key: "notes", label: "Notas" },
];

export function FlightsSection({ flights, setFlights }: { flights: FlightData[]; setFlights: (v: FlightData[] | ((p: FlightData[]) => FlightData[])) => void }) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<FlightData | null>(null);
  const [aiIdx, setAiIdx] = useState<number | null>(null);
  const [aiError, setAiError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");

  const startEdit = (i: number) => { setEditIdx(i); setDraft({ ...flights[i] }); };
  const save = () => {
    if (editIdx === null || !draft) return;
    setFlights((fs) => fs.map((f, i) => (i === editIdx ? draft : f)));
    setEditIdx(null); setDraft(null);
  };
  const addFlight = () => {
    setFlights((fs) => [...fs, { ...EMPTY_FLIGHT }]);
    setEditIdx(flights.length);
    setDraft({ ...EMPTY_FLIGHT });
  };
  const delFlight = (i: number) => {
    setFlights((fs) => fs.filter((_, idx) => idx !== i));
    if (editIdx === i) { setEditIdx(null); setDraft(null); }
  };

  const triggerAiImport = (i: number) => {
    setAiIdx(i);
    setAiError("");
    fileInputRef.current?.click();
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || aiIdx === null) return;
    const idx = aiIdx;
    try {
      const extracted = await extractFlightFromImage(file);
      setFlights((fs) => fs.map((f, i) => (i === idx ? { ...f, ...extracted } : f)));
      startEdit(idx);
      setDraft((d) => (d ? { ...d, ...extracted } : d));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "No se pudo leer la captura.");
    } finally {
      setAiIdx(null);
    }
  };

  const extractFromText = () => {
    setPasteError("");
    const extracted = parseFlightText(pasteText);
    if (extracted.length === 0) {
      setPasteError("No se ha reconocido ningún vuelo en ese texto. Revisa el formato (fecha, horas y aeropuertos con código de 3 letras) o añádelo a mano.");
      return;
    }
    setFlights((fs) => [...fs, ...extracted]);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <section id="vuelos" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Trayectos" title="Vuelos" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
      {aiError && <p className="text-xs text-destructive mb-4">{aiError}</p>}

      {flights.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-4">
          Aún no hay vuelos añadidos.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {flights.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-info/10 text-info">
                  {f.leg || "Trayecto"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => triggerAiImport(i)}
                    title="Importar de captura con IA"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-info hover:bg-info/10 transition-all"
                  >
                    <Sparkles size={14} className={aiIdx === i ? "animate-pulse" : ""} />
                  </button>
                  <button onClick={() => (editIdx === i ? save() : startEdit(i))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    {editIdx === i ? <Save size={14} /> : <Edit2 size={14} />}
                  </button>
                  <button onClick={() => delFlight(i)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
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
                  {f.date && <p className="text-xs text-muted-foreground mb-3">{f.date}</p>}
                  <div className="flex items-center gap-2 mb-4">
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{f.dep || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-1">{f.from}</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1 px-1">
                      <div className="text-[10px] text-muted-foreground">{f.duration}</div>
                      <div className="w-full flex items-center gap-1">
                        <div className="flex-1 h-px bg-border" />
                        <Plane size={12} className="text-info" />
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="text-[10px] text-muted-foreground">{f.stops}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{f.arr || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-1">{f.to}</div>
                    </div>
                  </div>
                  {f.notes && <p className="text-xs text-muted-foreground italic">{f.notes}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={addFlight}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:text-info hover:border-info/50 transition-colors"
        >
          <Plus size={15} /> Añadir vuelo
        </button>
        <button
          onClick={() => { setPasteOpen((v) => !v); setPasteError(""); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:text-info hover:border-info/50 transition-colors"
        >
          <ClipboardPaste size={15} /> Pegar texto de la reserva
        </button>
      </div>

      {pasteOpen && (
        <div className="mt-3 bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-2">
            Pega el párrafo con los datos del vuelo (fecha, horas, aeropuertos con código de 3 letras y duración por
            trayecto) y se rellenará solo — sin IA, gratis.
          </p>
          <textarea
            className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground resize-y"
            rows={6}
            placeholder={"Ida — 12 sep 2026\nBarcelona (BCN) 22:30 → Denpasar Bali (DPS) 23:30 (+1)\nDuración: 19h, 1 escala"}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          {pasteError && <p className="text-xs text-destructive mt-2">{pasteError}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={extractFromText} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium">
              Extraer vuelos
            </button>
            <button onClick={() => { setPasteOpen(false); setPasteText(""); setPasteError(""); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
