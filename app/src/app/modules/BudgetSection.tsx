import { useMemo, useState } from "react";
import { Lock, Plus, Scale, Share2, Trash2, Unlock, X } from "lucide-react";
import { PeopleEditor, SectionHeader } from "./shared";
import { uid } from "../lib/util";
import { computeBalances, simplifySettlements } from "../lib/split";
import { BUDGET_CATS, type BudgetItem, type Person, type Zone } from "../types";

// Budget amounts are always entered in EUR, regardless of the trip's local
// destination currency (that's what the Conversor module tracks).
const SYMBOL = "€";

/** Splits `total` among `ids`, keeping any id present in `locked` at its
 * fixed amount and dividing the remainder evenly (in whole cents, extra
 * cents going to the first few) among the rest — so editing one person's
 * share automatically rebalances only the ones nobody fixed yet. */
function distributeSplit(ids: string[], total: number, locked: Record<string, number>): Record<string, number> {
  const lockedSum = ids.reduce((s, id) => s + (locked[id] ?? 0), 0);
  const unlockedIds = ids.filter((id) => !(id in locked));
  const remainingCents = Math.max(0, Math.round((total - lockedSum) * 100));
  const result: Record<string, number> = {};
  for (const id of ids) if (id in locked) result[id] = locked[id];
  if (unlockedIds.length > 0) {
    const base = Math.floor(remainingCents / unlockedIds.length);
    const extra = remainingCents - base * unlockedIds.length;
    unlockedIds.forEach((id, i) => { result[id] = (base + (i < extra ? 1 : 0)) / 100; });
  }
  return result;
}

