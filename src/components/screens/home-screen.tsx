"use client";

import {
  ArrowLeftRight,
  ChartNoAxesColumn,
  Check,
  CreditCard,
  Filter,
  HandCoins,
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
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

export function HomeScreen() {
  const cardIcons = [ShoppingBag, CreditCard, HandCoins, ArrowLeftRight];

  const { accounts } = useDebitAccounts();
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

  const totalExpenses = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.kind === "expense" || t.kind === "payment")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions],
  );

  const totalIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.kind === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions],
  );

  const netFlow = totalIncome - totalExpenses;

  const monthCards = [
    {
      title: "Gasto General",
      amount: formatAmountCLP(totalExpenses),
      description: totalExpenses === 0 ? "Sin entradas aún" : `${monthTransactions.length} transacciones`,
    },
    {
      title: "Gasto con Tarjetas",
      amount: "$0",
      description: "Sin entradas aún",
    },
    {
      title: "Ingreso recibido",
      amount: formatAmountCLP(totalIncome),
      description: totalIncome === 0 ? "No hay ingresos programados" : "Este mes",
    },
    {
      title: "Flujo neto",
      amount: formatAmountCLP(Math.abs(netFlow)),
      description: `Ingreso ${formatAmountCLP(totalIncome)}`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-8 md:space-y-10">
      <SectionHeader
        title="Inicio"
        className="mb-7 md:mb-10"
        action={<Filter size={22} className="text-[var(--text-secondary)]" />}
      />

      <section className="w-full">
        <SubsectionHeader title="Disponible para gastar" />
        <SurfaceCard className="px-5 py-6 md:px-6 md:py-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between md:min-h-[260px]">
            <div className="flex-1 space-y-4 text-sm">
              <div>
                <p className="text-[var(--text-secondary)]">Balance Actual</p>
                <p className="type-display mt-1 font-semibold text-[var(--text-primary)]">
                  {formatAmountCLP(actualBalance)}
                </p>
              </div>
              <div className="grid gap-3 text-[var(--text-secondary)] sm:grid-cols-2 md:max-w-[460px]">
                <div>
                  <p>Balance Proyectado</p>
                  <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(actualBalance)}
                  </p>
                </div>
                <div>
                  <p>Gasto Proyectado</p>
                  <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(totalExpenses)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center sm:justify-end">
              <CircularProgress
                value={actualBalance > 0 ? Math.min(Math.round((totalExpenses / actualBalance) * 100), 100) : 0}
                center={
                  <div className="text-center">
                    <Check size={20} className="mx-auto text-[var(--success)]" />
                    <p className="mt-1 text-base font-semibold">{formatAmountCLP(actualBalance)}</p>
                    <p className="text-xs font-normal text-[var(--text-secondary)]">Restante</p>
                  </div>
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-full bg-[var(--accent-soft)] px-4 py-3 text-center text-sm font-medium text-[var(--accent)]">
            Este mes
          </div>
        </SurfaceCard>
      </section>

      <section className="w-full">
        <SubsectionHeader
          title="Este mes"
          action={<ChartNoAxesColumn size={20} className="text-[var(--text-secondary)]" />}
        />
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {monthCards.map((card, index) => {
            const Icon = cardIcons[index] ?? ShoppingBag;

            return (
              <SurfaceCard key={card.title} className="min-w-[310px] snap-start overflow-hidden md:min-w-0">
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
                <div className="px-5 py-4 text-[var(--text-secondary)]">
                  <p className="type-label">Gastos principales</p>
                  <p className="type-body-strong mt-2 font-medium text-[var(--text-primary)]">
                    {card.description}
                  </p>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <SubsectionHeader title="Próximo" />
        <EmptyState
          icon={<Check size={26} />}
          title="¡Todo pagado!"
          description="No hay compromisos próximos."
          className="pt-8"
        />
      </section>
    </div>
  );
}
