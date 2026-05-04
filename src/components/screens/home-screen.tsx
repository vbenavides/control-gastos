"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  ChartNoAxesColumn,
  Check,
  Clock,
  CreditCard,
  Filter,
  HandCoins,
  List,
  ShoppingBag,
} from "lucide-react";
import { useMemo } from "react";

import {
  CircularProgress,
  EmptyState,
  IconBadge,
  SectionHeader,
  SubsectionHeader,
  SurfaceCard,
} from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";
import type { Transaction } from "@/lib/models";
import { getTransactionVisualMeta } from "@/lib/transaction-visuals";

export function HomeScreen() {
  const cardIcons = [ShoppingBag, CreditCard, HandCoins, ArrowLeftRight];

  const { accounts } = useDebitAccounts();
  const { cards } = useCreditCards();
  const { transactions } = useTransactions();

  const actualBalance = useMemo(
    () => (accounts ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );

  // Resumen del mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = useMemo(
    () =>
      (transactions ?? []).filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [transactions, currentMonth, currentYear],
  );

  // Gastos reales (pagos ya realizados, no pendientes)
  const totalExpenses = useMemo(
    () =>
      monthTransactions
        .filter((t) => (t.kind === "expense" || t.kind === "payment") && !t.isPending)
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions],
  );

  // Gasto proyectado = suma de pagos pendientes
  const projectedExpenses = useMemo(
    () =>
      (transactions ?? [])
        .filter((t) => t.isPending)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  );

  // Lista de pagos pendientes ordenados por fecha
  const pendingPayments = useMemo(
    () =>
      (transactions ?? [])
        .filter((t): t is Transaction => t.isPending === true)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.kind === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions],
  );

  const netFlow = totalIncome - totalExpenses;

  const totalCardBalance = useMemo(
    () => (cards ?? []).reduce((sum, c) => sum + c.balance, 0),
    [cards],
  );

  const netFlowAmount = formatAmountCLP(netFlow);

  const monthCards = [
    {
      kind: "general" as const,
      title: "Gasto General",
      amount: formatAmountCLP(totalExpenses),
      description: totalExpenses === 0 ? "Sin entradas aún" : `${monthTransactions.length} transacciones`,
    },
    {
      kind: "cards" as const,
      title: "Gasto con Tarjetas",
      amount: formatAmountCLP(totalCardBalance),
      description: totalCardBalance === 0 ? "Sin entradas aún" : `${(cards ?? []).length} tarjeta${(cards ?? []).length !== 1 ? "s" : ""}`,
    },
    {
      kind: "income" as const,
      title: "Ingreso recibido",
      amount: formatAmountCLP(totalIncome),
      description: totalIncome === 0 ? "No hay ingresos programados" : "Este mes",
    },
    {
      kind: "flow" as const,
      title: "Flujo de efectivo",
      amount: netFlowAmount,
      description: `Ingreso ${formatAmountCLP(totalIncome)}`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-8 md:space-y-10">
      <SectionHeader title="Inicio" className="mb-7 md:mb-10" />

      <section className="w-full">
        <SubsectionHeader
          title="Disponible para gastar"
          action={<Filter size={20} className="text-[var(--text-secondary)]" />}
        />
        <SurfaceCard className="px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between md:min-h-[244px]">
            <div className="flex-1 space-y-5 text-sm">
              <div>
                <p className="text-[var(--text-secondary)]">Balance Actual</p>
                <p className="type-display mt-1 font-semibold text-[var(--text-primary)]">
                  {formatAmountCLP(actualBalance)}
                </p>
              </div>
              <div className="space-y-4 text-[var(--text-secondary)] md:max-w-[320px]">
                <div>
                  <p>Balance Proyectado</p>
                  <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(actualBalance - projectedExpenses)}
                  </p>
                </div>
                <div>
                  <p>Gasto Proyectado</p>
                  <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(projectedExpenses)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end">
              <CircularProgress
                value={actualBalance > 0 ? Math.min(Math.round((totalExpenses / actualBalance) * 100), 100) : 0}
                className="h-[8.5rem] w-[8.5rem] md:h-[10.25rem] md:w-[10.25rem]"
                innerClassName="h-[7.25rem] w-[7.25rem] md:h-[9rem] md:w-[9rem]"
                center={
                  <div className="text-center">
                    <Check size={24} className="mx-auto text-[var(--success)] md:size-7" />
                    <p className="mt-1 text-lg font-semibold md:text-[1.65rem]">{formatAmountCLP(actualBalance)}</p>
                    <p className="text-sm font-normal text-[var(--text-secondary)] md:text-base">Restante</p>
                  </div>
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-full bg-[var(--accent-soft)] px-4 py-3 text-center text-sm font-medium text-[var(--accent)] md:mt-7">
            Este mes
          </div>
        </SurfaceCard>
      </section>

      <section className="w-full">
        <SubsectionHeader
          title="Este mes"
          action={<ChartNoAxesColumn size={20} className="text-[var(--text-secondary)]" />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {monthCards.map((card, index) => {
            const Icon = cardIcons[index] ?? ShoppingBag;

            return (
              <SurfaceCard key={card.title} className="overflow-hidden">
                <div className="flex items-center gap-3 bg-black/35 px-5 py-4">
                  <IconBadge className="h-11 w-11 rounded-full bg-white/10 text-white">
                    <Icon size={18} />
                  </IconBadge>
                  <div>
                    <p className="type-body text-[var(--text-secondary)]">{card.title}</p>
                    <p className="type-body-strong font-semibold text-[var(--text-primary)]">
                      {card.amount}
                    </p>
                  </div>
                </div>
                {card.kind === "flow" ? (
                  <div className="space-y-3 px-5 py-4 text-[var(--text-secondary)]">
                    <p className="type-label">Resumen</p>
                    <div className="grid grid-cols-2 gap-4 text-[var(--text-primary)]">
                      <div>
                        <p className="type-body text-[var(--success)]">Ingreso</p>
                        <p className="type-body-strong mt-1 font-medium text-[var(--text-primary)]">
                          {formatAmountCLP(totalIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="type-body text-[var(--danger)]">Egreso</p>
                        <p className="type-body-strong mt-1 font-medium text-[var(--text-primary)]">
                          {formatAmountCLP(totalExpenses)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-4 text-[var(--text-secondary)]">
                    <p className="type-label flex items-center gap-2">
                      {card.kind === "income" ? <Calendar size={14} /> : null}
                      {card.kind === "income" ? "Próximo" : "Gastos principales"}
                    </p>
                    <p className="type-body-strong mt-2 font-medium text-[var(--text-primary)]">
                      {card.description}
                    </p>
                  </div>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <SubsectionHeader
          title="Próximo"
          action={<List size={20} className="text-[var(--text-secondary)]" />}
        />
        {pendingPayments.length === 0 ? (
          <EmptyState
            icon={<Check size={26} />}
            title="¡Todo pagado!"
            description="No hay compromisos próximos."
            className="pt-8 md:pt-12"
          />
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((tx) => (
              <PendingPaymentRow
                key={tx.id}
                transaction={tx}
                currentBalance={actualBalance - projectedExpenses}
                accounts={accounts ?? []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Fila de pago pendiente en sección "Próximo" ──────────────────────────────

import type { DebitAccount } from "@/lib/models";

function PendingPaymentRow({
  transaction,
  currentBalance,
  accounts,
}: {
  transaction: Transaction;
  currentBalance: number;
  accounts: DebitAccount[];
}) {
  const today = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue = transaction.date < today;
  const { categories } = useCategories();
  const visual = getTransactionVisualMeta(transaction, categories);
  const Icon = visual.Icon;
  const accountName =
    accounts.find((a) => a.id === transaction.accountId)?.name ?? "";

  // Formato de fecha legible: "1 abr 2026 a las 17:49"
  const formattedDate = (() => {
    if (!transaction.date) return "";
    const [year, month, day] = transaction.date.split("-");
    const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const m = MONTHS[(parseInt(month ?? "1", 10) - 1)];
    return `${parseInt(day ?? "1", 10)} ${m} ${year}`;
  })();

  const balanceAfter = currentBalance - transaction.amount;

  return (
    <Link
      href={`/cuentas/debito/${transaction.accountId}/transaccion/${transaction.id}`}
      className="block overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:border-white/[0.11] hover:bg-[#1b2732]"
    >
      {/* Cabecera: fecha + badges */}
      <div className="flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 md:px-4">
        <span className="type-label text-white/84">{formattedDate}</span>
        <div className="flex items-center gap-1.5">
          {accountName ? (
            <span className="type-label rounded-full bg-white/10 px-2 py-0.5 text-white/70">
              {accountName.slice(0, 1).toUpperCase()}
            </span>
          ) : null}
          {isOverdue ? (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-white/60">
              <AlertTriangle size={11} strokeWidth={2.5} />
            </span>
          ) : (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-white/60">
              <Clock size={11} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex items-center gap-3 px-3 py-3 md:px-4">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem] md:h-10 md:w-10"
          style={{ backgroundColor: visual.backgroundColor, color: visual.color }}
        >
          <Icon size={15} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body truncate text-[var(--text-primary)]">{transaction.description}</p>
          <p className="type-label mt-1 text-white/55">{accountName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="type-body text-[var(--text-primary)]">{formatAmountCLP(transaction.amount)}</p>
          <p className="type-label mt-1 text-white/45">{formatAmountCLP(balanceAfter)}</p>
        </div>
      </div>
    </Link>
  );
}
