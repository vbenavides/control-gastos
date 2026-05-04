"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

import { formatAmountCLP, formatSignedAmountCLP } from "@/lib/currency";
import { buildCreditCardStatementSummary } from "@/lib/credit-card-statement";
import { sortTransactionsDesc } from "@/lib/date";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useInstallmentPayments } from "@/lib/hooks/use-installment-payments";
import { useTransactions } from "@/lib/hooks/use-transactions";

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function formatStatementDate(day: number): string {
  const now = new Date();
  const statementMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return `${day} ${MONTHS_SHORT[statementMonth]}`;
}

function formatPaymentDate(day: number): string {
  const now = new Date();
  return `${day} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`;
}

export function CreditCardStatementScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const { cards, isLoading: cardsLoading } = useCreditCards();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { installmentPayments, isLoading: paymentsLoading } = useInstallmentPayments();

  const card = useMemo(
    () => (cards ?? []).find((item) => item.id === cardId) ?? null,
    [cards, cardId],
  );

  const cardTransactions = useMemo(
    () => sortTransactionsDesc((transactions ?? []).filter((transaction) => transaction.accountId === cardId)),
    [transactions, cardId],
  );

  const linkedCardPayments = useMemo(
    () => sortTransactionsDesc((transactions ?? []).filter((transaction) =>
      transaction.kind === "cardPayment" && (
        transaction.cardId === cardId ||
        (!transaction.cardId && transaction.description === `Pago tarjeta ${card?.name ?? ""}`)
      )
    )),
    [transactions, cardId, card?.name],
  );

  const statementSummary = useMemo(
    () => buildCreditCardStatementSummary(card, cardTransactions, linkedCardPayments, installmentPayments ?? []),
    [card, cardTransactions, linkedCardPayments, installmentPayments],
  );

  const displayBalance = statementSummary.newBalance;
  const backHref = `/cuentas/tarjeta/${cardId}`;

  if (cardsLoading || transactionsLoading || paymentsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pb-1 pt-3">
          <Link
            href="/cuentas?tab=credito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
            Estado de Cuenta
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
          No encontramos esta tarjeta.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[36rem] px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
      <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-start bg-[var(--app-bg)] pb-3 pt-1">
        <Link
          href={backHref}
          prefetch={true}
          aria-label="Volver al detalle de tarjeta"
          className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
        >
          <ArrowLeft size={22} />
        </Link>

        <div className="text-center">
          <h1 className="type-subsection-title font-bold text-[var(--text-primary)]">
            Estado de Cuenta
          </h1>
          <p className="type-label mt-1 text-[var(--text-primary)]">
            {card.name}
          </p>
        </div>

        <div aria-hidden="true" />
      </header>

      <section className="px-1 pt-8 text-center md:pt-10">
        <p className="type-label text-[var(--text-primary)]">Nuevo Balance</p>
        <p className="type-display mt-1 font-medium text-[var(--text-primary)]">
          {formatAmountCLP(Math.round(displayBalance))}
        </p>
        <p className="type-helper mt-2 text-[var(--text-secondary)]">
          Estado de cuenta al {formatStatementDate(card.statementDay)}
        </p>
      </section>

      <section className="mt-8">
        <div className="overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label text-[var(--text-secondary)]">Balance Anterior</p>
            <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.previousBalance))}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label text-[var(--text-secondary)]">Pagos</p>
            <p className="type-label text-[var(--text-primary)]">{formatSignedAmountCLP(-Math.round(statementSummary.payments))}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label text-[var(--text-secondary)]">Compras</p>
            <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.purchases))}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label text-[var(--text-secondary)]">Pagos a Meses</p>
            <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.installmentsDue))}</p>
          </div>

          <div className="border-t border-white/[0.1]" />

          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label font-semibold text-[var(--text-primary)]">Nuevo Balance</p>
            <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.newBalance))}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label font-semibold text-[var(--text-primary)]">Pago para no generar intereses</p>
            <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.interestFreePayment))}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="type-label font-semibold text-[var(--text-primary)]">Fecha de Pago</p>
            <p className="type-label font-semibold text-[var(--text-primary)]">{formatPaymentDate(card.paymentDay)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
