export const uid = () => Math.random().toString(36).slice(2, 9);

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
