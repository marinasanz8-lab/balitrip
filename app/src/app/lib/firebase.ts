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

/** Syncs a JSON-serializable value to Firebase Realtime Database (when
 * configured) with a localStorage mirror as offline cache / no-Firebase
 * fallback. Local writes always win immediately; remote updates from other
 * devices land via the onValue listener. */
export function useSyncedValue<T>(path: string, localKey: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const database = getDb();

  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(localKey);
      if (s) return JSON.parse(s) as T;
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
    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val();
        if (v !== null && v !== undefined) {
          remoteJson.current = JSON.stringify(v);
          setValue(v as T);
          try { localStorage.setItem(localKey, remoteJson.current); } catch {}
        } else {
          remoteJson.current = "null";
        }
        setReady(true);
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
        set(ref(database, path), next).catch(() => {});
      }
      return next;
    });
  };

  return [value, update, ready];
}
