"use client";

import { CalendarDays, Filter, Landmark } from "lucide-react";
import { useMemo } from "react";

import { TransactionCard } from "@/components/transaction-card";
import { formatAmountCLP } from "@/lib/currency";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

export function HistoryScreen() {
  const { accounts } = useDebitAccounts();
  const { transactions } = useTransactions();

  // Mapa de accountId → account para lookup eficiente
  const accountMap = useMemo(() => {
    const map = new Map<string, string>(); // id → name
    (accounts ?? []).forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const sorted = useMemo(
    () =>
      [...(transactions ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

  const totalGastos = useMemo(
    () => sorted.reduce((acc, t) => acc + t.amount, 0),
    [sorted],
  );

  return (
    <div className="mx-auto w-full max-w-[980px]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-[var(--app-bg)]">
        <h1 className="type-page-title font-medium text-[var(--text-primary)]">Transacciones</h1>

        {/* Filter chips */}
        <div className="mt-4 flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center text-[var(--text-secondary)]">
            <Filter size={17} strokeWidth={2} />
          </span>

          <button
            type="button"
            aria-label="Filtrar por fecha"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--text-primary)] transition hover:border-white/16 hover:bg-white/[0.08]"
          >
            <CalendarDays size={12} strokeWidth={2.2} className="shrink-0 text-[var(--accent)]" />
            <span>Todas las fechas</span>
          </button>

          <button
            type="button"
            aria-label="Filtrar por cuenta"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--text-primary)] transition hover:border-white/16 hover:bg-white/[0.08]"
          >
            <Landmark size={12} strokeWidth={2.2} className="shrink-0 text-white/50" />
            <span>Todas</span>
          </button>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="flex items-center justify-between py-3">
        <span className="type-body text-[var(--text-secondary)]">Gastos</span>
        <span className="type-body font-medium text-[var(--text-primary)]">
          {formatAmountCLP(totalGastos)}
        </span>
      </div>

      <p className="type-label pb-3 font-medium text-[var(--text-primary)]">
        {sorted.length} {sorted.length === 1 ? "transacción" : "transacciones"}
      </p>

      {/* ── Transaction list ── */}
      {sorted.length === 0 ? (
        <div className="type-body mt-2 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
          No hay transacciones todavía.
        </div>
      ) : (
        <div className="space-y-3 pb-10">
          {sorted.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              accountSlug={transaction.accountId}
              accountName={accountMap.get(transaction.accountId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
