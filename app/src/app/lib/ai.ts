import { fileToBase64, uid } from "./util";
import type { CheckCat, FlightData, TripMeta } from "../types";

const KEY_STORAGE = "ai-api-key";
const MODEL = "claude-sonnet-5";

export function getApiKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) || ""; } catch { return ""; }
}

export function setApiKey(key: string) {
  try { localStorage.setItem(KEY_STORAGE, key.trim()); } catch {}
}

export function clearApiKey() {
  try { localStorage.removeItem(KEY_STORAGE); } catch {}
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

async function callClaude(content: ContentBlock[], system: string, maxTokens = 1500): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("Configura tu clave de API de Anthropic en Ajustes para usar la IA.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Clave de API inválida o caducada.");
    throw new Error(`Error de la API (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.search(/[[{]/);
  const jsonStr = start >= 0 ? cleaned.slice(start) : cleaned;
  return JSON.parse(jsonStr);
}

const FLIGHT_KEYS: (keyof FlightData)[] = ["date", "dep", "arr", "from", "to", "duration", "airline", "stops", "notes"];

export async function extractFlightFromImage(file: File): Promise<Partial<FlightData>> {
  const { data, mediaType } = await fileToBase64(file);
  const text = await callClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data } },
      {
        type: "text",
        text:
          "Extrae los datos de este vuelo de la captura de pantalla (billete, localizador o app de la aerolínea) " +
          'y responde SOLO con un JSON de una línea con estas claves exactas: ' +
          '{"date":"","dep":"","arr":"","from":"","to":"","duration":"","airline":"","stops":"","notes":""}. ' +
          'date = fecha de salida legible (ej. "Sábado, 12 Sep 2026"). dep/arr = horas HH:MM (añade +1 si la llegada es al día siguiente). ' +
          "from/to = ciudad y código IATA si aparece. Deja \"\" en lo que no puedas leer. No incluyas texto fuera del JSON.",
      },
    ],
    "Eres un asistente que extrae datos estructurados de capturas de pantalla de vuelos. Respondes únicamente con JSON válido, sin markdown ni texto adicional."
  );
  const parsed = parseJsonLoose(text) as Record<string, string>;
  const out: Partial<FlightData> = {};
  for (const k of FLIGHT_KEYS) if (typeof parsed[k] === "string") out[k] = parsed[k];
  return out;
}

export async function generateChecklist(trip: Pick<TripMeta, "destination" | "startDate" | "endDate">): Promise<CheckCat[]> {
  const text = await callClaude(
    [
      {
        type: "text",
        text:
          `Genera una checklist de preparativos de viaje para: destino "${trip.destination}", ` +
          `del ${trip.startDate || "?"} al ${trip.endDate || "?"}. ` +
          'Agrupa en 3 a 5 categorías razonables para ese destino (documentación, equipaje, salud, dinero, gestiones antes de salir, etc). ' +
          'Responde SOLO con un JSON de una línea: [{"name":"Categoría","items":["ítem 1","ítem 2"]}]. Sin texto fuera del JSON.',
      },
    ],
    "Eres un asistente de viajes experto en preparativos. Respondes únicamente con JSON válido, sin markdown ni texto adicional."
  );
  const parsed = parseJsonLoose(text) as { name: string; items: string[] }[];
  return parsed.map((c) => ({
    id: uid(),
    name: c.name,
    items: (c.items || []).map((t) => ({ id: uid(), text: t, done: false })),
  }));
}
