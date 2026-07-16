import { useState } from "react";
import { Check, KeyRound, Trash2 } from "lucide-react";
import { clearApiKey, getApiKey, hasApiKey, setApiKey } from "../lib/ai";

export function AISettings() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(hasApiKey());
  const [justSaved, setJustSaved] = useState(false);

  const save = () => {
    if (!key.trim()) return;
    setApiKey(key);
    setKey("");
    setSaved(true);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const clear = () => {
    clearApiKey();
    setSaved(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound size={15} className="text-primary" />
        <h3 className="font-semibold text-sm">Clave de API (Anthropic)</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Necesaria para leer capturas de vuelos y generar checklists con IA. Se guarda solo en
        este navegador (nunca se sincroniza ni se sube a ningún servidor propio) y las llamadas
        van directas de tu dispositivo a Anthropic. Consigue una clave en{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          console.anthropic.com
        </a>
        .
      </p>

      {saved ? (
        <div className="flex items-center justify-between gap-2 bg-muted rounded-xl px-3 py-2.5">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            {justSaved && <Check size={13} className="text-accent" />}
            Clave guardada · {getApiKey().slice(0, 6)}••••••••
          </span>
          <button onClick={clear} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button onClick={save} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium flex-shrink-0">
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
