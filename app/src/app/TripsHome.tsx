import { useState } from "react";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "./lib/workspace";
import type { TripMeta } from "./types";

function fmtRange(start: string, end: string) {
  if (!start && !end) return "Sin fechas";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = start ? new Date(start + "T00:00:00").toLocaleDateString("es-ES", opts) : "?";
  const e = end ? new Date(end + "T00:00:00").toLocaleDateString("es-ES", opts) : "?";
  return `${s} — ${e}`;
}

function daysUntil(start: string): string | null {
  if (!start) return null;
  const target = new Date(start + "T00:00:00").getTime();
  const diff = Math.ceil((target - Date.now()) / 86400000);
  if (diff > 0) return `Faltan ${diff} días`;
  if (diff === 0) return "¡Es hoy!";
  return null;
}

function isPastTrip(trip: TripMeta): boolean {
  const ref = trip.endDate || trip.startDate;
  if (!ref) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(ref + "T00:00:00").getTime() < startOfToday.getTime();
}

function TripCard({ trip, onOpen, onDelete }: { trip: TripMeta; onOpen: () => void; onDelete: () => void }) {
  const countdown = daysUntil(trip.startDate);
  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-info/40 transition-colors cursor-pointer" onClick={onOpen}>
      <div className="relative h-36 flex items-center justify-center" style={{ background: trip.cover ? undefined : `linear-gradient(135deg, ${trip.color}, ${trip.color}99)` }}>
        {trip.cover ? <img src={trip.cover} alt={trip.name} className="w-full h-full object-cover" /> : <span className="text-5xl">{trip.emoji}</span>}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold leading-snug mb-1" style={{ fontFamily: "var(--font-display)" }}>{trip.name}</h3>
        {trip.destination && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
            <MapPin size={11} /> {trip.destination}
          </p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarDays size={11} /> {fmtRange(trip.startDate, trip.endDate)}
        </p>
        {countdown && <p className="text-[11px] font-semibold text-info mt-2">{countdown}</p>}
      </div>
    </div>
  );
}

export function TripsHome({ onOpenTrip, onNewTrip }: { onOpenTrip: (id: string) => void; onNewTrip: () => void }) {
  const { trips, deleteTrip, synced } = useWorkspace();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tab, setTab] = useState<"proximos" | "pasados">("proximos");

  const upcoming = trips.filter((t) => !isPastTrip(t));
  const past = trips.filter(isPastTrip).slice().reverse();
  const shown = tab === "proximos" ? upcoming : past;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-14 pb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] text-info mb-2">{synced ? "Sincronizado" : "Solo en este dispositivo"}</p>
        <div className="flex items-end justify-between gap-3 mb-6">
          <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Mis viajes</h1>
          <button onClick={onNewTrip} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
            <Plus size={16} /> Nuevo viaje
          </button>
        </div>

        {trips.length > 0 && (
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setTab("proximos")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "proximos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              Próximos {upcoming.length > 0 && `(${upcoming.length})`}
            </button>
            <button
              onClick={() => setTab("pasados")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "pasados" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              Pasados {past.length > 0 && `(${past.length})`}
            </button>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
            <p className="text-sm mb-4">Aún no has creado ningún viaje.</p>
            <button onClick={onNewTrip} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Crear el primero
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-2xl">
            <p className="text-sm">{tab === "proximos" ? "No tienes viajes próximos." : "Todavía no tienes viajes pasados."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((trip) => (
              <TripCard key={trip.id} trip={trip} onOpen={() => onOpenTrip(trip.id)} onDelete={() => setConfirmDelete(trip.id)} />
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2">¿Eliminar este viaje?</h3>
            <p className="text-sm text-muted-foreground mb-5">Se borrará para todos los que tengan el enlace. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { deleteTrip(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Eliminar
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/70 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
