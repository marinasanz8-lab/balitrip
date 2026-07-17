import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { uid } from "../lib/util";
import type { Person } from "../types";

export function PeopleEditor({ people, setPeople }: { people: Person[]; setPeople: (v: Person[] | ((p: Person[]) => Person[])) => void }) {
  const [name, setName] = useState("");
  const add = () => {
    const n = name.trim();
    if (!n) return;
    setPeople((ps) => [...ps, { id: uid(), name: n }]);
    setName("");
  };
  const del = (id: string) => setPeople((ps) => ps.filter((p) => p.id !== id));

  return (
    <div>
      {people.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {people.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-muted">
              {p.name}
              <button onClick={() => del(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground"
          placeholder="Nombre (ej. Marina)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} className="px-3 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors flex-shrink-0">
          <UserPlus size={15} />
        </button>
      </div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-info mb-1.5">{eyebrow}</p>
        <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function Divider() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="h-px bg-border" />
    </div>
  );
}

export function Countdown({ target }: { target: number }) {
  const calc = () => Math.max(0, target - Date.now());
  const [rem, setRem] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  const days = Math.floor(rem / 86400000);
  const hrs = Math.floor((rem % 86400000) / 3600000);
  const min = Math.floor((rem % 3600000) / 60000);
  const sec = Math.floor((rem % 60000) / 1000);
  return (
    <div className="flex gap-5 md:gap-10 justify-center flex-wrap">
      {([["Días", days], ["Horas", hrs], ["Min", min], ["Seg", sec]] as [string, number][]).map(([label, val]) => (
        <div key={label} className="text-center min-w-[3.5rem]">
          <div
            className="tabular-nums leading-none text-white"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: 700 }}
          >
            {String(val).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 mt-2">{label}</div>
        </div>
      ))}
    </div>
  );
}
