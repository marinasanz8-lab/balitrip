import { useMemo, useState } from "react";
import { Plus, Scale, Share2, Trash2 } from "lucide-react";
import { PeopleEditor, SectionHeader } from "./shared";
import { uid } from "../lib/util";
import { computeBalances, simplifySettlements } from "../lib/split";
import { BUDGET_CATS, type BudgetItem, type Person, type Zone } from "../types";

export function BudgetSection({
  items,
  setItems,
  people,
  setPeople,
  zones,
  currency,
  onShare,
}: {
  items: BudgetItem[];
  setItems: (v: BudgetItem[] | ((p: BudgetItem[]) => BudgetItem[])) => void;
  people: Person[];
  setPeople: (v: Person[] | ((p: Person[]) => Person[])) => void;
  zones: Zone[];
  currency: string;
  onShare: () => void;
}) {
  const budgetZones = useMemo(() => ["General", ...zones.map((z) => z.name)], [zones]);
  const [form, setForm] = useState({ desc: "", cat: "Hotel", zone: "General", amount: "", paidBy: "", splitAmong: [] as string[] });
  const symbol = currency === "EUR" ? "€" : currency;

  // Keep budget items in sync when a person is removed from the trip.
  const setPeopleAndClean = (v: Person[] | ((p: Person[]) => Person[])) => {
    setPeople((prev) => {
      const next = typeof v === "function" ? (v as (p: Person[]) => Person[])(prev) : v;
      const remainingIds = new Set(next.map((p) => p.id));
      const removedIds = new Set(prev.filter((p) => !remainingIds.has(p.id)).map((p) => p.id));
      if (removedIds.size > 0) setItems((its) => its.map((i) => (i.paidBy && removedIds.has(i.paidBy) ? { ...i, paidBy: undefined } : i)));
      return next;
    });
  };

  const toggleSplit = (id: string) => {
    setForm((f) => ({ ...f, splitAmong: f.splitAmong.includes(id) ? f.splitAmong.filter((x) => x !== id) : [...f.splitAmong, id] }));
  };

  const add = () => {
    const amount = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amount) || amount <= 0) return;
    setItems((its) => [...its, {
      id: uid(), desc: form.desc.trim(), cat: form.cat, zone: form.zone, amount,
      paidBy: form.paidBy || undefined,
      splitAmong: form.splitAmong.length > 0 ? form.splitAmong : undefined,
    }]);
    setForm((p) => ({ ...p, desc: "", amount: "", splitAmong: [] }));
  };

  const total = items.reduce((s, i) => s + i.amount, 0);
  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const byCategory = BUDGET_CATS.map((cat) => ({ cat, total: items.filter((i) => i.cat === cat).reduce((s, i) => s + i.amount, 0) })).filter((c) => c.total > 0);

  const personName = (id?: string) => people.find((p) => p.id === id)?.name;
  const balances = useMemo(() => computeBalances(items, people), [items, people]);
  const settlements = useMemo(() => simplifySettlements(balances), [balances]);
  const unassignedCount = items.filter((i) => !i.paidBy).length;

  return (
    <section id="presupuesto" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Control de gastos" title="Presupuesto" />
      <div className="flex items-baseline gap-2 mb-7">
        <span className="text-info" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
          {fmt(total)} {symbol}
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

      {/* People */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quién viaja</p>
        <PeopleEditor people={people} setPeople={setPeopleAndClean} />
        {people.length === 0 && <p className="text-xs text-muted-foreground mt-2">Añade quién viaja para repartir los gastos automáticamente entre todos.</p>}
      </div>

      {/* Add expense */}
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
              placeholder={`Importe (${symbol})`} value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button onClick={add} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"><Plus size={15} /></button>
          </div>

          {people.length > 0 && (
            <div className="pt-2 space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Pagado por</label>
                <select className="w-full text-sm bg-muted rounded-xl px-3 py-2 outline-none cursor-pointer" value={form.paidBy} onChange={(e) => setForm((p) => ({ ...p, paidBy: e.target.value }))}>
                  <option value="">Sin especificar</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Repartido entre (vacío = todos)</label>
                <div className="flex flex-wrap gap-1.5">
                  {people.map((p) => (
                    <button
                      type="button" key={p.id} onClick={() => toggleSplit(p.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${form.splitAmong.includes(p.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Descripción</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Cat.</th>
                  {people.length > 0 && <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Pagó</th>}
                  <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{symbol}</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className={i % 2 !== 0 ? "bg-muted/20" : ""}>
                    <td className="px-4 py-3">{item.desc}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{item.cat}</td>
                    {people.length > 0 && <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{personName(item.paidBy) ?? "—"}</td>}
                    <td className="px-4 py-3 text-right text-xs" style={{ fontFamily: "var(--font-mono)" }}>{fmt(item.amount)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => setItems((its) => its.filter((x) => x.id !== item.id))} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-4 py-3 font-bold text-xs uppercase tracking-wide" colSpan={people.length > 0 ? 3 : 2}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm bg-card border border-border rounded-2xl mb-5">Añade tu primer gasto para empezar a llevar el control</div>
      )}

      {/* Balances / settle-up */}
      {people.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={15} className="text-info" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cuentas entre el grupo</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {balances.map((b) => (
              <div key={b.personId} className="rounded-xl px-3 py-2.5 bg-muted">
                <div className="text-xs font-medium mb-0.5">{b.name}</div>
                <div
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-mono)", color: b.net > 0.005 ? "var(--accent)" : b.net < -0.005 ? "var(--destructive)" : "var(--muted-foreground)" }}
                >
                  {b.net > 0.005 ? `+${fmt(b.net)}` : fmt(b.net)} {symbol}
                </div>
              </div>
            ))}
          </div>

          {settlements.length > 0 ? (
            <ul className="space-y-2">
              {settlements.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-xl px-3 py-2.5">
                  <span className="font-medium">{s.fromName}</span>
                  <span className="text-muted-foreground text-xs">debe pagar a</span>
                  <span className="font-medium">{s.toName}</span>
                  <span className="ml-auto font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{fmt(s.amount)} {symbol}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nadie debe nada por ahora.</p>
          )}
          {unassignedCount > 0 && (
            <p className="text-[11px] text-muted-foreground/80 italic mt-3">
              {unassignedCount} gasto{unassignedCount > 1 ? "s" : ""} sin "pagado por" — no {unassignedCount > 1 ? "cuentan" : "cuenta"} en las cuentas.
            </p>
          )}
        </div>
      )}

      <button
        onClick={onShare}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-all active:scale-95"
        style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Share2 size={16} /> Compartir actualización
      </button>
    </section>
  );
}
