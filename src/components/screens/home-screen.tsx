"use client";

import {
  ArrowLeftRight,
  Calendar,
  ChartNoAxesColumn,
  Check,
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
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

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
        <EmptyState
          icon={<Check size={26} />}
          title="¡Todo pagado!"
          description="No hay compromisos próximos."
          className="pt-8 md:pt-12"
        />
      </section>
    </div>
  );
}
