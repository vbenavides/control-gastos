"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  CreditCard,
  ListFilter,
  Pencil,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_CURRENCY_CODE, formatAmountCLP, formatSignedAmountCLP } from "@/lib/currency";
import { buildCreditCardStatementSummary } from "@/lib/credit-card-statement";
import { formatShortDateEs, sortTransactionsDesc } from "@/lib/date";
import { useInstallmentPayments } from "@/lib/hooks/use-installment-payments";
import type { Transaction } from "@/lib/models";
import { useCategories } from "@/lib/hooks/use-categories";
import { parseInstallmentTotal } from "@/lib/installments";
import {
  formatMoneyInput,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { getTransactionVisualMeta } from "@/lib/transaction-visuals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function formatDayMonth(day: number): string {
  const now = new Date();
  const month = MONTHS_SHORT[now.getMonth()];
  return `${day} ${month}`;
}

function formatStatementDate(day: number): string {
  const now = new Date();
  // El estado de cuenta es del mes anterior al corte
  const statementMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return `${day} ${MONTHS_SHORT[statementMonth]}`;
}

function formatPaymentDate(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = MONTHS_SHORT[now.getMonth()];
  return `${day} ${month} ${year}`;
}

// ─── CC running balance ───────────────────────────────────────────────────────

/**
 * Computes balance AFTER each transaction for a credit card.
 * `sortedDesc` must be sorted newest-first.
 * `currentBalance` is the card's current debt.
 */
function computeCCRunningBalances(
  sortedDesc: Transaction[],
  currentBalance: number,
): Map<string, number> {
  const map = new Map<string, number>();
  let bal = currentBalance;
  for (const tx of sortedDesc) {
    map.set(tx.id, bal);
    // Going backward: undo this tx's effect
    if (tx.kind === "cardPayment" || tx.kind === "cashback") {
      // These decrease debt → going back, restore debt
      bal += tx.amount;
    } else {
      // installments/expense/etc → increase debt → going back, remove it
      bal -= tx.amount;
    }
  }
  return map;
}

// ─── Next payment due label ───────────────────────────────────────────────────

function nextPaymentDueLabel(paymentDay: number): string {
  const now = new Date();
  let month = now.getMonth();
  if (now.getDate() > paymentDay) {
    month = (month + 1) % 12;
  }
  return `${paymentDay} ${MONTHS_SHORT[month]}`;
}

// ─── Usage helpers ────────────────────────────────────────────────────────────

function usagePct(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((balance / limit) * 100));
}

function usageLabel(pct: number): string {
  if (pct === 0) return "Bueno";
  if (pct < 30) return "Excelente";
  if (pct < 60) return "Bueno";
  if (pct < 80) return "Regular";
  return "Alto";
}

// ─── Componente principal ─────────────────────────────────────────────────────

type TopNotice = {
  title: string;
  description: string;
};

