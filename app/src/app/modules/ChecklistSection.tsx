import { useState } from "react";
import { Check, Plus, Sparkles, Trash2, X } from "lucide-react";
import { SectionHeader } from "./shared";
import { uid } from "../lib/util";
import { generateChecklist } from "../lib/ai";
import type { CheckCat, TripMeta } from "../types";

export function ChecklistSection({
  cats,
  setCats,
  trip,
}: {
  cats: CheckCat[];
  setCats: (v: CheckCat[] | ((p: CheckCat[]) => CheckCat[])) => void;
  trip: TripMeta;
}) {
  const [newTexts, setNewTexts] = useState<Record<string, string>>({});
  const [newCatName, setNewCatName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const toggle = (cid: string, iid: string) =>
    setCats((cs) => cs.map((c) => (c.id === cid ? { ...c, items: c.items.map((i) => (i.id === iid ? { ...i, done: !i.done } : i)) } : c)));

  const addItem = (cid: string) => {
    const text = (newTexts[cid] || "").trim();
    if (!text) return;
    setCats((cs) => cs.map((c) => (c.id === cid ? { ...c, items: [...c.items, { id: uid(), text, done: false }] } : c)));
    setNewTexts((p) => ({ ...p, [cid]: "" }));
  };

  const del = (cid: string, iid: string) =>
    setCats((cs) => cs.map((c) => (c.id === cid ? { ...c, items: c.items.filter((i) => i.id !== iid) } : c)));

  const addCat = () => {
    const name = newCatName.trim();
    if (!name) return;
    setCats((cs) => [...cs, { id: uid(), name, items: [] }]);
    setNewCatName("");
  };

  const delCat = (cid: string) => setCats((cs) => cs.filter((c) => c.id !== cid));

  const runAi = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const generated = await generateChecklist(trip);
      setCats((cs) => [...cs, ...generated]);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "No se pudo generar la checklist.");
    } finally {
      setAiLoading(false);
    }
  };

  const total = cats.reduce((s, c) => s + c.items.length, 0);
  const done = cats.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section id="checklist" className="py-14 md:py-20 px-4 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <SectionHeader eyebrow="Antes de salir" title="Checklist" />
        {total > 0 && (
          <div className="text-right pb-1">
            <div className="text-2xl font-bold text-info" style={{ fontFamily: "var(--font-display)" }}>{pct}%</div>
            <div className="text-xs text-muted-foreground">{done}/{total}</div>
          </div>
        )}
      </div>
      {total > 0 && (
        <div className="h-1 bg-muted rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-info rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={runAi}
          disabled={aiLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors disabled:opacity-60"
        >
          <Sparkles size={13} className={aiLoading ? "animate-pulse" : ""} />
          {aiLoading ? "Generando…" : "Generar con IA"}
        </button>
        {aiError && <span className="text-xs text-destructive">{aiError}</span>}
      </div>

      {cats.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-4">
          Aún no hay categorías. Añade una manualmente o genera una checklist con IA.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cats.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 group/cat">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{cat.name}</h3>
                <button onClick={() => delCat(cat.id)} className="opacity-0 group-hover/cat:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => toggle(cat.id, item.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.done ? "bg-primary border-primary" : "border-border hover:border-info/60"
                      }`}
                    >
                      {item.done && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                    </button>
                    <span className={`flex-1 text-sm leading-relaxed ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
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
      )}

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          placeholder="Nueva categoría (ej. Salud, Dinero...)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCat()}
        />
        <button onClick={addCat} className="px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors flex-shrink-0 text-sm font-medium">
          Añadir categoría
        </button>
      </div>
    </section>
  );
}
