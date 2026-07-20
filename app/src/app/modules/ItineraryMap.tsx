import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPinned } from "lucide-react";
import { geocodePlace, delay } from "../lib/geocode";
import { ZONE_COLORS, type Activity, type Day, type GeoPlace, type Zone } from "../types";

function coloredIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.45)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export function ItineraryMap({
  zone,
  geoContext,
  onSetPlace,
}: {
  zone: Zone;
  geoContext: string;
  onSetPlace: (dayId: string, activityId: string, place: GeoPlace | false) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const pending: { day: Day; activity: Activity }[] = [];
  const pinned: { day: Day; activity: Activity; place: GeoPlace }[] = [];
  let notFound = 0;
  for (const day of zone.days) {
    for (const activity of day.activities) {
      if (activity.place === undefined) pending.push({ day, activity });
      else if (activity.place === false) notFound++;
      else pinned.push({ day, activity, place: activity.place });
    }
  }

  const dayColor = (dayId: string) => {
    const idx = zone.days.findIndex((d) => d.id === dayId);
    return ZONE_COLORS[idx % ZONE_COLORS.length];
  };

  const generate = async () => {
    setGenerating(true);
    setProgress({ done: 0, total: pending.length });
    for (let i = 0; i < pending.length; i++) {
      const { day, activity } = pending[i];
      const result = await geocodePlace(activity.text, geoContext);
      onSetPlace(day.id, activity.id, result ?? false);
      setProgress({ done: i + 1, total: pending.length });
      if (i < pending.length - 1) await delay(1100);
    }
    setGenerating(false);
  };

  const center: [number, number] =
    pinned.length > 0
      ? [pinned.reduce((s, p) => s + p.place.lat, 0) / pinned.length, pinned.reduce((s, p) => s + p.place.lng, 0) / pinned.length]
      : [0, 0];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {pinned.length > 0 && (
        <div style={{ height: 320 }}>
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {pinned.map(({ day, activity, place }) => (
              <Marker key={activity.id} position={[place.lat, place.lng]} icon={coloredIcon(dayColor(day.id))}>
                <Popup>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: dayColor(day.id) }}>{day.label}</p>
                  <p className="text-xs leading-snug">{activity.text}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        {pinned.length === 0 && !generating && (
          <p className="text-xs text-muted-foreground">Aún no hay puntos ubicados en el mapa para esta zona.</p>
        )}
        {pending.length > 0 && (
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <MapPinned size={13} />}
            {generating ? `Buscando ${progress.done}/${progress.total}…` : pinned.length > 0 ? `Ubicar ${pending.length} más` : "Generar puntos en el mapa"}
          </button>
        )}
        {notFound > 0 && !generating && (
          <p className="text-[11px] text-muted-foreground/70">{notFound} actividad{notFound !== 1 ? "es" : ""} sin ubicación encontrada.</p>
        )}
        <p className="text-[10px] text-muted-foreground/60">Mapa y búsqueda de lugares: OpenStreetMap / Nominatim, gratuitos.</p>
      </div>
    </div>
  );
}
