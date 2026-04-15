"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Filter, Landmark, Menu, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

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

export function AllTransactionsScreen() {
  const params = useParams<{ accountSlug: string }>();
  const router = useRouter();
  const accountId = typeof params.accountSlug === "string" ? params.accountSlug : "";

  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { transactions, isLoading: txLoading } = useTransactions();
  const { categories } = useCategories();

  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  // ── Search ──
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const enterSearch = useCallback(() => {
    setSearchMode(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const exitSearch = useCallback(() => {
    setSearchMode(false);
    setSearchQuery("");
  }, []);

  // ── Filter sheet ──
  const [sheetOpen, setSheetOpen] = useState(false);

  // Arranca con la cuenta pre-seleccionada y último mes
  const [draft, setDraft] = useState<FilterState>(() => getDefaultFilterState(accountId));
  const [applied, setApplied] = useState<FilterState>(() => getDefaultFilterState(accountId));

  const openSheet = useCallback(() => {
    setDraft({ ...applied });
    setSheetOpen(true);
  }, [applied]);

  const applyFilters = useCallback(() => {
    setApplied({ ...draft });
  }, [draft]);

  // ── Computed ──
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

  // ── Chip labels ──
  const dateLabelApplied = `${formatDateLabel(applied.dateFrom)} - ${formatDateLabel(applied.dateTo)}`;

  const accountsChipLabel = useMemo(() => {
    if (applied.accountIds.length === 0) return null;
    const names = applied.accountIds
      .map((id) => accountMap.get(id))
      .filter(Boolean) as string[];
    return names.length > 0 ? names.join(", ") : null;
  }, [applied.accountIds, accountMap]);

  const countLabel =
    filtered.length === 1 ? "1 transacción" : `${filtered.length} transacciones`;

  const isLoading = accountsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="flex flex-1 items-center justify-center">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="flex items-center justify-between pt-1">
            <Link
              href="/cuentas?tab=debito"
              prefetch={true}
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
          </header>
          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta cuenta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[36rem] md:max-w-[860px] lg:max-w-[1160px] xl:max-w-[1280px]">

        {/* ── Top navigation bar ── */}
        <header className="sticky top-0 z-10 bg-[var(--app-bg)] px-4 pt-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Volver: router.back() preserva el scroll de la página anterior */}
            <button
              type="button"
              aria-label="Volver"
              onClick={() => router.back()}
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="flex items-center gap-0.5">
              {searchMode ? (
                <button
                  type="button"
                  aria-label="Cerrar búsqueda"
                  onClick={exitSearch}
                  className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Buscar transacciones"
                    onClick={enterSearch}
                    className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
                  >
                    <Search size={21} />
                  </button>
                  <Link
                    href="/menu"
                    prefetch={true}
                    aria-label="Abrir menú"
                    className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
                  >
                    <Menu size={21} />
                  </Link>
                </>
              )}
            </div>
          </div>

          {searchMode ? (
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar"
              className="type-page-title mt-2 w-full bg-transparent font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              aria-label="Buscar transacciones"
            />
          ) : (
            <h1 className="type-page-title mt-2 font-medium text-[var(--text-primary)]">
              Transacciones
            </h1>
          )}

          {/* Filter chips */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto border-b border-white/[0.06] pb-3 [scrollbar-width:none]">
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
        </header>

        {/* ── Body ── */}
        <div className="px-4 pb-10 md:px-6 lg:px-8">

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
            <div className="type-body mt-2 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
              No se encontraron transacciones para el período seleccionado.
            </div>
          ) : (
            <div className="space-y-3 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
              {filtered.map((transaction) => (
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
