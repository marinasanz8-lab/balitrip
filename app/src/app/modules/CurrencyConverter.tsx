import { useEffect, useState } from "react";
import { ArrowDownUp, RefreshCw } from "lucide-react";
import { SectionHeader } from "./shared";

export function CurrencyConverter({ currency }: { currency: string }) {
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [local, setLocal] = useState("100000");
  const [reversed, setReversed] = useState(false);

  const fetchRate = () => {
    setLoading(true);
    setError(false);
    // frankfurter.app now 301-redirects here; that redirect hop lacks CORS
    // headers and browsers reject it, so hit the .dev host directly.
    fetch(`https://api.frankfurter.dev/v1/latest?from=${currency}&to=EUR`)
      .then((r) => r.json())
      .then((data) => {
        const r: number = data.rates.EUR;
        setRate(r);
        setRateDate(data.date);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => { fetchRate(); }, [currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtLocal = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
  const fmtEur = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleLocal = (val: string) => {
    const clean = val.replace(/\./g, "").replace(/,/g, "");
    setLocal(clean);
  };

  const localNum = parseFloat(local.replace(/\./g, "").replace(",", ".")) || 0;
  const eurNum = rate ? localNum * rate : 0;
  const quick = currency === "IDR" || currency === "VND" ? [50000, 100000, 200000, 500000, 1000000] : [10, 50, 100, 200, 500];

  return (
    <section id="conversor" className="py-16 md:py-24 px-4 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-7">
        <SectionHeader eyebrow="Divisas" title="Conversor" />
        <button onClick={fetchRate} disabled={loading} className="pb-1 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No se pudo obtener el tipo de cambio ahora mismo.{" "}
          <button onClick={fetchRate} className="text-info underline">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className={`p-5 ${reversed ? "order-2" : "order-1"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Moneda local</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{currency}</span>
              </div>
              <input
                className="w-full bg-transparent outline-none font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 6vw, 2.5rem)" }}
                value={fmtLocal(localNum)}
                onChange={(e) => handleLocal(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="relative h-px bg-border">
              <button
                onClick={() => setReversed((r) => !r)}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-info hover:border-info transition-all"
              >
                <ArrowDownUp size={14} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Euro</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">EUR</span>
              </div>
              <div className="font-bold text-info" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 6vw, 2.5rem)" }}>
                {loading ? <span className="text-muted-foreground text-2xl animate-pulse">—</span> : fmtEur(eurNum)}
              </div>
            </div>
          </div>

          {rate && !loading && (
            <p className="text-[11px] text-muted-foreground mt-3 text-center" style={{ fontFamily: "var(--font-mono)" }}>
              1 EUR = {fmtLocal(1 / rate)} {currency} · actualizado {rateDate}
            </p>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {quick.map((amt) => (
              <button
                key={amt}
                onClick={() => handleLocal(String(amt))}
                className="text-xs px-3 py-1.5 rounded-xl bg-muted text-muted-foreground hover:bg-info/10 hover:text-info transition-all"
              >
                {fmtLocal(amt)} {currency}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
