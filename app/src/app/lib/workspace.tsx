import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { getWorkspaceId, isSynced, useSyncedValue } from "./firebase";
import { uid } from "./util";
import { buildBaliSeed } from "./seed";
import { DEFAULT_MODULES, EMPTY_TRIP_DATA, TRIP_COLORS, TRIP_EMOJIS, type TripData, type TripMeta } from "../types";

const SEED_FLAG = "seeded-bali-v1";

type TripEntry = { meta: TripMeta; data: TripData };
type WorkspaceShape = { trips: Record<string, TripEntry> };

const EMPTY_WORKSPACE: WorkspaceShape = { trips: {} };

type WorkspaceCtx = {
  trips: TripMeta[];
  ready: boolean;
  synced: boolean;
  getTripEntry: (id: string) => TripEntry | undefined;
  createTrip: (partial: Pick<TripMeta, "name" | "destination" | "startDate" | "endDate">) => string;
  updateTripMeta: (id: string, partial: Partial<TripMeta>) => void;
  deleteTrip: (id: string) => void;
  setTripData: (id: string, updater: TripData | ((prev: TripData) => TripData)) => void;
  importTrip: (meta: TripMeta, data: TripData) => void;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const wsId = getWorkspaceId();
  const [ws, setWs, ready] = useSyncedValue<WorkspaceShape>(`workspaces/${wsId}`, `workspace:${wsId}`, EMPTY_WORKSPACE);

  // One-time seed: the first time this workspace is ever loaded (no trips
  // yet, e.g. right after upgrading from the old single-trip site), start
  // it off with the Bali trip instead of an empty list — reusing any
  // progress left over in this browser's old localStorage keys if present.
  useEffect(() => {
    if (!ready) return;
    if (Object.keys(ws.trips ?? {}).length > 0) return;
    try {
      if (localStorage.getItem(SEED_FLAG)) return;
      localStorage.setItem(SEED_FLAG, "1");
    } catch {
      return;
    }
    const { meta, data } = buildBaliSeed();
    setWs((prev) => (Object.keys(prev.trips ?? {}).length > 0 ? prev : { trips: { [meta.id]: { meta, data } } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const value = useMemo<WorkspaceCtx>(() => {
    const trips = Object.values(ws.trips ?? {})
      .map((t) => t.meta)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.createdAt - b.createdAt);

    return {
      trips,
      ready,
      synced: isSynced(),
      getTripEntry: (id) => ws.trips?.[id],
      createTrip: (partial) => {
        const id = uid();
        const meta: TripMeta = {
          id,
          name: partial.name,
          destination: partial.destination,
          startDate: partial.startDate,
          endDate: partial.endDate,
          emoji: TRIP_EMOJIS[Math.floor(Math.random() * TRIP_EMOJIS.length)],
          color: TRIP_COLORS[Math.floor(Math.random() * TRIP_COLORS.length)],
          currency: "USD",
          modules: DEFAULT_MODULES,
          createdAt: Date.now(),
        };
        setWs((prev) => ({ trips: { ...prev.trips, [id]: { meta, data: EMPTY_TRIP_DATA } } }));
        return id;
      },
      updateTripMeta: (id, partial) => {
        setWs((prev) => {
          const entry = prev.trips[id];
          if (!entry) return prev;
          return { trips: { ...prev.trips, [id]: { ...entry, meta: { ...entry.meta, ...partial } } } };
        });
      },
      deleteTrip: (id) => {
        setWs((prev) => {
          const next = { ...prev.trips };
          delete next[id];
          return { trips: next };
        });
      },
      setTripData: (id, updater) => {
        setWs((prev) => {
          const entry = prev.trips[id];
          if (!entry) return prev;
          const nextData = typeof updater === "function" ? (updater as (p: TripData) => TripData)(entry.data) : updater;
          return { trips: { ...prev.trips, [id]: { ...entry, data: nextData } } };
        });
      },
      importTrip: (meta, data) => {
        setWs((prev) => ({ trips: { ...prev.trips, [meta.id]: { meta, data } } }));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
