export const uid = () => Math.random().toString(36).slice(2, 9);

/** Adapts a whole-object updater into a setter for one of its fields, so a
 * field can be handed to a child component as if it owned its own state
 * (accepts either a value or a `(prev) => next` updater function). */
export function fieldSetter<T, K extends keyof T>(update: (updater: T | ((p: T) => T)) => void, key: K) {
  return (v: T[K] | ((p: T[K]) => T[K])) =>
    update((p) => ({ ...p, [key]: typeof v === "function" ? (v as (x: T[K]) => T[K])(p[key]) : v }));
}

export const copyToClipboard = (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    resolve();
  });
};

export const encodeShare = (data: object) => {
  try {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const str = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    return btoa(str);
  } catch {
    return "";
  }
};

export const decodeShare = (str: string): unknown => {
  try {
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

/** Resizes/compresses an image file client-side so trip covers stay small
 * enough to store as a data URL (localStorage + Firebase RTDB). */
export function fileToResizedDataUrl(file: File, maxW = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unsupported"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("no se pudo leer la imagen")); };
    img.src = url;
  });
}

/** Whole days (inclusive) between two ISO dates, e.g. 12→14 Sep is 3 days. */
export function tripLengthDays(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO + "T00:00:00").getTime();
  const end = new Date(endISO + "T00:00:00").getTime();
  return Math.max(0, Math.round((end - start) / 86400000) + 1);
}

/** Formats the Nth day (0-indexed) after an ISO start date, e.g. "Lun 14 sept".
 * Builds the ISO string from the Date's local Y/M/D — not `toISOString()`,
 * which converts to UTC first and silently rolls the date back a day for
 * any timezone ahead of UTC (e.g. Spain, UTC+1/+2). */
export function dayLabelAt(startISO: string, offset: number): { iso: string; label: string } {
  const d = new Date(startISO + "T00:00:00");
  d.setDate(d.getDate() + offset);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const raw = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return { iso, label: raw.charAt(0).toUpperCase() + raw.slice(1) };
}

export function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, data] = result.split(",");
      resolve({ data, mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("no se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}
