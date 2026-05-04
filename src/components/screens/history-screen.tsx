"use client";

import {
  CalendarDays,
  Filter,
  Landmark,
  Search,
  X,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { TransactionCard } from "@/components/transaction-card";
import {
  FilterSheet,
  FilterState,
  formatDateLabel,
  getDefaultFilterState,
} from "@/components/transaction-filters";
import { formatAmountCLP } from "@/lib/currency";
import { sortTransactionsDesc } from "@/lib/date";
import { useCategories } from "@/lib/hooks/use-categories";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { computeRunningBalances } from "@/lib/transactions";

// ─── Main component ───────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { accounts } = useDebitAccounts();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  // ── Search mode ──
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Filter sheet ──
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Draft state (inside sheet before applying) ──
  const [draft, setDraft] = useState<FilterState>(getDefaultFilterState);

  // ── Applied state (active filters) ──
  const [applied, setApplied] = useState<FilterState>(getDefaultFilterState);

  // ── Computed data ──
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    (accounts ?? []).forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const expenseCategories = useMemo(
    () => (categories ?? []).filter((c) => !c.type || c.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === "income"),
    [categories],
  );

  // ── Filter logic ──
  const filtered = useMemo(() => {
    let list = [...(transactions ?? [])];

    list = list.filter((t) => {
      const d = new Date(t.date);
      return d >= applied.dateFrom && d <= applied.dateTo;
    });

    if (applied.accountIds.length > 0) {
      list = list.filter((t) => applied.accountIds.includes(t.accountId));
    }

    if (applied.kinds.length > 0) {
      list = list.filter((t) => applied.kinds.includes(t.kind));
    }

    if (applied.categoryIds.length > 0) {
      list = list.filter((t) => applied.categoryIds.includes(t.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note ?? "").toLowerCase().includes(q),
      );
    }

    return sortTransactionsDesc(list);
  }, [transactions, applied, searchQuery]);

  const runningBalanceMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const account of accounts ?? []) {
      const accountTransactions = sortTransactionsDesc(
        (transactions ?? []).filter((transaction) => transaction.accountId === account.id),
      );

      const accountRunningBalances = computeRunningBalances(accountTransactions, account.balance);

      accountRunningBalances.forEach((balance, transactionId) => {
        map.set(transactionId, balance);
      });
    }

    return map;
  }, [accounts, transactions]);

  // ── Sheet open ──
  const openSheet = useCallback(() => {
    setDraft({ ...applied });
    setSheetOpen(true);
  }, [applied]);

  const applyFilters = useCallback(() => {
    setApplied({ ...draft });
  }, [draft]);

  // ── Search ──
  const enterSearch = useCallback(() => {
    setSearchMode(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const exitSearch = useCallback(() => {
    setSearchMode(false);
    setSearchQuery("");
  }, []);

  const dateLabelApplied = `${formatDateLabel(applied.dateFrom)} - ${formatDateLabel(applied.dateTo)}`;
  const countLabel = filtered.length === 1 ? "1 transacción" : `${filtered.length} transacciones`;

  // ── Totales ──
  const totalIngresos = useMemo(
    () =>
      filtered
        .filter((t) => t.kind === "income" || t.kind === "cashback" || t.kind === "refund")
        .reduce((acc, t) => acc + t.amount, 0),
    [filtered],
  );
  const totalGastos = useMemo(
    () =>
      filtered
        .filter(
          (t) =>
            t.kind === "expense" ||
            t.kind === "payment" ||
            t.kind === "cardPayment" ||
            t.kind === "installments",
        )
        .reduce((acc, t) => acc + t.amount, 0),
    [filtered],
  );

  // ── Chip de cuentas ──
  const accountsChipLabel = useMemo(() => {
    if (applied.accountIds.length === 0) return null;
    const names = applied.accountIds
      .map((id) => accountMap.get(id))
      .filter(Boolean) as string[];
    if (names.length === 0) return null;
    return names.join(", ");
  }, [applied.accountIds, accountMap]);

  return (
    <div className="mx-auto w-full max-w-[980px]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-[var(--app-bg)]">
        {searchMode ? (
          <div className="flex items-center gap-2 py-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar"
              className="type-page-title flex-1 bg-transparent font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              aria-label="Buscar transacciones"
            />
            <button
              type="button"
              aria-label="Cerrar búsqueda"
              onClick={exitSearch}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="type-page-title font-medium text-[var(--text-primary)]">
              Transacciones
            </h1>
            <button
              type="button"
              aria-label="Buscar transacciones"
              onClick={enterSearch}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <Search size={20} />
            </button>
          </div>
        )}

        {/* Filter row */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] pb-3 [scrollbar-width:none]">
          <button
            type="button"
            aria-label="Abrir filtros"
            onClick={openSheet}
            className="grid h-7 w-7 shrink-0 place-items-center text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <Filter size={17} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Filtrar por fecha"
            onClick={openSheet}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--text-primary)] transition hover:border-white/16 hover:bg-white/[0.08]"
          >
            <CalendarDays size={12} strokeWidth={2.2} className="shrink-0 text-[var(--accent)]" />
            <span>{dateLabelApplied}</span>
          </button>
          {accountsChipLabel && (
            <button
              type="button"
              aria-label="Filtrar por cuenta"
              onClick={openSheet}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--text-primary)] transition hover:border-white/16 hover:bg-white/[0.08]"
            >
              <Landmark size={12} strokeWidth={2.2} className="shrink-0 text-white/50" />
              <span>{accountsChipLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Totales */}
      <div className="border-b border-white/[0.06] py-3">
        <div className="flex items-center justify-between py-0.5">
          <span className="type-body text-[var(--text-secondary)]">Ingreso</span>
          <span className="type-body font-medium text-[var(--accent)]">
            {formatAmountCLP(totalIngresos)}
          </span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="type-body text-[var(--text-secondary)]">Gastos</span>
          <span className="type-body font-medium text-[var(--text-primary)]">
            {formatAmountCLP(totalGastos)}
          </span>
        </div>
      </div>

      {/* Count */}
      <p className="type-label py-3 font-medium text-[var(--text-primary)]">{countLabel}</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)]">
            <Search size={28} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="type-body text-center text-[var(--text-secondary)]">
            No se encontraron entradas
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-10">
          {filtered.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              accountSlug={transaction.accountId}
              accountName={accountMap.get(transaction.accountId)}
              runningBalance={runningBalanceMap.get(transaction.id)}
            />
          ))}
        </div>
      )}

      {/* Filter sheet */}
      {sheetOpen && (
        <FilterSheet
          accounts={accounts ?? []}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          draft={draft}
          setDraft={setDraft}
          onApply={applyFilters}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
