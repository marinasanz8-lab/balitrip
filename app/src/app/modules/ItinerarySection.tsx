import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { SectionHeader } from "./shared";
import { uid } from "../lib/util";
import { ZONE_COLORS, TRIP_EMOJIS, type Zone } from "../types";

export function ItinerarySection({ zones, setZones }: { zones: Zone[]; setZones: (v: Zone[] | ((p: Zone[]) => Zone[])) => void }) {
  const [activeZone, setActiveZone] = useState(0);
  const [newActs, setNewActs] = useState<Record<string, string>>({});
  const [newDayLabel, setNewDayLabel] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeZone >= zones.length) setActiveZone(Math.max(0, zones.length - 1));
  }, [zones.length, activeZone]);

  const zone = zones[activeZone];
  const color = ZONE_COLORS[activeZone % ZONE_COLORS.length];
  const days = zone?.days ?? [];

  const addAct = (did: string) => {
    const text = (newActs[did] || "").trim();
    if (!text) return;
    setZones((zs) => zs.map((z, i) => (i === activeZone ? { ...z, days: z.days.map((d) => (d.id === did ? { ...d, activities: [...d.activities, { id: uid(), text }] } : d)) } : z)));
    setNewActs((p) => ({ ...p, [did]: "" }));
  };

  const delAct = (did: string, aid: string) => {
    setZones((zs) => zs.map((z, i) => (i === activeZone ? { ...z, days: z.days.map((d) => (d.id === did ? { ...d, activities: d.activities.filter((a) => a.id !== aid) } : d)) } : z)));
  };

  const addDay = () => {
    const label = newDayLabel.trim();
    if (!label) return;
    setZones((zs) => zs.map((z, i) => (i === activeZone ? { ...z, days: [...z.days, { id: uid(), label, activities: [] }] } : z)));
    setNewDayLabel("");
  };

  const delDay = (did: string) => {
    setZones((zs) => zs.map((z, i) => (i === activeZone ? { ...z, days: z.days.filter((d) => d.id !== did) } : z)));
  };

  const addZone = () => {
    const name = newZoneName.trim();
    if (!name) return;
    const emoji = TRIP_EMOJIS[zones.length % TRIP_EMOJIS.length];
    setZones((zs) => [...zs, { id: uid(), name, emoji, days: [] }]);
    setNewZoneName("");
    setActiveZone(zones.length);
  };

  const delZone = (i: number) => {
    setZones((zs) => zs.filter((_, idx) => idx !== i));
  };

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

      {zones.length === 0 ? (
        <div className="px-4 max-w-4xl mx-auto">
          <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-4">Aún no hay zonas o etapas añadidas.</div>
        </div>
      ) : (
        <>
          <div ref={tabsRef} className="flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {zones.map((z, i) => {
              const isActive = i === activeZone;
              const col = ZONE_COLORS[i % ZONE_COLORS.length];
              return (
                <div key={z.id} className="flex-shrink-0 flex items-center group">
                  <button
                    onClick={() => setActiveZone(i)}
                    className="flex items-center gap-1.5 pl-3.5 pr-2 py-2 rounded-l-xl text-sm font-medium transition-all"
                    style={{ backgroundColor: isActive ? col : "var(--muted)", color: isActive ? "#fff" : "var(--muted-foreground)" }}
                  >
                    <span className="text-base">{z.emoji}</span>
                    <span className="whitespace-nowrap">{z.name}</span>
                  </button>
                  <button
                    onClick={() => delZone(i)}
                    className="px-1.5 py-2 rounded-r-xl transition-all"
                    style={{ backgroundColor: isActive ? col : "var(--muted)", color: isActive ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {zone && (
            <div className="px-4 max-w-4xl mx-auto mt-6 space-y-4">
              {days.map((day) => (
                <div key={day.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center gap-2 group" style={{ backgroundColor: color + "18", borderBottom: `1px solid ${color}30` }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] flex-1" style={{ color }}>{day.label}</span>
                    <button onClick={() => delDay(day.id)} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="p-4">
                    {day.activities.length > 0 ? (
                      <ul className="space-y-2 mb-3">
                        {day.activities.map((a) => (
                          <li key={a.id} className="flex items-start gap-2.5 group">
                            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="flex-1 text-sm leading-relaxed">{a.text}</span>
                            <button onClick={() => delAct(day.id, a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5 flex-shrink-0">
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mb-3">Sin actividades aún</p>
                    )}
                    <div className="flex gap-2">
                      <input
                        className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground"
                        placeholder="Añadir actividad..."
                        value={newActs[day.id] || ""}
                        onChange={(e) => setNewActs((p) => ({ ...p, [day.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addAct(day.id)}
                      />
                      <button onClick={() => addAct(day.id)} className="px-3 py-2 rounded-xl text-white transition-opacity hover:opacity-80 flex-shrink-0" style={{ backgroundColor: color }}>
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
                  placeholder="Nuevo día (ej. Lun 14 Sep)"
                  value={newDayLabel}
                  onChange={(e) => setNewDayLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDay()}
                />
                <button onClick={addDay} className="px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors flex-shrink-0 text-sm font-medium">Añadir día</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="px-4 max-w-4xl mx-auto mt-6 flex gap-2">
        <input
          className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
          placeholder="Nueva zona o etapa (ej. Ubud)"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addZone()}
        />
        <button onClick={addZone} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0 text-sm font-medium">Añadir zona</button>
      </div>
    </section>
  );
}
