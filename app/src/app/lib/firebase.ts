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

/** Syncs a JSON-serializable value to Firebase Realtime Database (when
 * configured) with a localStorage mirror as offline cache / no-Firebase
 * fallback. Local writes always win immediately; remote updates from other
 * devices land via the onValue listener. */
export function useSyncedValue<T>(path: string, localKey: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const database = getDb();

  // Remembers the exact JSON this device had in localStorage *before* the
  // first server snapshot arrives, so a reload can't silently discard a
  // just-made edit whose write to Firebase hadn't finished yet — only set
  // when this device genuinely already had synced state, never for a
  // brand-new device falling back to `initial`.
  const initialLocalJson = useRef<string | null>(null);
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(localKey);
      if (s) {
        initialLocalJson.current = s;
        return JSON.parse(s) as T;
      }
    } catch {}
    return initial;
  });
  const [ready, setReady] = useState(!database);
  const remoteJson = useRef<string | null>(null);

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
        const v = snap.val();
        const incomingJson = v !== null && v !== undefined ? JSON.stringify(v) : "null";

        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          setReady(true);
          const hadLocal = initialLocalJson.current !== null;
          if (hadLocal && incomingJson !== initialLocalJson.current) {
            // This device already had its own state and the server's
            // current value disagrees — trust the local copy (it may hold
            // an edit that hadn't round-tripped yet) and push it back up
            // rather than reverting to what's on the server.
            remoteJson.current = initialLocalJson.current as string;
            safeSet(r, JSON.parse(initialLocalJson.current as string));
            return;
          }
        }

        remoteJson.current = incomingJson;
        if (v !== null && v !== undefined) {
          setValue(v as T);
          try { localStorage.setItem(localKey, incomingJson); } catch {}
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
      const json = JSON.stringify(next);
      try { localStorage.setItem(localKey, json); } catch {}
      if (database && json !== remoteJson.current) {
        remoteJson.current = json;
        safeSet(ref(database, path), next);
      }
      return next;
    });
  };

  return [value, update, ready];
}
