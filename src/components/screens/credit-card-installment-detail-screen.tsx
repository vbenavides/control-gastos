"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleAlert, Check, Clock, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatAmountCLP } from "@/lib/currency";
import { formatShortDateEs } from "@/lib/date";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useInstallmentPayments } from "@/lib/hooks/use-installment-payments";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { getInstallmentSchedule, parseInstallmentTotal } from "@/lib/installments";

type TopNotice = {
  title: string;
  description: string;
};

export function CreditCardInstallmentDetailScreen() {
  const params = useParams<{ cardId: string; transactionId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";
  const transactionId = typeof params.transactionId === "string" ? params.transactionId : "";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { cards, isLoading: cardsLoading } = useCreditCards();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { installmentPayments, isLoading: paymentsLoading } = useInstallmentPayments();

  const [dismissedNoticeKey, setDismissedNoticeKey] = useState("");

  const card = useMemo(
    () => (cards ?? []).find((item) => item.id === cardId) ?? null,
    [cards, cardId],
  );

  const transaction = useMemo(
    () => (transactions ?? []).find((item) => item.id === transactionId) ?? null,
    [transactions, transactionId],
  );

  const purchasePayments = useMemo(
    () => (installmentPayments ?? [])
      .filter((payment) => payment.purchaseTransactionId === transactionId)
      .sort((left, right) => left.installmentNumber - right.installmentNumber),
    [installmentPayments, transactionId],
  );

  const paymentByInstallment = useMemo(() => {
    const map = new Map<number, (typeof purchasePayments)[number]>();

    for (const payment of purchasePayments) {
      map.set(payment.installmentNumber, payment);
    }

    return map;
  }, [purchasePayments]);

  const schedule = useMemo(() => {
    if (!card || !transaction) return [];
    return getInstallmentSchedule(transaction, card);
  }, [card, transaction]);

  const totalPayments = useMemo(
    () => parseInstallmentTotal(transaction?.note),
    [transaction?.note],
  );

  const paidCount = purchasePayments.filter((p) => p.isPaid).length;
  const paidAmount = purchasePayments
    .filter((p) => p.isPaid)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max((transaction?.amount ?? 0) - paidAmount, 0);

  const noticeKey = searchParams.get("noticeAt")
    ?? `${searchParams.get("noticeAccount") ?? ""}|${searchParams.get("noticeBalance") ?? ""}`;
  const topNotice = useMemo<TopNotice | null>(() => {
    const noticeAccount = searchParams.get("noticeAccount");
    const noticeBalance = searchParams.get("noticeBalance");

    if (!noticeAccount || !noticeBalance || dismissedNoticeKey === noticeKey) {
      return null;
    }

    return {
      title: `${noticeAccount}: ${formatAmountCLP(Number(noticeBalance))}`,
      description: "Balance de cuenta actualizado",
    };
  }, [dismissedNoticeKey, noticeKey, searchParams]);

  useEffect(() => {
    if (!topNotice) return;
    router.replace(pathname, { scroll: false });
    const timer = window.setTimeout(() => setDismissedNoticeKey(noticeKey), 3200);
    return () => window.clearTimeout(timer);
  }, [noticeKey, pathname, router, topNotice]);

  if (cardsLoading || transactionsLoading || paymentsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!card || !transaction) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
          <Link
            href={`/cuentas/tarjeta/${cardId}`}
            aria-label="Volver a tarjeta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Compra no encontrada
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
          No encontramos esta compra a meses.
        </div>
      </div>
    );
  }

  const progressPct = totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 0;

  return (
    <>
      {topNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 bg-[#ffc64b] px-4 py-3 text-[#12171d] shadow-[0_12px_24px_rgba(0,0,0,0.18)] md:left-1/2 md:right-auto md:top-4 md:w-[min(50rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.1rem] md:px-5 lg:w-[min(54rem,calc(100vw-4rem))]"
        >
          <div className="mx-auto w-full">
            <p className="type-body-strong font-medium text-[#12171d]">{topNotice.title}</p>
            <p className="type-body mt-1 text-[#12171d]">{topNotice.description}</p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[36rem] px-4 pb-10 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pb-3 pt-1">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.push(`/cuentas/tarjeta/${card.id}`)}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className="type-subsection-title truncate text-center font-medium text-[var(--text-primary)]">
            {transaction.description}
          </h1>

          <button
            type="button"
            aria-label="Editar compra a meses"
            onClick={() => router.push(`/cuentas/tarjeta/${card.id}/transaccion/${transaction.id}`)}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Pencil size={20} strokeWidth={2.1} />
          </button>
        </header>

        <section className="pt-2 text-center">
          <p className="type-display font-medium text-[var(--text-primary)]">
            {formatAmountCLP(transaction.amount)}
          </p>
          <p className="type-label mt-1 text-[var(--text-secondary)]">
            {formatShortDateEs(transaction.date)}
          </p>
        </section>

        <section className="mt-9">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="type-label text-[var(--text-secondary)]">Pagado</p>
              <p className="type-body mt-1 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(paidAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="type-label text-[var(--text-secondary)]">Restante</p>
              <p className="type-body mt-1 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(remainingAmount)}
              </p>
            </div>
          </div>

          <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-[#163246]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="type-body font-medium text-[var(--text-primary)]">
            Pagado {paidCount} de {totalPayments} pagos
          </h2>

          <div className="mt-4 space-y-4">
            {schedule.map((item) => {
              const payment = paymentByInstallment.get(item.installmentNumber);

              return (
                <button
                  key={item.installmentNumber}
                  type="button"
                  onClick={() => router.push(`/cuentas/tarjeta/${card.id}/compras-a-meses/${transaction.id}/${item.installmentNumber}`)}
                  className="w-full overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] text-left shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:border-white/[0.1] hover:bg-[#1b2732]"
                >
                  <div className="flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 text-[#ffffffd0] md:px-4">
                    <span className="type-helper">{item.dueLabel}</span>
                    {payment?.isPaid ? (
                      <Check size={14} strokeWidth={2.2} className="text-[#dce8f1]" />
                    ) : payment ? (
                      <Clock size={14} strokeWidth={2.1} className="text-[#f5a43d]" />
                    ) : (
                      <CircleAlert size={14} strokeWidth={2.1} className="text-[#f55a3d]" />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 px-3 py-4 md:px-4">
                    <p className="type-body truncate text-[var(--text-primary)]">
                      {transaction.description} ({item.installmentNumber} de {totalPayments})
                    </p>
                    <p className="type-body shrink-0 font-medium text-[var(--text-primary)]">
                      {formatAmountCLP(payment?.amount ?? item.scheduledAmount)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