export function CreditCardDetailScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const { cards, isLoading, update: updateCard } = useCreditCards();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const { installmentPayments } = useInstallmentPayments();

  const router = useRouter();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  // ── Transacciones de esta tarjeta ──
  const cardTransactions = useMemo(
    () => sortTransactionsDesc((transactions ?? []).filter((t) => t.accountId === cardId)),
    [transactions, cardId],
  );

  const installmentTxs = useMemo(
    () => cardTransactions.filter((t) => t.kind === "installments"),
    [cardTransactions],
  );

  const linkedCardPayments = useMemo(
    () => sortTransactionsDesc((transactions ?? []).filter((t) =>
      t.kind === "cardPayment" && (
        t.cardId === cardId ||
        (!t.cardId && t.description === `Pago tarjeta ${card?.name ?? ""}`)
      )
    )),
    [transactions, cardId, card?.name],
  );

  const installmentPaymentsByPurchaseId = useMemo(() => {
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

  // Counts ALL saved installment payments regardless of isPaid status.
  // Used to detect if installments are "scheduled" even if not yet paid.
  const savedInstallmentCountById = useMemo(() => {
    const map = new Map<string, number>();

    for (const payment of installmentPayments ?? []) {
      map.set(
        payment.purchaseTransactionId,
        (map.get(payment.purchaseTransactionId) ?? 0) + 1,
      );
    }

    return map;
  }, [installmentPayments]);

  const recentTxs = useMemo(() => cardTransactions.slice(0, 5), [cardTransactions]);

  const statementSummary = useMemo(() => {
    return buildCreditCardStatementSummary(
      card,
      cardTransactions,
      linkedCardPayments,
      installmentPayments ?? [],
    );
  }, [card, cardTransactions, linkedCardPayments, installmentPayments]);

  const displayBalance = statementSummary.newBalance;

  const ccRunningBalances = useMemo(
    () => computeCCRunningBalances(recentTxs, displayBalance),
    [recentTxs, displayBalance],
  );

  const [topNotice, setTopNotice] = useState<TopNotice | null>(null);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInputValue, setBalanceInputValue] = useState("0");

  const cardCurrencyCode = card?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  const openBalanceDialog = useCallback(() => {
    setBalanceInputValue(card ? String(card.balance) : "0");
    setShowBalanceDialog(true);
  }, [card]);

  const handleSaveBalance = useCallback(async () => {
    if (!card) return;
    const parsed = parseNumericInput(balanceInputValue);
    await updateCard(card.id, { balance: parsed });
    setShowBalanceDialog(false);
    setTopNotice({
      title: `${card.name}: ${formatAmountCLP(parsed)}`,
      description: "Balance actualizado",
    });
  }, [card, balanceInputValue, updateCard]);

  useEffect(() => {
    if (!topNotice) return;
    const timer = window.setTimeout(() => setTopNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [topNotice]);

  useEffect(() => {
    if (!showBalanceDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowBalanceDialog(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBalanceDialog]);

  // ── Estado: cargando ──
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  // ── Estado: no encontrada ──
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
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Tarjeta no encontrada
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
          No encontramos esta tarjeta.
        </div>
      </div>
    );
  }

  const available = Math.max(card.limit - displayBalance, 0);
  const pct = usagePct(displayBalance, card.limit);
  const sameDay = card.statementDay === card.paymentDay;

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

      <div className="mx-auto w-full max-w-[36rem] px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">

        {/* ── Header fijo ── */}
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-white/[0.06] bg-[var(--app-bg)] pb-4 pt-1">
          <Link
            href="/cuentas?tab=credito"
            prefetch={true}
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <div className="text-center">
            <h1 className="type-subsection-title font-semibold leading-tight text-[var(--text-primary)]">
              {card.name}
            </h1>
            <p className="type-label mt-0.5 text-[var(--text-secondary)]">
              ... {card.last4}
            </p>
          </div>

          <Link
            href={`/cuentas/tarjeta/${card.id}/editar`}
            prefetch={false}
            aria-label="Editar tarjeta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Pencil size={21} strokeWidth={2.2} />
          </Link>
        </header>

        <div className="pb-24">

          {/* Balance */}
          <section className="px-1 pt-8 text-center md:pt-10">
            <p className="type-label text-[var(--text-primary)]">Balance</p>
            <p className="type-display mt-1 font-medium text-[var(--text-primary)]">
              {formatAmountCLP(Math.round(displayBalance))}
            </p>

            <button
              type="button"
              onClick={openBalanceDialog}
              className="mx-auto mt-5 inline-flex min-h-[2.4rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[0.9rem] font-medium text-[var(--accent)]"
            >
              Actualizar Balance
            </button>
          </section>

          {/* Disponible + Fecha de corte */}
          <section className="mt-8 flex items-stretch">
            <div className="flex-1 text-center">
              <p className="type-helper text-[var(--text-secondary)]">Disponible</p>
              <p className="type-label mt-1 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(available)}
              </p>
            </div>

            <div className="w-px self-stretch bg-white/[0.12]" />

            <div className="flex-1 text-center">
              <p className="type-helper text-[var(--text-secondary)]">Fecha de corte</p>
              <p className="type-label mt-1 font-medium text-[var(--text-primary)]">
                {formatDayMonth(card.statementDay)}
              </p>
            </div>
          </section>

          {/* Warning: mismo día de corte y pago */}
          {sameDay ? (
            <div className="mt-6 flex gap-3 rounded-[0.85rem] border border-[#f5c842]/20 bg-[#f5c842]/[0.08] px-4 py-3.5">
              <AlertTriangle
                size={16}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-[#f5c842]"
              />
              <p className="type-helper text-[var(--text-primary)]">
                La fecha de corte y de pago son el mismo día. Por favor, ingresa las fechas correctas para tu tarjeta.
              </p>
            </div>
          ) : null}

          {/* Estado de cuenta */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">
                Estado de cuenta al {formatStatementDate(card.statementDay)}
              </h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/estado-de-cuenta`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver todo
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
              {/* Fila: Balance Anterior */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Balance Anterior</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.previousBalance))}</p>
              </div>
              {/* Fila: Pagos */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Pagos</p>
                <p className="type-label text-[var(--text-primary)]">{formatSignedAmountCLP(-Math.round(statementSummary.payments))}</p>
              </div>
              {/* Fila: Compras */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Compras</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.purchases))}</p>
              </div>
              {/* Fila: Pagos a Meses */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Pagos a Meses</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.installmentsDue))}</p>
              </div>

              {/* Separador grueso */}
              <div className="border-t border-white/[0.1]" />

              {/* Fila: Nuevo Balance */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Nuevo Balance</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.newBalance))}</p>
              </div>
              {/* Fila: Pago para no generar intereses */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Pago para no generar intereses</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(Math.round(statementSummary.interestFreePayment))}</p>
              </div>
              {/* Fila: Fecha de Pago */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Fecha de Pago</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatPaymentDate(card.paymentDay)}</p>
              </div>
            </div>
          </section>

          {/* Pagos */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">Pagos</h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/pagos-programados`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver Programación
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {displayBalance > 0 ? (
                <>
                  <AlertTriangle size={16} strokeWidth={2} className="shrink-0 text-[#f5c842]" />
                  <p className="type-label text-[var(--text-secondary)]">
                    Tienes un pago pendiente que vence el{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {nextPaymentDueLabel(card.paymentDay)}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <CircleCheck size={16} strokeWidth={2.1} className="shrink-0 text-[#8de56c]" />
                  <p className="type-label text-[var(--text-secondary)]">
                    No tienes pagos pendientes para este periodo
                  </p>
                </>
              )}
            </div>

            {displayBalance > 0 ? (
              <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
                <div className="border-b border-white/[0.07] px-4 py-2">
                  <p className="type-helper text-[var(--text-secondary)]">
                    {formatPaymentDate(card.paymentDay)}
                  </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: "#0e1527", color: "#29bbf3" }}
                  >
                    <CreditCard size={15} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="type-label font-medium text-[var(--text-primary)]">
                      Pago de {card.name}
                    </p>
                    <p className="type-helper mt-0.5 text-[var(--text-secondary)]">{card.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="type-label font-medium text-[var(--text-primary)]">
                      {formatAmountCLP(Math.round(statementSummary.installmentsDue) || Math.round(displayBalance))}
                    </p>
                    <p className="type-helper mt-0.5 text-[var(--text-secondary)]">
                      {formatAmountCLP(Math.round(statementSummary.installmentsDue) || Math.round(displayBalance))}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex min-h-[4.5rem] items-center justify-center rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-5">
                <p className="type-label text-center text-[var(--text-secondary)]">
                  No hay pagos programados en este periodo
                </p>
              </div>
            )}
          </section>

          {/* Pagos a Meses */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">Pagos a Meses</h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/compras-a-meses`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver todo
              </button>
            </div>

            {installmentTxs.length === 0 ? (
              <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-6 text-center">
                <p className="type-label text-[var(--text-secondary)]">
                  Registra tus compras a meses y da seguimiento a tus pagos
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/agregar/compra-a-meses?cardId=${card.id}`)}
                  className="mx-auto mt-4 inline-flex min-h-[2.2rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[0.9rem] font-medium text-[var(--accent)]"
                >
                  Agregar Compra a Meses
                </button>
              </div>
            ) : (
              <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
                {installmentTxs.map((tx, idx) => {
                  const totalPayments = parseInstallmentTotal(tx.note);
                  const paid = installmentPaymentsByPurchaseId.get(tx.id) ?? 0;
                  const savedCount = savedInstallmentCountById.get(tx.id) ?? 0;
                  const pct = totalPayments > 0 ? Math.round((paid / totalPayments) * 100) : 0;
                  const isFullyPaid = paid >= totalPayments;
                  const allSaved = savedCount >= totalPayments;
                  const scheduledAmount = totalPayments > 0 ? Math.round(tx.amount / totalPayments) : 0;
                  const remainingAmount = Math.max(0, tx.amount - paid * scheduledAmount);
                  const visual = getTransactionVisualMeta(tx, categories);
                  const Icon = visual.Icon;
                  return (
                    <button
                      type="button"
                      key={tx.id}
                      onClick={() => router.push(`/cuentas/tarjeta/${card.id}/compras-a-meses/${tx.id}`)}
                      className={
                        idx > 0
                          ? "w-full border-t border-white/[0.07] px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                          : "w-full px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                      }
                    >
                      {/* Row 1: icon + description | amount + bar */}
                      <div className="flex items-start gap-3">
                        {/* Left: icon + description */}
                        <div
                          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                          style={{ backgroundColor: visual.backgroundColor, color: visual.color }}
                        >
                          <Icon size={15} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="type-label font-medium text-[var(--text-primary)] truncate">
                            {tx.description}
                          </p>
                          <p className="type-helper mt-0.5 text-[var(--text-secondary)]">
                            Pagado {paid} de {totalPayments} pagos
                          </p>
                        </div>
                        {/* Right: amount + bar */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <p className="type-label font-medium text-[var(--text-primary)]">
                            {formatAmountCLP(remainingAmount)}
                          </p>
                          <div className="w-20 h-[3px] overflow-hidden rounded-full bg-white/[0.1]">
                            <div
                              className="h-full rounded-full bg-[var(--accent)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 2: warning — only shown when fully paid or missing schedules */}
                      {(isFullyPaid || !allSaved) && (
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
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Uso de Crédito */}
          <section className="mt-8">
            <h2 className="type-body font-medium text-[var(--text-primary)]">
              Uso de Crédito
            </h2>

            <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 pb-4 pt-4">
              <p className="type-body-strong font-medium text-[var(--text-primary)]">{pct}%</p>

              {/* Barra de progreso */}
              <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.1]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="type-label text-[var(--text-secondary)]">{usageLabel(pct)}</p>
                <p className="type-label text-[var(--text-secondary)]">
                  Crédito Disponible{" "}
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(available)}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Transacciones recientes */}
          <section className="mt-8">
            <h2 className="type-body font-medium text-[var(--text-primary)]">
              Transacciones recientes
            </h2>

            {recentTxs.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-12">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1e3040]">
                  <ClipboardList size={28} strokeWidth={1.7} className="text-[var(--text-secondary)]" />
                </div>
                <p className="type-label mt-4 text-[var(--text-secondary)]">Sin entradas aún</p>
              </div>
            ) : (
              <>
                <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
                  {/* Group by date */}
                  {(() => {
                    const groups: { date: string; txs: typeof recentTxs }[] = [];
                    for (const tx of recentTxs) {
                      const dateKey = tx.date.split("T")[0] ?? tx.date;
                      const last = groups[groups.length - 1];
                      if (last && last.date === dateKey) {
                        last.txs.push(tx);
                      } else {
                        groups.push({ date: dateKey, txs: [tx] });
                      }
                    }
                    return groups.map((group) => (
                      <div key={group.date}>
                        {/* Date header */}
                        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
                          <p className="type-helper text-[var(--text-secondary)]">
                            {formatShortDateEs(group.date)}
                          </p>
                          <div className="flex items-center gap-3">
                            <ListFilter size={14} strokeWidth={2} className="text-[var(--text-secondary)]" />
                            <Check size={14} strokeWidth={2.2} className="text-[var(--text-secondary)]" />
                          </div>
                        </div>
                        {/* Rows */}
                        {group.txs.map((tx, idx) => {
                          const balAfter = ccRunningBalances.get(tx.id);
                          const visual = getTransactionVisualMeta(tx, categories);
                          const Icon = visual.Icon;
                          return (
                            <Link
                              key={tx.id}
                              href={`/cuentas/tarjeta/${card.id}/transaccion/${tx.id}`}
                              prefetch={false}
                              className={
                                idx > 0
                                  ? "flex items-center gap-3 border-t border-white/[0.05] px-4 py-3 transition hover:bg-white/[0.03]"
                                  : "flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
                              }
                            >
                              {/* Icon */}
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                          style={{ backgroundColor: visual.backgroundColor, color: visual.color }}
                        >
                          <Icon size={15} strokeWidth={2.2} />
                        </div>
                              {/* Description */}
                              <div className="min-w-0 flex-1">
                                <p className="type-label font-medium text-[var(--text-primary)] truncate">
                                  {tx.description}
                                </p>
                                <p className="type-helper mt-0.5 text-[var(--text-secondary)] truncate">
                                  {card.name}
                                </p>
                              </div>
                              {/* Amount + balance */}
                              <div className="shrink-0 text-right">
                                <p className="type-label font-medium text-[var(--text-primary)]">
                                  {formatAmountCLP(tx.amount)}
                                </p>
                                {balAfter !== undefined && (
                                  <p className="type-helper mt-0.5 text-[var(--text-secondary)]">
                                    {formatAmountCLP(balAfter)}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>

                {/* Ver todas — botón separado */}
                <button
                  type="button"
                  onClick={() => router.push(`/cuentas/tarjeta/${card.id}/estado-de-cuenta`)}
                  className="mt-3 w-full rounded-[0.85rem] bg-[#0f2a39] py-3 text-center type-label font-medium text-[var(--accent)]"
                >
                  Ver todas las transacciones
                </button>
              </>
            )}
          </section>

        </div>
      </div>

      {showBalanceDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setShowBalanceDialog(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Actualizar balance"
            className="relative w-full max-w-[22rem] rounded-[1.8rem] bg-[#121d27] px-6 py-6 shadow-[0_18px_42px_rgba(0,0,0,0.38)]"
          >
            <h2 className="type-subsection-title font-medium text-[var(--text-primary)]">
              Balance
            </h2>

            <div className="mt-5">
              <label
                htmlFor="card-balance-input"
                className="type-label block text-center text-[var(--text-secondary)]"
              >
                Balance
              </label>
              <input
                id="card-balance-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={formatMoneyInput(balanceInputValue, cardCurrencyCode)}
                onChange={(event) =>
                  setBalanceInputValue(
                    sanitizeNumericInput(
                      stripMoneyFormat(event.target.value, cardCurrencyCode),
                      "integer",
                    ),
                  )
                }
                onBlur={() =>
                  setBalanceInputValue((current) =>
                    normalizeNumericBlurValue(current, "integer"),
                  )
                }
                className="type-body mt-3 w-full rounded-[0.75rem] border border-white/12 bg-white/[0.04] px-4 py-3 text-center text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:bg-white/[0.06]"
              />
            </div>

            <div className="mt-6 flex items-center gap-6">
              <button
                type="button"
                onClick={handleSaveBalance}
                className="type-body font-medium text-[var(--accent)]"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowBalanceDialog(false)}
                className="type-body font-medium text-[var(--text-primary)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
