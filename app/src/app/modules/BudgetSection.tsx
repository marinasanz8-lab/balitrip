import { useMemo, useState } from "react";
import { Plus, Share2, Trash2 } from "lucide-react";
import { SectionHeader } from "./shared";
import { uid } from "../lib/util";
import { BUDGET_CATS, type BudgetItem, type Zone } from "../types";

export function BudgetSection({
  items,
  setItems,
  zones,
  currency,
  onShare,
}: {
  items: BudgetItem[];
  setItems: (v: BudgetItem[] | ((p: BudgetItem[]) => BudgetItem[])) => void;
  zones: Zone[];
  currency: string;
  onShare: () => void;
}) {
  const budgetZones = useMemo(() => ["General", ...zones.map((z) => z.name)], [zones]);
  const [form, setForm] = useState({ desc: "", cat: "Hotel", zone: "General", amount: "" });

  const add = () => {
    const amount = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amount) || amount <= 0) return;
    setItems((its) => [...its, { id: uid(), desc: form.desc.trim(), cat: form.cat, zone: form.zone, amount }]);
    setForm((p) => ({ ...p, desc: "", amount: "" }));
  };

  const total = items.reduce((s, i) => s + i.amount, 0);
  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const byCategory = BUDGET_CATS.map((cat) => ({ cat, total: items.filter((i) => i.cat === cat).reduce((s, i) => s + i.amount, 0) })).filter((c) => c.total > 0);

  return (
    <section id="presupuesto" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Control de gastos" title="Presupuesto" />
      <div className="flex items-baseline gap-2 mb-7">
        <span className="text-primary" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
          {fmt(total)} {currency === "EUR" ? "€" : currency}
        </span>
        <span className="text-muted-foreground text-sm">total</span>
      </div>

      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
          {byCategory.map(({ cat, total: t }) => (
            <div key={cat} className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{cat}</div>
              <div className="font-semibold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{fmt(t)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Añadir gasto</p>
        <div className="space-y-2">
          <input
            className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
            placeholder="Descripción" value={form.desc}
            onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="text-sm bg-muted rounded-xl px-3 py-2.5 outline-none cursor-pointer" value={form.cat} onChange={(e) => setForm((p) => ({ ...p, cat: e.target.value }))}>
              {BUDGET_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="text-sm bg-muted rounded-xl px-3 py-2.5 outline-none cursor-pointer" value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}>
              {budgetZones.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number" min={0}
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
              placeholder={`Importe (${currency})`} value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button onClick={add} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"><Plus size={15} /></button>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Descripción</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Cat.</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Zona</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{currency}</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 !== 0 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-3">{item.desc}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{item.cat}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{item.zone}</td>
                    <td className="px-4 py-3 text-right text-xs" style={{ fontFamily: "var(--font-mono)" }}>{fmt(item.amount)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setItems((its) => its.filter((x) => x.id !== item.id))} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-4 py-3 font-bold text-xs uppercase tracking-wide" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl">Añade tu primer gasto para empezar a llevar el control</div>
      )}

      <button
        onClick={onShare}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-all active:scale-95"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Share2 size={16} /> Compartir actualización
      </button>
    </section>
  );
}
