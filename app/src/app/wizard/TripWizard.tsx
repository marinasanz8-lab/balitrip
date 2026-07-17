import { useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useWorkspace } from "../lib/workspace";
import { makeInitialWizardState } from "./shared";
import { StepDestination, StepDates, StepFlights, StepChecklist, StepCurrency, StepItinerary, StepTours, StepBudget, StepDone } from "./steps";

const STEPS = [
  { title: "Dónde vamos", Component: StepDestination },
  { title: "Fechas", Component: StepDates },
  { title: "Vuelos", Component: StepFlights },
  { title: "Checklist", Component: StepChecklist },
  { title: "Conversor", Component: StepCurrency },
  { title: "Itinerario", Component: StepItinerary },
  { title: "Tours", Component: StepTours },
  { title: "Presupuesto", Component: StepBudget },
  { title: "Listo", Component: StepDone },
];

export function TripWizard({ onDone, onCancel }: { onDone: (tripId: string) => void; onCancel: () => void }) {
  const { importTrip } = useWorkspace();
  const [state, setState] = useState(makeInitialWizardState);
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const canProceed = step !== 0 || state.meta.name.trim().length > 0;

  const finish = () => {
    importTrip(state.meta, state.data);
    onDone(state.meta.id);
  };

  const { Component, title } = STEPS[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto w-full">
        <span className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length} · {title}</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="h-1 bg-muted max-w-2xl mx-auto w-full rounded-full overflow-hidden mb-2">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Component state={state} setState={setState} />
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-4">
        <div className="max-w-2xl mx-auto w-full flex gap-2">
          {!isFirst && (
            <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-muted text-foreground hover:bg-muted/70 transition-colors">
              <ArrowLeft size={15} /> Atrás
            </button>
          )}
          {isLast ? (
            <button onClick={finish} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              Ver mi viaje
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
