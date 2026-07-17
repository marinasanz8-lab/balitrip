import { useState } from "react";
import { Compass, Edit2, ExternalLink, MapPinned, Plus, Save, Trash2 } from "lucide-react";
import { SectionHeader } from "./shared";
import { uid } from "../lib/util";
import type { Tour, Zone } from "../types";

const EMPTY_TOUR: Omit<Tour, "id"> = { name: "", notes: "", price: null, link: "", dayId: undefined };

function dayOptions(zones: Zone[]): { id: string; label: string }[] {
  const opts: { id: string; label: string }[] = [];
  for (const z of zones) for (const d of z.days) opts.push({ id: d.id, label: `${z.emoji} ${z.name} · ${d.label}` });
  return opts;
}

export function TourSection({ tours, setTours, zones }: { tours: Tour[]; setTours: (v: Tour[] | ((p: Tour[]) => Tour[])) => void; zones: Zone[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Tour | null>(null);
  const options = dayOptions(zones);

  const dayLabel = (dayId?: string) => options.find((o) => o.id === dayId)?.label;

  const startEdit = (t: Tour) => { setEditId(t.id); setDraft({ ...t }); };
  const addTour = () => {
    const t: Tour = { ...EMPTY_TOUR, id: uid(), name: "Nuevo tour" };
    setTours((ts) => [...ts, t]);
    startEdit(t);
  };
  const save = () => {
    if (!draft) return;
    setTours((ts) => ts.map((t) => (t.id === draft.id ? draft : t)));
    setEditId(null); setDraft(null);
  };
  const delTour = (id: string) => {
    setTours((ts) => ts.filter((t) => t.id !== id));
    if (editId === id) { setEditId(null); setDraft(null); }
  };

  const fmtPrice = (p: number | null) => (p == null ? null : `${p.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

  return (
    <section id="tours" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Excursiones" title="Tours" />

      {tours.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-4">Aún no hay tours añadidos.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {tours.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Compass size={15} className="text-primary flex-shrink-0" />
                  <h3 className="font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{t.name}</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => (editId === t.id ? save() : startEdit(t))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    {editId === t.id ? <Save size={14} /> : <Edit2 size={14} />}
                  </button>
                  <button onClick={() => delTour(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all"><Trash2 size={14} /></button>
                </div>
              </div>

              {editId === t.id && draft ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Nombre</label>
                    <input className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Precio (€)</label>
                    <input type="number" min={0} className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none" value={draft.price ?? ""} onChange={(e) => setDraft({ ...draft, price: e.target.value === "" ? null : parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Enlace</label>
                    <input className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Día asignado</label>
                    <select className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none cursor-pointer" value={draft.dayId ?? ""} onChange={(e) => setDraft({ ...draft, dayId: e.target.value || undefined })}>
                      <option value="">Sin asignar</option>
                      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Notas</label>
                    <input className="w-full text-sm bg-muted rounded-lg px-3 py-1.5 outline-none" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                  </div>
                  <button onClick={() => { setEditId(null); setDraft(null); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {fmtPrice(t.price) && <span className="text-sm font-semibold text-primary" style={{ fontFamily: "var(--font-mono)" }}>{fmtPrice(t.price)}</span>}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPinned size={11} /> {dayLabel(t.dayId) ?? "Sin asignar a un día"}
                    </span>
                  </div>
                  {t.notes && <p className="text-xs text-muted-foreground mb-2">{t.notes}</p>}
                  {t.link && (
                    <a href={t.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <ExternalLink size={10} /> Ver / reservar
                    </a>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={addTour} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors">
        <Plus size={15} /> Añadir tour
      </button>
    </section>
  );
}
