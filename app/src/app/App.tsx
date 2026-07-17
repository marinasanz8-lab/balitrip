import { useEffect, useState } from "react";
import { WorkspaceProvider, useWorkspace } from "./lib/workspace";
import { decodeShare } from "./lib/util";
import { TripsHome } from "./TripsHome";
import { TripView } from "./TripView";
import { TripSettings } from "./TripSettings";
import { TripWizard } from "./wizard/TripWizard";
import type { TripData, TripMeta } from "./types";

type Route =
  | { name: "home" }
  | { name: "new" }
  | { name: "trip"; id: string }
  | { name: "settings"; id: string };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts[0] === "nuevo") return { name: "new" };
  if (parts[0] === "trip" && parts[1]) {
    if (parts[2] === "ajustes") return { name: "settings", id: parts[1] };
    return { name: "trip", id: parts[1] };
  }
  return { name: "home" };
}

function navigate(path: string) {
  window.location.hash = path;
}

function Router() {
  const { importTrip, getTripEntry } = useWorkspace();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Handle incoming share links: #/import/<encoded>
  useEffect(() => {
    const raw = window.location.hash;
    if (raw.startsWith("#/import/")) {
      const encoded = raw.slice("#/import/".length);
      const payload = decodeShare(encoded) as { meta: TripMeta; data: TripData } | null;
      if (payload?.meta?.id) {
        importTrip(payload.meta, payload.data);
        navigate(`/trip/${payload.meta.id}`);
      } else {
        navigate("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  if (route.name === "new") {
    return <TripWizard onDone={(id) => navigate(`/trip/${id}`)} onCancel={() => navigate("/")} />;
  }
  if (route.name === "trip") {
    return <TripView tripId={route.id} onBack={() => navigate("/")} onSettings={() => navigate(`/trip/${route.id}/ajustes`)} />;
  }
  if (route.name === "settings") {
    const trip = getTripEntry(route.id)?.meta;
    if (!trip) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">Este viaje ya no existe.</p>
          <button onClick={() => navigate("/")} className="text-primary underline text-sm">Volver a mis viajes</button>
        </div>
      );
    }
    return <TripSettings trip={trip} onBack={() => navigate(`/trip/${route.id}`)} onDeleted={() => navigate("/")} />;
  }
  return <TripsHome onOpenTrip={(id) => navigate(`/trip/${id}`)} onNewTrip={() => navigate("/nuevo")} />;
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Router />
    </WorkspaceProvider>
  );
}