export function BudgetSection({
  items,
  setItems,
  people,
  setPeople,
  zones,
  onShare,
}: {
  items: BudgetItem[];
  setItems: (v: BudgetItem[] | ((p: BudgetItem[]) => BudgetItem[])) => void;
  people: Person[];
  setPeople: (v: Person[] | ((p: Person[]) => Person[])) => void;
  zones: Zone[];
  onShare: () => void;
}) {
  const budgetZones = useMemo(() => ["General", ...zones.map((z) => z.name)], [zones]);
  const emptyForm = { desc: "", cat: "Hotel", zone: "General", amount: "", paidBy: "", splitAmong: [] as string[] };
  const [form, setForm] = useState(emptyForm);
  const [addOpen, setAddOpen] = useState(false);
  const [lockedSplits, setLockedSplits] = useState<Record<string, number>>({});

  const amountNum = parseFloat(form.amount) || 0;
  const splitPreview = useMemo(() => distributeSplit(form.splitAmong, amountNum, lockedSplits), [form.splitAmong, amountNum, lockedSplits]);

  // Keep budget items in sync when a person is removed from the trip.
  const setPeopleAndClean = (v: Person[] | ((p: Person[]) => Person[])) => {
    setPeople((prev) => {
      const next = typeof v === "function" ? (v as (p: Person[]) => Person[])(prev) : v;
      const remainingIds = new Set(next.map((p) => p.id));
      const removedIds = new Set(prev.filter((p) => !remainingIds.has(p.id)).map((p) => p.id));
      if (removedIds.size > 0) setItems((its) => its.map((i) => {
        if (!i.paidBy || !removedIds.has(i.paidBy)) return i;
        const { paidBy: _paidBy, ...rest } = i;
        return rest as BudgetItem;
      }));
      return next;
    });
  };

  const toggleSplit = (id: string) => {
    setForm((f) => ({ ...f, splitAmong: f.splitAmong.includes(id) ? f.splitAmong.filter((x) => x !== id) : [...f.splitAmong, id] }));
    setLockedSplits((p) => {
      if (!(id in p)) return p;
      const { [id]: _removed, ...rest } = p;
      return rest;
    });
  };

  const setPersonAmount = (id: string, valueStr: string) => {
    const value = Math.max(0, parseFloat(valueStr) || 0);
    setLockedSplits((p) => ({ ...p, [id]: value }));
  };

  const toggleLock = (id: string) => {
    setLockedSplits((p) => {
      if (id in p) {
        const { [id]: _removed, ...rest } = p;
        return rest;
      }
      return { ...p, [id]: splitPreview[id] ?? 0 };
    });
  };

  const openAdd = () => { setForm(emptyForm); setLockedSplits({}); setAddOpen(true); };
  const closeAdd = () => setAddOpen(false);

  const add = () => {
    const amount = parseFloat(form.amount);
    if (!form.desc.trim() || isNaN(amount) || amount <= 0) return;
    const item: BudgetItem = { id: uid(), desc: form.desc.trim(), cat: form.cat, zone: form.zone, amount };
    if (form.paidBy) item.paidBy = form.paidBy;
    if (form.splitAmong.length > 0) {
      item.splitAmong = form.splitAmong;
      item.splitAmounts = distributeSplit(form.splitAmong, amount, lockedSplits);
    }
    setItems((its) => [...its, item]);
    setAddOpen(false);
  };

  const total = items.reduce((s, i) => s + i.amount, 0);
  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const byCategory = BUDGET_CATS.map((cat) => ({ cat, total: items.filter((i) => i.cat === cat).reduce((s, i) => s + i.amount, 0) })).filter((c) => c.total > 0);

  const personName = (id?: string) => people.find((p) => p.id === id)?.name;
  const balances = useMemo(() => computeBalances(items, people), [items, people]);
  const settlements = useMemo(() => simplifySettlements(balances), [balances]);
  const unassignedCount = items.filter((i) => !i.paidBy).length;

  const sortedItems = useMemo(() => [...items].reverse(), [items]);

  return (
    <section id="presupuesto" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader
        eyebrow="Control de gastos" title="Presupuesto"
        action={
          <button onClick={openAdd} className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity flex-shrink-0" aria-label="Añadir gasto">
            <Plus size={17} />
          </button>
        }
      />

      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-info" style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
          {fmt(total)} {SYMBOL}
        </span>
        <span className="text-muted-foreground text-sm">total</span>
      </div>

      {byCategory.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-7 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" style={{ scrollbarWidth: "none" }}>
          {byCategory.map(({ cat, total: t }) => (
            <div key={cat} className="flex-shrink-0 bg-card border border-border rounded-full pl-3.5 pr-4 py-2 flex items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{cat}</span>
              <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{fmt(t)} {SYMBOL}</span>
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

      {items.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5 divide-y divide-border">
          {sortedItems.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{item.desc}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{item.cat}</span>
                  {item.zone && item.zone !== "General" && <><span>·</span><span>{item.zone}</span></>}
                  {personName(item.paidBy) && <><span>·</span><span>{personName(item.paidBy)}</span></>}
                </div>
              </div>
              <div className="text-sm font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)" }}>{fmt(item.amount)} {SYMBOL}</div>
              <button
                onClick={() => setItems((its) => its.filter((x) => x.id !== item.id))}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Eliminar gasto"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3.5 bg-muted/30">
            <span className="text-xs font-bold uppercase tracking-wide">Total</span>
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>{fmt(total)} {SYMBOL}</span>
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
                  {b.net > 0.005 ? `+${fmt(b.net)}` : fmt(b.net)} {SYMBOL}
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
                  <span className="ml-auto font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{fmt(s.amount)} {SYMBOL}</span>
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

      {addOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAdd}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Añadir gasto</p>
              <button onClick={closeAdd} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                autoFocus
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
              <input
                type="number" min={0}
                className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground"
                placeholder={`Importe (${SYMBOL})`} value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />

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
                    <label className="text-[10px] text-muted-foreground block mb-1">¿Quién ha participado? (vacío = todos)</label>
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

                  {form.splitAmong.length > 0 && (
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-1">Reparto por persona</label>
                      <div className="space-y-1.5">
                        {form.splitAmong.map((id) => {
                          const person = people.find((p) => p.id === id);
                          if (!person) return null;
                          const isLocked = id in lockedSplits;
                          return (
                            <div key={id} className="flex items-center gap-2 bg-muted rounded-xl pl-3 pr-1.5 py-1.5">
                              <span className="text-sm flex-1 truncate">{person.name}</span>
                              <input
                                type="number" min={0} step="0.01"
                                value={splitPreview[id] ?? 0}
                                onChange={(e) => setPersonAmount(id, e.target.value)}
                                className="w-20 text-sm bg-card border border-border rounded-lg px-2 py-1 outline-none text-right"
                              />
                              <span className="text-xs text-muted-foreground">{SYMBOL}</span>
                              <button
                                type="button"
                                onClick={() => toggleLock(id)}
                                title={isLocked ? "Cantidad fija — pulsa para volver a repartir en partes iguales" : "Se reparte en partes iguales — pulsa para fijar esta cantidad"}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isLocked ? "text-info" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[11px] px-1 pt-1.5">
                        <span className="text-muted-foreground">Repartido</span>
                        <span className={Math.abs(Object.values(splitPreview).reduce((s, v) => s + v, 0) - amountNum) < 0.005 ? "text-muted-foreground" : "text-destructive font-medium"}>
                          {Object.values(splitPreview).reduce((s, v) => s + v, 0).toFixed(2)} {SYMBOL} de {amountNum.toFixed(2)} {SYMBOL}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={add} className="w-full mt-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium">
                Añadir gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
