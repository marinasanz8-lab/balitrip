import { useEffect, useRef, useState } from "react";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, set, type Database } from "firebase/database";

declare global {
  interface Window {
    FIREBASE_CONFIG?: Record<string, string>;
    WORKSPACE_ID?: string;
  }
}

let app: FirebaseApp | null = null;
let db: Database | null = null;
let initTried = false;

function getDb(): Database | null {
  if (initTried) return db;
  initTried = true;
  try {
    if (window.FIREBASE_CONFIG?.apiKey) {
      app = initializeApp(window.FIREBASE_CONFIG);
      db = getDatabase(app);
    }
  } catch {
    db = null;
  }
  return db;
}

/** Family/workspace id — shared by everyone with the link. Falls back to a
 * per-device random id (kept in localStorage) when Firebase isn't configured,
 * so the app still works, just without cross-device sync. */
export function getWorkspaceId(): string {
  if (window.WORKSPACE_ID) return window.WORKSPACE_ID;
  const key = "workspace-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem(key, id); } catch {}
  }
  return id;
}

export function isSynced(): boolean {
  return !!getDb();
}

/** Firebase's set() validates its argument and throws *synchronously* (not
 * as a rejected promise) if the value tree contains an explicit `undefined`
 * anywhere — a `.catch()` alone doesn't protect against that. Wrapping every
 * call here means a stray undefined can never interrupt the surrounding
 * local-state/localStorage handling, only fail to sync that one write. */
function safeSet(r: ReturnType<typeof ref>, value: unknown) {
  try {
    set(r, value).catch((err) => console.error("Firebase write failed:", err));
  } catch (err) {
    console.error("Firebase write failed (sync):", err);
  }
}

type Envelope<T> = { data: T; updatedAt: number };

/** Reads a value out of storage that might be either the new `{data,
 * updatedAt}` envelope or an older bare value from before this existed.
 * Bare values are treated as updatedAt 0 so any real timestamped copy —
 * local or remote — naturally wins the first comparison against them. */
function toEnvelope<T>(raw: unknown): Envelope<T> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && raw !== null && "updatedAt" in raw && "data" in raw) {
    return raw as Envelope<T>;
  }
  return { data: raw as T, updatedAt: 0 };
}

/** Syncs a JSON-serializable value to Firebase Realtime Database (when
 * configured) with a localStorage mirror as offline cache / no-Firebase
 * fallback. Every write is stamped with the time it was made, so when a
 * device reconnects (a plain refresh, or opening the link on a different
 * device with its own possibly-stale cache) the newer of the two copies —
 * by that timestamp, not just "whichever was local" — wins instead of
 * guessing. Remote updates from other devices land via the onValue listener. */
export function useSyncedValue<T>(path: string, localKey: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const database = getDb();

  const initialLocalEnvelope = useRef<Envelope<T> | null>(null);
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(localKey);
      if (s) {
        const env = toEnvelope<T>(JSON.parse(s));
        if (env) {
          initialLocalEnvelope.current = env;
          return env.data;
        }
      }
    } catch {}
    return initial;
  });
  const [ready, setReady] = useState(!database);
  const remoteEnvelopeJson = useRef<string | null>(null);

  useEffect(() => {
    if (!database) {
      setReady(true);
      return;
    }
    const r = ref(database, path);
    let isFirstSnapshot = true;
    const unsub = onValue(
      r,
      (snap) => {
        const remoteEnv = toEnvelope<T>(snap.val());

        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          setReady(true);
          const localEnv = initialLocalEnvelope.current;
          if (localEnv && (!remoteEnv || localEnv.updatedAt > remoteEnv.updatedAt)) {
            // This device's own copy is newer than what the server has (or
            // the server has nothing yet) — keep it and push it up, rather
            // than accepting older/no server data just because it's remote.
            remoteEnvelopeJson.current = JSON.stringify(localEnv);
            safeSet(r, localEnv);
            return;
          }
        }

        if (remoteEnv) {
          remoteEnvelopeJson.current = JSON.stringify(remoteEnv);
          setValue(remoteEnv.data);
          try { localStorage.setItem(localKey, JSON.stringify(remoteEnv)); } catch {}
        }
      },
      () => setReady(true)
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [database, path]);

  const update = (updater: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      const envelope: Envelope<T> = { data: next, updatedAt: Date.now() };
      const json = JSON.stringify(envelope);
      try { localStorage.setItem(localKey, json); } catch {}
      if (database && json !== remoteEnvelopeJson.current) {
        remoteEnvelopeJson.current = json;
        safeSet(ref(database, path), envelope);
      }
      return next;
    });
  };

  return [value, update, ready];
}
