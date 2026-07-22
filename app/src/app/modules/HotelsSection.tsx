import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, ExternalLink, MapPin, Navigation, Plus, Save, Trash2, X } from "lucide-react";
import { SectionHeader } from "./shared";
import { fileToResizedDataUrl, uid } from "../lib/util";
import type { HotelData } from "../types";

const EMPTY_HOTEL: HotelData = {
  id: "", name: "Nuevo hotel", zone: "", checkin: "", checkout: "", address: "", notes: "", stars: 0,
};

const EDIT_LABELS: { key: keyof HotelData; label: string }[] = [
  { key: "name", label: "Nombre" }, { key: "zone", label: "Zona" },
  { key: "checkin", label: "Check-in" }, { key: "checkout", label: "Check-out" },
  { key: "address", label: "Dirección" }, { key: "bookingLink", label: "Enlace de reserva" },
  { key: "notes", label: "Notas" },
];

export function HotelsSection({ hotels, setHotels }: { hotels: HotelData[]; setHotels: (v: HotelData[] | ((p: HotelData[]) => HotelData[])) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HotelData | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (h: HotelData) => { setEditId(h.id); setDraft({ ...h }); };
  const save = () => {
    if (!draft) return;
    setHotels((hs) => hs.map((h) => (h.id === draft.id ? draft : h)));
    setEditId(null); setDraft(null);
  };
  const addHotel = () => {
    const h = { ...EMPTY_HOTEL, id: uid() };
    setHotels((hs) => [...hs, h]);
    startEdit(h);
  };
  const delHotel = (id: string) => {
    setHotels((hs) => hs.filter((h) => h.id !== id));
    if (editId === id) { setEditId(null); setDraft(null); }
  };

  const onPhotoChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !draft) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 900, 0.72);
      setDraft({ ...draft, photo: dataUrl });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || hotels.length === 0) return;
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

  return (
    <section id="hoteles" className="py-14 md:py-20">
      <div className="px-4 max-w-4xl mx-auto mb-6">
        <SectionHeader eyebrow="Alojamientos" title="Hoteles" />
      </div>

      {hotels.length === 0 ? (
        <div className="px-4 max-w-4xl mx-auto">
          <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl">Aún no hay hoteles añadidos.</div>
        </div>
      ) : (
        <>
          <div className="relative max-w-4xl mx-auto px-4">
            {hotels.length > 1 && (
              <button
                onClick={() => scrollTo(activeIdx - 1)}
                disabled={activeIdx === 0}
                className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
              style={{
                scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none", msOverflowStyle: "none",
              }}
            >
              {hotels.map((h) => (
                <div
                  key={h.id}
                  style={{ scrollSnapAlign: "start", flexShrink: 0, width: "clamp(240px, 80vw, 280px)" }}
                >
                  <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
                  <div className="relative h-64 bg-muted overflow-hidden flex-shrink-0">
                    {h.photo ? (
                      <img src={h.photo} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏨</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {h.stars > 0 && (
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-0.5">
                        {Array.from({ length: h.stars }).map((_, i) => <span key={i} className="text-amber-400 text-[10px]">★</span>)}
                      </div>
                    )}
                    {h.zone && (
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">{h.zone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <h3 className="font-bold leading-snug text-[0.95rem]" style={{ fontFamily: "var(--font-display)" }}>{h.name}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(h)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"><Edit2 size={12} /></button>
                        <button onClick={() => delHotel(h.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {(h.checkin || h.checkout) && (
                      <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">
                        {h.checkin && h.checkout ? `${h.checkin} → ${h.checkout}` : h.checkin || h.checkout}
                      </p>
                    )}
                    {h.address && (
                      <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <MapPin size={10} className="flex-shrink-0 mt-px" /><span className="line-clamp-2">{h.address}</span>
                      </p>
                    )}
                    {h.notes && <p className="text-[11px] text-muted-foreground/75 italic line-clamp-2 mt-2 pt-2 border-t border-border">{h.notes}</p>}

                    {(h.bookingLink || h.address) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                        {h.bookingLink && (
                          <a href={h.bookingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors">
                            <ExternalLink size={10} /> Ver reserva
                          </a>
                        )}
                        {h.address && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(h.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors">
                            <Navigation size={10} /> Cómo llegar
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
            {hotels.length > 1 && (
              <button
                onClick={() => scrollTo(activeIdx + 1)}
                disabled={activeIdx === hotels.length - 1}
                className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 px-4">
            {hotels.map((_, i) => (
              <button
                key={i} onClick={() => scrollTo(i)} className="transition-all"
                style={{ width: i === activeIdx ? "1.5rem" : "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: i === activeIdx ? "var(--primary)" : "var(--border)" }}
              />
            ))}
          </div>
        </>
      )}

      {editId && draft && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setEditId(null); setDraft(null); }}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Editando alojamiento</p>
              <button onClick={() => { setEditId(null); setDraft(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChosen} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-20 h-14 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                {draft.photo ? <img src={draft.photo} className="w-full h-full object-cover" /> : <span className="text-xl">🏨</span>}
              </div>
              <button onClick={() => photoInputRef.current?.click()} className="text-xs px-3 py-2 bg-muted rounded-xl hover:bg-muted/70 transition-colors">Cambiar foto</button>
              <div className="flex items-center gap-1 ml-auto">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setDraft({ ...draft, stars: n })} className={`text-lg ${n <= draft.stars ? "text-amber-400" : "text-border"}`}>★</button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {EDIT_LABELS.map(({ key, label }) => (
                <div key={key} className={key === "notes" || key === "name" || key === "bookingLink" ? "sm:col-span-2" : ""}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input className="w-full text-sm bg-muted rounded-xl px-3 py-2 outline-none" value={draft[key] as string} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"><Save size={12} /> Guardar</button>
              <button onClick={() => { setEditId(null); setDraft(null); }} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 max-w-4xl mx-auto mt-6">
        <button onClick={addHotel} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:text-info hover:border-info/50 transition-colors">
          <Plus size={15} /> Añadir hotel
        </button>
      </div>
    </section>
  );
}
