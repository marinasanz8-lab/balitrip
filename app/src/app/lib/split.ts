import type { BudgetItem, Person } from "../types";

export type Balance = { personId: string; name: string; net: number };
export type Settlement = { fromId: string; fromName: string; toId: string; toName: string; amount: number };

/** Net balance per person: positive = the group owes them, negative = they owe the group.
 * Each item's amount is paid in full by `paidBy` and split evenly among `splitAmong`
 * (defaulting to everyone when omitted/empty). Items without a `paidBy` are ignored —
 * they haven't been attributed to anyone yet. */
export function computeBalances(items: BudgetItem[], people: Person[]): Balance[] {
  const net = new Map<string, number>(people.map((p) => [p.id, 0]));

  for (const item of items) {
    if (!item.paidBy || !net.has(item.paidBy)) continue;
    const among = item.splitAmong && item.splitAmong.length > 0 ? item.splitAmong.filter((id) => net.has(id)) : people.map((p) => p.id);
    if (among.length === 0) continue;
    const share = item.amount / among.length;
    net.set(item.paidBy, (net.get(item.paidBy) ?? 0) + item.amount);
    for (const id of among) net.set(id, (net.get(id) ?? 0) - share);
  }

  return people.map((p) => ({ personId: p.id, name: p.name, net: Math.round((net.get(p.id) ?? 0) * 100) / 100 }));
}

/** Greedily matches debtors with creditors to minimize the number of transfers
 * needed to settle everyone up. */
export function simplifySettlements(balances: Balance[]): Settlement[] {
  const EPS = 0.01;
  const debtors = balances.filter((b) => b.net < -EPS).map((b) => ({ ...b })).sort((a, b) => a.net - b.net);
  const creditors = balances.filter((b) => b.net > EPS).map((b) => ({ ...b })).sort((a, b) => b.net - a.net);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.net, creditor.net);
    if (amount > EPS) {
      settlements.push({
        fromId: debtor.personId, fromName: debtor.name,
        toId: creditor.personId, toName: creditor.name,
        amount: Math.round(amount * 100) / 100,
      });
      debtor.net += amount;
      creditor.net -= amount;
    }
    if (Math.abs(debtor.net) <= EPS) i++;
    if (Math.abs(creditor.net) <= EPS) j++;
  }
  return settlements;
}
