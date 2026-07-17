import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { uid } from "../lib/util";
import { EMPTY_TRIP_DATA, TRIP_COLORS, TRIP_EMOJIS, type ModuleId, type TripData, type TripMeta } from "../types";

export type WizardState = { meta: TripMeta; data: TripData };

export function makeInitialWizardState(): WizardState {
  return {
    meta: {
      id: uid(),
      name: "",
      destination: "",
      startDate: "",
      endDate: "",
      emoji: TRIP_EMOJIS[Math.floor(Math.random() * TRIP_EMOJIS.length)],
      color: TRIP_COLORS[Math.floor(Math.random() * TRIP_COLORS.length)],
      currency: "USD",
      modules: [],
      createdAt: Date.now(),
    },
    data: EMPTY_TRIP_DATA,
  };
}

export function OptionalStepFrame({
  question,
  hint,
  moduleId,
  meta,
  setMeta,
  children,
}: {
  question: string;
  hint?: string;
  moduleId: ModuleId;
  meta: TripMeta;
  setMeta: (m: TripMeta) => void;
  children: ReactNode;
}) {
  const included = meta.modules.includes(moduleId);
  const setIncluded = (v: boolean) =>
    setMeta({ ...meta, modules: v ? [...meta.modules, moduleId] : meta.modules.filter((m) => m !== moduleId) });

  return (
    <div>
      <p className="text-lg font-medium mb-1">{question}</p>
      {hint && <p className="text-sm text-muted-foreground mb-4">{hint}</p>}
      {!hint && <div className="mb-4" />}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setIncluded(true)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            included ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          {included && <Check size={14} />} Sí, añadir ahora
        </button>
        <button
          onClick={() => setIncluded(false)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            !included ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          Ahora no
        </button>
      </div>
      {included && <div>{children}</div>}
      {!included && <p className="text-xs text-muted-foreground/70 italic">Podrás activarlo cuando quieras desde Ajustes del viaje.</p>}
    </div>
  );
}
