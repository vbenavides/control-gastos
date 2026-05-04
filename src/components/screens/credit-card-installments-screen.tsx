"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, CircleCheck, Plus } from "lucide-react";
import { useMemo } from "react";

import { formatAmountCLP } from "@/lib/currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useInstallmentPayments } from "@/lib/hooks/use-installment-payments";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseInstallmentTotal } from "@/lib/installments";
import { getTransactionVisualMeta } from "@/lib/transaction-visuals";

export function CreditCardInstallmentsScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const router = useRouter();
  const { cards, isLoading } = useCreditCards();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { installmentPayments } = useInstallmentPayments();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const purchaseTransactions = useMemo(
    () => (transactions ?? []).filter((transaction) => transaction.accountId === cardId && transaction.kind === "installments"),
    [transactions, cardId],
  );

  const paidCountByPurchaseId = useMemo(() => {
    const map = new Map<string, number>();

    for (const payment of installmentPayments ?? []) {
      if (!payment.isPaid) continue;
      map.set(
        payment.purchaseTransactionId,
        (map.get(payment.purchaseTransactionId) ?? 0) + 1,
      );
    }

    return map;
  }, [installmentPayments]);

  const backHref = `/cuentas/tarjeta/${cardId}`;
  const addHref = `/agregar/compra-a-meses?cardId=${cardId}`;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
          <Link
            href="/cuentas?tab=credito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
            Compras a Meses
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
      <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-1 pb-2">
        <Link
          href={backHref}
          prefetch={true}
          aria-label="Volver al detalle de tarjeta"
          className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
        >
          <ArrowLeft size={22} />
        </Link>

        <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
          Compras a Meses
        </h1>

        <button
          type="button"
          aria-label="Agregar compra a meses"
          onClick={() => router.push(addHref)}
          className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      </header>

      {purchaseTransactions.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 pb-16 text-center">
          <p className="type-body max-w-[22rem] text-[var(--text-secondary)]">
            Registra tus compras a meses y da seguimiento a tus pagos
          </p>
          <button
            type="button"
            onClick={() => router.push(addHref)}
            className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full bg-[#0f2a39] px-6 text-[0.9rem] font-medium text-[var(--accent)] transition hover:bg-[#132f40]"
          >
            Agregar Compra a Meses
          </button>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-[0.95rem] border border-white/[0.07] bg-[#17212b] shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
          {purchaseTransactions.map((transaction, index) => {
            const totalPayments = parseInstallmentTotal(transaction.note);
            const paidCount = paidCountByPurchaseId.get(transaction.id) ?? 0;
            const visual = getTransactionVisualMeta(transaction, categories);
            const Icon = visual.Icon;
            const progressPct = totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 0;
            const isFullyPaid = paidCount >= totalPayments;
            const scheduledAmount = totalPayments > 0 ? Math.round(transaction.amount / totalPayments) : 0;
            const remainingAmount = Math.max(0, transaction.amount - paidCount * scheduledAmount);

            return (
              <button
                key={transaction.id}
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/compras-a-meses/${transaction.id}`)}
                className={[
                  "w-full px-4 py-3.5 text-left transition hover:bg-white/[0.03]",
                  index > 0 ? "border-t border-white/[0.07]" : "",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: visual.backgroundColor, color: visual.color }}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="type-label truncate font-medium text-[var(--text-primary)]">
                      {transaction.description}
                    </p>
                    <p className="type-helper mt-0.5 text-[var(--text-secondary)]">
                      Pagado {paidCount} de {totalPayments} pagos
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="type-label font-medium text-[var(--text-primary)]">
                      {formatAmountCLP(remainingAmount)}
                    </p>
                    <div className="h-[3px] w-20 overflow-hidden rounded-full bg-white/[0.1]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-1.5 pl-11">
                  {isFullyPaid ? (
                    <CircleCheck size={12} strokeWidth={2} className="shrink-0 text-[#8de56c]" />
                  ) : (
                    <CircleAlert size={12} strokeWidth={2} className="shrink-0 text-[#f55a3d]" />
                  )}
                  <p className="type-helper text-[var(--text-secondary)]">
                    {isFullyPaid ? "Pagos registrados" : "Faltan pagos programados"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
