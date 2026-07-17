import type { FlightData } from "../types";

const MONTHS: Record<string, number> = {
  ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
  may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
  sep: 8, sept: 8, septiembre: 8, set: 8, oct: 9, octubre: 9,
  nov: 10, noviembre: 10, dic: 11, diciembre: 11,
};

function prettyDate(raw: string): string {
  const m = raw.match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóúñ]+)\.?\s+(?:de\s+)?(\d{4})/i);
  if (!m) return raw;
  const monthIdx = MONTHS[m[2].toLowerCase()];
  if (monthIdx === undefined) return raw;
  const d = new Date(parseInt(m[3], 10), monthIdx, parseInt(m[1], 10));
  const s = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const LEG_HEADER_RE = /^(.+?)\s*[—–-]\s*(\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]+\.?\s+(?:de\s+)?\d{4})$/i;
const ROUTE_RE = /^(.+?)\s*\(([A-Za-z]{3})\)\s*(\d{1,2}:\d{2})\s*[→\-]+\s*(.+?)\s*\(([A-Za-z]{3})\)\s*(\d{1,2}:\d{2})(?:\s*\(?\+(\d+)\)?)?/;
const DURATION_RE = /duraci[oó]n:?\s*([^,]+),?\s*(.*)/i;
const BOOKING_RE = /reserva:?\s*(.+)/i;

type Draft = Partial<FlightData>;

function finishLeg(partial: Draft, bookingRef: string): FlightData {
  return {
    leg: partial.leg || "VUELO",
    date: partial.date || "",
    dep: partial.dep || "",
    arr: partial.arr || "",
    from: partial.from || "",
    to: partial.to || "",
    duration: partial.duration || "",
    stops: partial.stops || "",
    airline: partial.airline || "",
    notes: bookingRef ? `Reserva: ${bookingRef}` : "",
  };
}

/** Parses a pasted itinerary paragraph (route header, optional booking
 * reference, and one "Etiqueta — fecha" block per leg with a route line and
 * a duration line) into structured flights. Pure text parsing, no AI. */
export function parseFlightText(text: string): FlightData[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let bookingRef = "";
  const refLine = lines.find((l) => /n[uú]mero de reserva/i.test(l));
  if (refLine) {
    const m = refLine.match(BOOKING_RE);
    if (m) bookingRef = m[1].trim();
  }

  const legs: FlightData[] = [];
  let current: Draft | null = null;

  for (const line of lines) {
    const headerMatch = line.match(LEG_HEADER_RE);
    if (headerMatch) {
      if (current?.from) legs.push(finishLeg(current, bookingRef));
      current = { leg: headerMatch[1].trim().toUpperCase(), date: prettyDate(headerMatch[2]) };
      continue;
    }

    const routeMatch = line.match(ROUTE_RE);
    if (routeMatch && current) {
      const [, fromCity, fromCode, depTime, toCity, toCode, arrTime, plusDays] = routeMatch;
      current.from = `${fromCity.trim()} (${fromCode.toUpperCase()})`;
      current.to = `${toCity.trim()} (${toCode.toUpperCase()})`;
      current.dep = depTime;
      current.arr = plusDays ? `${arrTime} +${plusDays}` : arrTime;
      continue;
    }

    const durMatch = line.match(DURATION_RE);
    if (durMatch && current) {
      current.duration = durMatch[1].trim();
      current.stops = (durMatch[2] || "").trim();
    }
  }
  if (current?.from) legs.push(finishLeg(current, bookingRef));

  return legs;
}
