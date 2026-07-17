import { useEffect, useRef, useState } from "react";
import { Camera, Compass, Edit2, Plus, Save, Trash2, User, X } from "lucide-react";
import { SectionHeader } from "./shared";
import { fileToResizedDataUrl, uid } from "../lib/util";
import { ZONE_COLORS, TRIP_EMOJIS, type Activity, type Day, type Itinerary, type Tour, type Zone } from "../types";

function compactDate(day: Day): string {
  if (day.date) {
    const d = new Date(day.date + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  }
  return day.label;
}

export function ItinerarySection({
  itineraries,
  setItineraries,
  tours = [],
}: {
  itineraries: Itinerary[];
  setItineraries: (v: Itinerary[] | ((p: Itinerary[]) => Itinerary[])) => void;
  tours?: Tour[];
}) {
  const [activeItin, setActiveItin] = useState(0);
  const [activeZone, setActiveZone] = useState(0);
  const [newActs, setNewActs] = useState<Record<string, string>>({});
  const [newDayLabel, setNewDayLabel] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoTargetDay = useRef<string | null>(null);

  useEffect(() => {
    if (activeItin >= itineraries.length) setActiveItin(Math.max(0, itineraries.length - 1));
  }, [itineraries.length, activeItin]);

  const itin = itineraries[activeItin];
  const zones = itin?.zones ?? [];

  useEffect(() => {
    if (activeZone >= zones.length) setActiveZone(Math.max(0, zones.length - 1));
  }, [zones.length, activeZone]);

  const zone = zones[activeZone];
  const color = ZONE_COLORS[activeZone % ZONE_COLORS.length];
  const days = zone?.days ?? [];
  const allDayOptions = zones.flatMap((z) => z.days.map((d) => ({ id: d.id, label: `${z.emoji} ${z.name} · ${d.label}` })));

  // Sets zones only within the currently active itinerary.
  const setZones = (updater: Zone[] | ((p: Zone[]) => Zone[])) => {
    setItineraries((its) => its.map((it, i) => (i === activeItin ? { ...it, zones: typeof updater === "function" ? (updater as (p: Zone[]) => Zone[])(it.zones) : updater } : it)));
  };
  const updateDay = (dayId: string, patch: Partial<Day>) => {
    setZones((zs) => zs.map((z, i) => (i === activeZone ? { ...z, days: z.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) } : z)));
  };

  const addItinerary = () => {
    const name = `Itinerario ${itineraries.length + 1}`;
    setItineraries((its) => [...its, { id: uid(), name, zones: [] }]);
    setActiveItin(itineraries.length);
  };
  const delItinerary = (i: number) => setItineraries((its) => its.filter((_, idx) => idx !== i));
  const startRename = (i: number) => { setRenamingIdx(i); setRenameValue(itineraries[i].name); };
  const commitRename = (i: number) => {
    const name = renameValue.trim();
    if (name) setItineraries((its) => its.map((it, idx) => (idx === i ? { ...it, name } : it)));
    setRenamingIdx(null);
  };

  const addAct = (did: string) => {
    const text = (newActs[did] || "").trim();
    if (!text) return;
    updateDay(did, { activities: [...(days.find((d) => d.id === did)?.activities ?? []), { id: uid(), text }] });
    setNewActs((p) => ({ ...p, [did]: "" }));
  };

  const delAct = (did: string, aid: string) => {
    const day = days.find((d) => d.id === did);
    if (!day) return;
    updateDay(did, { activities: day.activities.filter((a) => a.id !== aid) });
  };

  const moveAct = (fromDayId: string, activityId: string, toDayId: string) => {
    if (!toDayId || fromDayId === toDayId) return;
    setZones((zs) => {
      let moved: Activity | undefined;
      const stripped = zs.map((z) => ({
        ...z,
        days: z.days.map((d) => {
          if (d.id !== fromDayId) return d;
          moved = d.activities.find((a) => a.id === activityId);
          return { ...d, activities: d.activities.filter((a) => a.id !== activityId) };
        }),
      }));
      if (!moved) return zs;
      return stripped.map((z) => ({ ...z, days: z.days.map((d) => (d.id === toDayId ? { ...d, activities: [...d.activities, moved as Activity] } : d)) }));
    });
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

  const startEditDay = (day: Day) => {
    setEditingDay(day.id);
    setEditTitle(day.title || "");
    setEditDesc(day.description || "");
  };
  const saveEditDay = () => {
    if (!editingDay) return;
    updateDay(editingDay, { title: editTitle.trim(), description: editDesc.trim() });
    setEditingDay(null);
  };

  const triggerPhoto = (dayId: string) => {
    photoTargetDay.current = dayId;
    photoInputRef.current?.click();
  };

  const onPhotoChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const dayId = photoTargetDay.current;
    if (!files.length || !dayId) return;
    const results = await Promise.all(files.map((f) => fileToResizedDataUrl(f, 1100, 0.72).catch(() => null)));
    const newPhotos = results.filter((r): r is string => !!r);
    if (!newPhotos.length) return;
    const day = days.find((d) => d.id === dayId);
    updateDay(dayId, { photos: [...(day?.photos ?? []), ...newPhotos] });
  };

  const removePhoto = (dayId: string, idx: number) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, { photos: (day.photos ?? []).filter((_, i) => i !== idx) });
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
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoChosen} />

      {/* Itinerary tabs — one per person/track */}
      <div className="px-4 max-w-4xl mx-auto mb-5 flex items-center gap-2 flex-wrap">
        {itineraries.map((it, i) => {
          const isActive = i === activeItin;
          if (renamingIdx === i) {
            return (
              <input
                key={it.id}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(i)}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(i); if (e.key === "Escape") setRenamingIdx(null); }}
                className="text-sm font-medium px-3.5 py-2 rounded-full bg-muted outline-none ring-2 ring-info w-36"
              />
            );
          }
          return (
            <div key={it.id} className="flex items-center group">
              <button
                onClick={() => setActiveItin(i)}
                onDoubleClick={() => startRename(i)}
                title="Doble clic para renombrar"
                className="flex items-center gap-1.5 pl-3.5 pr-2 py-2 rounded-l-full text-sm font-medium transition-all"
                style={{ backgroundColor: isActive ? "var(--primary)" : "var(--muted)", color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
              >
                <User size={13} />
                <span className="whitespace-nowrap">{it.name}</span>
              </button>
              {itineraries.length > 1 && (
                <button
                  onClick={() => delItinerary(i)}
                  className="px-1.5 py-2 rounded-r-full transition-all"
                  style={{ backgroundColor: isActive ? "var(--primary)" : "var(--muted)", color: isActive ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addItinerary}
          title="Añadir itinerario para otra persona"
          className="flex items-center gap-1 pl-2.5 pr-3 py-2 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-info hover:border-info/50 transition-colors"
        >
          <Plus size={13} /> Itinerario
        </button>
      </div>

      {!itin ? (
        <div className="px-4 max-w-4xl mx-auto">
          <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-dashed border-border rounded-2xl mb-4">Crea un itinerario para empezar.</div>
        </div>
      ) : zones.length === 0 ? (
        <div className="px-4 max-w-4xl mx-auto">
          <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-4">Aún no hay zonas o etapas añadidas en «{itin.name}».</div>
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
            <div className="px-4 max-w-4xl mx-auto mt-6 space-y-5">
              {days.map((day) => {
                const photos = day.photos ?? [];
                return (
                  <div key={day.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Date + title header */}
                    <div className="px-5 pt-5 flex items-start gap-3">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: color + "18", color }}
                      >
                        {compactDate(day)}
                      </span>
                      <div className="flex-1 min-w-0">
                        {day.title ? (
                          <h3 className="font-bold leading-snug" style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>{day.title}</h3>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Sin título todavía</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => (editingDay === day.id ? saveEditDay() : startEditDay(day))} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          {editingDay === day.id ? <Save size={14} /> : <Edit2 size={14} />}
                        </button>
                        <button onClick={() => delDay(day.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      {editingDay === day.id ? (
                        <div className="mt-3 space-y-2">
                          <input
                            className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none font-medium"
                            placeholder="Título del día (ej. Cascadas y atardecer en Tanah Lot)"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <textarea
                            className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none resize-y leading-relaxed"
                            rows={5}
                            placeholder="Describe el plan del día — separa párrafos con una línea en blanco."
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                          />
                          <button onClick={() => setEditingDay(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                        </div>
                      ) : (
                        day.description && (
                          <div className="mt-3 space-y-2.5">
                            {day.description.split(/\n\s*\n/).map((para, i) => (
                              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
                            ))}
                          </div>
                        )
                      )}

                      {/* Photo gallery */}
                      <div className="grid grid-cols-4 gap-1.5 mt-4" style={{ gridAutoRows: "72px" }}>
                        {photos.map((p, idx) => (
                          <div
                            key={idx}
                            className="relative group/photo overflow-hidden rounded-lg bg-muted"
                            style={idx === 0 ? { gridColumn: "span 2", gridRow: "span 2" } : undefined}
                          >
                            <img src={p} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removePhoto(day.id, idx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => triggerPhoto(day.id)}
                          className="rounded-lg border border-dashed border-border text-muted-foreground hover:text-info hover:border-info/50 transition-colors flex items-center justify-center"
                          style={photos.length === 0 ? { gridColumn: "span 2", gridRow: "span 2" } : undefined}
                        >
                          <Camera size={photos.length === 0 ? 20 : 14} />
                        </button>
                      </div>

                      {tours.filter((t) => t.dayId === day.id).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {tours.filter((t) => t.dayId === day.id).map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-info/10 text-info">
                              <Compass size={10} /> {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick activities checklist */}
                      <div className="mt-4 pt-4 border-t border-border">
                        {day.activities.length > 0 && (
                          <ul className="space-y-2 mb-3">
                            {day.activities.map((a) => (
                              <li key={a.id} className="flex items-start gap-2.5 group">
                                <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="flex-1 text-sm leading-relaxed">{a.text}</span>
                                {allDayOptions.length > 1 && (
                                  <select
                                    defaultValue=""
                                    title="Mover a otro día"
                                    onChange={(e) => { moveAct(day.id, a.id, e.target.value); e.currentTarget.value = ""; }}
                                    className="opacity-0 group-hover:opacity-100 transition-all text-[11px] bg-transparent text-muted-foreground hover:text-foreground outline-none cursor-pointer flex-shrink-0"
                                  >
                                    <option value="" disabled>→ mover</option>
                                    {allDayOptions.filter((o) => o.id !== day.id).map((o) => (
                                      <option key={o.id} value={o.id}>{o.label}</option>
                                    ))}
                                  </select>
                                )}
                                <button onClick={() => delAct(day.id, a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all mt-0.5 flex-shrink-0">
                                  <X size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex gap-2">
                          <input
                            className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground"
                            placeholder="Nota rápida o actividad suelta..."
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
                  </div>
                );
              })}

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

      {itin && (
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
      )}
    </section>
  );
}
