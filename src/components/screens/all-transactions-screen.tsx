"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Filter, Landmark, Menu, Search } from "lucide-react";
import { useMemo } from "react";

import { TransactionCard } from "@/components/transaction-card";
import { formatAmountCLP, parseAmountCLP } from "@/lib/currency";
import { getDebitAccountDetail } from "@/lib/mock-data";

export function AllTransactionsScreen() {
  const params = useParams<{ accountSlug: string }>();
  const accountSlug = typeof params.accountSlug === "string" ? params.accountSlug : "";
  const account = useMemo(() => getDebitAccountDetail(accountSlug), [accountSlug]);

  const transactions = useMemo(() => account?.recentTransactions ?? [], [account]);
  const totalGastos = useMemo(
    () => transactions.reduce((acc, t) => acc + parseAmountCLP(t.amount), 0),
    [transactions],
  );

  const accountHref = `/cuentas/debito/${accountSlug}`;

  if (!account) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-8 pt-3 md:max-w-[560px] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="flex items-center justify-between pt-1">
            <Link
              href="/cuentas?tab=debito"
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
          </header>
          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta cuenta mockeada todavía.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col md:max-w-[860px] lg:max-w-[1160px] xl:max-w-[1280px]">

        {/* ── Top navigation bar ── */}
        <header className="shrink-0 px-4 pt-3 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href={accountHref}
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
              <span>4 abr 2025 - 4 abr 2026</span>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <span className="type-body text-[var(--text-secondary)]">Gastos</span>
            <span className="type-body font-medium text-[var(--text-primary)]">
              {formatAmountCLP(totalGastos)}
            </span>
          </div>

          <p className="type-label pb-3 font-medium text-[var(--text-primary)]">
            {transactions.length}{" "}
            {transactions.length === 1 ? "transacción" : "transacciones"}
          </p>

          {transactions.length === 0 ? (
            <div className="type-body mt-2 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
              Esta cuenta todavía no tiene transacciones mockeadas.
            </div>
          ) : (
            <div className="space-y-3 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.slug}
                  transaction={transaction}
                  accountSlug={accountSlug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
