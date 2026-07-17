import { useRef, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useWorkspace } from "./lib/workspace";
import { fileToResizedDataUrl } from "./lib/util";
import { AISettings } from "./components/AISettings";
import { ALL_MODULES, COMMON_CURRENCIES, MODULE_LABELS, TRIP_COLORS, TRIP_EMOJIS, type ModuleId, type TripMeta } from "./types";

export function TripSettings({ trip, onBack, onDeleted }: { trip: TripMeta; onBack: () => void; onDeleted: () => void }) {
  const { updateTripMeta, deleteTrip } = useWorkspace();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const toggleModule = (m: ModuleId) => {
    const has = trip.modules.includes(m);
    const modules = has ? trip.modules.filter((x) => x !== m) : [...trip.modules, m];
    updateTripMeta(trip.id, { modules });
  };

  const onCoverChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400, 0.75);
      updateTripMeta(trip.id, { cover: dataUrl });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={15} /> Volver al viaje
        </button>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>Ajustes del viaje</h1>

        <div className="space-y-6">
          {/* Cover */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-4">Portada</h3>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverChosen} />
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: trip.cover ? undefined : `linear-gradient(135deg, ${trip.color}, ${trip.color}99)` }}
              >
                {trip.cover ? <img src={trip.cover} className="w-full h-full object-cover" /> : <span className="text-3xl">{trip.emoji}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => coverInputRef.current?.click()} className="text-xs px-3 py-2 bg-muted rounded-xl hover:bg-muted/70 transition-colors w-fit">Subir foto</button>
                {trip.cover && (
                  <button onClick={() => updateTripMeta(trip.id, { cover: undefined })} className="text-xs text-muted-foreground hover:text-destructive transition-colors w-fit">Quitar foto</button>
                )}
              </div>
            </div>
            {!trip.cover && (
              <>
                <p className="text-xs text-muted-foreground mt-4 mb-2">O elige un icono y color</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TRIP_EMOJIS.map((em) => (
                    <button
                      key={em} onClick={() => updateTripMeta(trip.id, { emoji: em })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${trip.emoji === em ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRIP_COLORS.map((c) => (
                    <button
                      key={c} onClick={() => updateTripMeta(trip.id, { color: c })}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ backgroundColor: c, outline: trip.color === c ? "2px solid var(--foreground)" : "none", outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Basic info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm mb-1">Información</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nombre</label>
              <input className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={trip.name} onChange={(e) => updateTripMeta(trip.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Destino</label>
              <input className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={trip.destination} onChange={(e) => updateTripMeta(trip.id, { destination: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Salida</label>
                <input type="date" className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={trip.startDate} onChange={(e) => updateTripMeta(trip.id, { startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Vuelta</label>
                <input type="date" className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none" value={trip.endDate} onChange={(e) => updateTripMeta(trip.id, { endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Moneda local</label>
              <select className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none cursor-pointer" value={trip.currency} onChange={(e) => updateTripMeta(trip.id, { currency: e.target.value })}>
                {COMMON_CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Modules */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-1">Módulos</h3>
            <p className="text-xs text-muted-foreground mb-4">Elige qué secciones se muestran en este viaje.</p>
            <div className="space-y-2">
              {ALL_MODULES.map((m) => (
                <label key={m} className="flex items-center gap-3 py-1.5 cursor-pointer">
                  <input type="checkbox" checked={trip.modules.includes(m)} onChange={() => toggleModule(m)} className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm">{MODULE_LABELS[m]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* AI */}
          <AISettings />

          {/* Danger zone */}
          <div className="bg-card border border-destructive/30 rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-1 text-destructive">Eliminar viaje</h3>
            <p className="text-xs text-muted-foreground mb-4">Se borrará para todos los que tengan el enlace. No se puede deshacer.</p>
            {confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={() => { deleteTrip(trip.id); onDeleted(); }} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition-opacity">
                  <Trash2 size={12} /> Confirmar eliminación
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-muted rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors">
                <Trash2 size={12} /> Eliminar este viaje
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
