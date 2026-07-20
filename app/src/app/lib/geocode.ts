import type { GeoPlace } from "../types";

/** Nominatim (OpenStreetMap) usage policy caps at ~1 request/second and asks
 * that bulk lookups be spaced out — callers should await this between calls
 * when geocoding a list, not fire them in parallel. */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Activities are often full descriptive sentences ("Templo Pura Tirta
 * Empul: uno de los templos hindúes más sagrados..."), which search engines
 * don't handle well as a query. Take just the leading place-name-looking
 * portion, up to the first colon/dash/parenthesis. */
function extractPlaceQuery(text: string): string {
  const m = text.match(/^(.+?)(?:\s*[:—-]\s|\s*\()/);
  const candidate = (m ? m[1] : text).trim();
  return (candidate || text).slice(0, 80);
}

/** Free, no-API-key geocoding via OpenStreetMap's Nominatim search. Returns
 * null if nothing matched or the request failed. */
export async function geocodePlace(activityText: string, context: string): Promise<GeoPlace | null> {
  const query = `${extractPlaceQuery(activityText)}, ${context}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    const r = results[0];
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (isNaN(lat) || isNaN(lng)) return null;
    const label: string = (r.display_name as string | undefined)?.split(",")[0] || extractPlaceQuery(activityText);
    return { lat, lng, label };
  } catch {
    return null;
  }
}
