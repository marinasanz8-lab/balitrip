import { useState } from "react";
import { Link, Settings } from "lucide-react";
import { useWorkspace } from "./lib/workspace";
import { copyToClipboard, encodeShare, fieldSetter } from "./lib/util";
import { Countdown, Divider } from "./modules/shared";
import { CurrencyConverter } from "./modules/CurrencyConverter";
import { ChecklistSection } from "./modules/ChecklistSection";
import { FlightsSection } from "./modules/FlightsSection";
import { HotelsSection } from "./modules/HotelsSection";
import { ItinerarySection } from "./modules/ItinerarySection";
import { TourSection } from "./modules/TourSection";
import { BudgetSection } from "./modules/BudgetSection";
import { MODULE_LABELS, type ModuleId, type TripData, type TripMeta } from "./types";

export function TripView({ tripId, onBack, onSettings }: { tripId: string; onBack: () => void; onSettings: () => void }) {
  const { getTripEntry, setTripData } = useWorkspace();
  const entry = getTripEntry(tripId);
  const [copied, setCopied] = useState(false);

  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Este viaje ya no existe.</p>
        <button onClick={onBack} className="text-info underline text-sm">Volver a mis viajes</button>
      </div>
    );
  }

  const { meta, data } = entry;
  const update = (updater: TripData | ((p: TripData) => TripData)) => setTripData(tripId, updater);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const shareLink = () => {
    const encoded = encodeShare({ meta, data });
    const url = `${window.location.origin}${window.location.pathname}#/import/${encoded}`;
    copyToClipboard(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
      .catch(() => prompt("Copia este enlace:", url));
  };

  const enabled = meta.modules;
  const nav: { id: ModuleId; label: string }[] = enabled.map((m) => ({ id: m, label: MODULE_LABELS[m] }));

  const targetTs = meta.startDate ? new Date(meta.startDate + "T00:00:00").getTime() : Date.now();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative flex flex-col" style={{ minHeight: "100svh", maxHeight: "980px" }}>
        {meta.cover ? (
          <img src={meta.cover} alt={meta.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${meta.color}, ${meta.color}55)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />

        <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3">
          <button onClick={onBack} className="text-white/50 text-[10px] tracking-[0.3em] uppercase hover:text-white transition-colors" style={{ fontFamily: "var(--font-mono)" }}>
            ← Mis viajes
          </button>
          <div className="flex gap-3">
            <button onClick={shareLink} className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors">
              <Link size={11} /> {copied ? "¡Copiado!" : "Compartir"}
            </button>
            <button onClick={onSettings} className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors">
              <Settings size={11} /> Ajustes
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
          {meta.destination && <p className="text-white/40 text-[10px] uppercase tracking-[0.35em] mb-4">{meta.destination}</p>}
          <h1 className="text-white leading-none tracking-tight mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3.2rem, 14vw, 8rem)", fontWeight: 900 }}>
            {meta.name}
          </h1>
          {(meta.startDate || meta.endDate) && (
            <p className="text-white/50 mb-12" style={{ fontSize: "clamp(0.8rem, 3vw, 1.1rem)" }}>
              {meta.startDate && new Date(meta.startDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              {meta.endDate && ` — ${new Date(meta.endDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          )}
          {meta.startDate && (
            <>
              <Countdown target={targetTs} />
              <p className="text-white/25 text-[9px] mt-5 uppercase tracking-[0.25em]">hasta el despegue</p>
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-4 pb-6">
          {nav.map((item) => (
            <button
              key={item.id} onClick={() => scrollTo(item.id)}
              className="px-3.5 py-1.5 text-[11px] font-medium text-white/65 hover:text-white hover:bg-white/12 rounded-full transition-all border border-white/15 backdrop-blur-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="font-bold text-sm text-primary mr-3 whitespace-nowrap flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>
            {meta.name}
          </button>
          {nav.map((item) => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all whitespace-nowrap flex-shrink-0">
              {item.label}
            </button>
          ))}
          <div className="ml-auto flex gap-1 flex-shrink-0 pl-2">
            <button
              onClick={shareLink}
              className="flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg transition-all whitespace-nowrap"
              style={{ color: copied ? "var(--accent)" : "var(--muted-foreground)", backgroundColor: copied ? "var(--accent)18" : undefined }}
            >
              <Link size={11} /> {copied ? "¡Copiado!" : "Compartir"}
            </button>
          </div>
        </div>
      </nav>

      {enabled.length === 0 ? (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted-foreground text-sm">
          Este viaje no tiene módulos activados.{" "}
          <button onClick={onSettings} className="text-info underline">Actívalos en ajustes</button>.
        </div>
      ) : (
        enabled.map((m, i) => (
          <div key={m}>
            {renderModule(m, meta, data, update, shareLink)}
            {i < enabled.length - 1 && <Divider />}
          </div>
        ))
      )}

      <footer className="py-8 text-center border-t border-border mt-8">
        <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          {meta.name} · Datos guardados {`en tu navegador`}
        </p>
      </footer>
    </div>
  );
}

function dedupZones(itineraries: TripData["itineraries"]) {
  const seen = new Map<string, TripData["itineraries"][number]["zones"][number]>();
  for (const it of itineraries) for (const z of it.zones ?? []) if (!seen.has(z.name)) seen.set(z.name, z);
  return [...seen.values()];
}

function renderModule(
  m: ModuleId,
  meta: TripMeta,
  data: TripData,
  update: (updater: TripData | ((p: TripData) => TripData)) => void,
  onShare: () => void
) {
  switch (m) {
    case "conversor":
      return <CurrencyConverter currency={meta.currency} />;
    case "checklist":
      return <ChecklistSection cats={data.checklist} setCats={fieldSetter(update, "checklist")} trip={meta} />;
    case "vuelos":
      return <FlightsSection flights={data.flights} setFlights={fieldSetter(update, "flights")} />;
    case "hoteles":
      return <HotelsSection hotels={data.hotels} setHotels={fieldSetter(update, "hotels")} />;
    case "itinerario":
      return <ItinerarySection itineraries={data.itineraries} setItineraries={fieldSetter(update, "itineraries")} tours={data.tours} destination={meta.destination} />;
    case "tours":
      return <TourSection tours={data.tours} setTours={fieldSetter(update, "tours")} itineraries={data.itineraries} />;
    case "presupuesto":
      return (
        <BudgetSection
          items={data.budget}
          setItems={fieldSetter(update, "budget")}
          people={data.people}
          setPeople={fieldSetter(update, "people")}
          zones={dedupZones(data.itineraries)}
          currency={meta.currency}
          onShare={onShare}
        />
      );
    default:
      return null;
  }
}
