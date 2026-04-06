"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Filter, Landmark, Menu, Search } from "lucide-react";
import { useMemo } from "react";

import { TransactionCard } from "@/components/transaction-card";
import { formatAmountCLP } from "@/lib/currency";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

export function AllTransactionsScreen() {
  const params = useParams<{ accountSlug: string }>();
  const accountId = typeof params.accountSlug === "string" ? params.accountSlug : "";

  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { transactions, isLoading: txLoading } = useTransactions();

  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  const accountTransactions = useMemo(
    () =>
      (transactions ?? [])
        .filter((t) => t.accountId === accountId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, accountId],
  );

  const totalGastos = useMemo(
    () => accountTransactions.reduce((acc, t) => acc + t.amount, 0),
    [accountTransactions],
  );

  const accountHref = `/cuentas/debito/${accountId}`;
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
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-dvh w-full max-w-[36rem] flex-col md:max-w-[860px] lg:max-w-[1160px] xl:max-w-[1280px]">
        {/* ── Top navigation bar ── */}
        <header className="shrink-0 px-4 pt-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href={accountHref}
              prefetch={true}
              aria-label="Volver a cuenta"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Buscar transacciones"
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
            </div>
          </div>

          <h1 className="type-page-title mt-2 font-medium text-[var(--text-primary)]">
            Transacciones
          </h1>

          {/* Filter chips */}
          <div className="mt-4 flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <button
              type="button"
              aria-label="Filtros"
              className="grid h-7 w-7 shrink-0 place-items-center text-[var(--text-secondary)]"
            >
              <Filter size={17} strokeWidth={2} />
            </button>

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
              <span>{account.name}</span>
            </button>
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div className="scroll-safe-edge min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <span className="type-body text-[var(--text-secondary)]">Gastos</span>
            <span className="type-body font-medium text-[var(--text-primary)]">
              {formatAmountCLP(totalGastos)}
            </span>
          </div>

          <p className="type-label pb-3 font-medium text-[var(--text-primary)]">
            {accountTransactions.length}{" "}
            {accountTransactions.length === 1 ? "transacción" : "transacciones"}
          </p>

          {accountTransactions.length === 0 ? (
            <div className="type-body mt-2 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
              Esta cuenta todavía no tiene transacciones.
            </div>
          ) : (
            <div className="space-y-3 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
              {accountTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  accountSlug={accountId}
                  accountName={account.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
