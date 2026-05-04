import { getInstallmentFirstPaymentDate, parseInstallmentTotal } from "@/lib/installments";
import type { CreditCard, InstallmentPayment, Transaction } from "@/lib/models";

export type CreditCardStatementSummary = {
  previousBalance: number;
  payments: number;
  purchases: number;
  installmentsDue: number;
  newBalance: number;
  interestFreePayment: number;
  displayBalanceAdjustment: number;
};

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("T")[0]!.split("-").map((part) => parseInt(part, 10));
  return new Date(y || 0, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function clampDay(year: number, monthIndex: number, day: number): number {
  return Math.min(day, new Date(year, monthIndex + 1, 0).getDate());
}

/**
 * Given the LAST closed statement date, returns the date of the cycle that
 * opened before it (i.e. the start of the closed billing period).
 */
function getPrevStatementCloseDate(lastClose: Date, statementDay: number): Date {
  const prevMonth = lastClose.getMonth() === 0 ? 11 : lastClose.getMonth() - 1;
  const prevYear = lastClose.getMonth() === 0 ? lastClose.getFullYear() - 1 : lastClose.getFullYear();
  return new Date(
    prevYear,
    prevMonth,
    clampDay(prevYear, prevMonth, statementDay),
    12,
    0,
    0,
    0,
  );
}

export function getLastStatementCloseDate(statementDay: number, ref = new Date()): Date {
  const currentMonthDate = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    clampDay(ref.getFullYear(), ref.getMonth(), statementDay),
    12,
    0,
    0,
    0,
  );

  if (ref >= currentMonthDate) return currentMonthDate;

  const prevMonth = ref.getMonth() === 0 ? 11 : ref.getMonth() - 1;
  const prevYear = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear();

  return new Date(
    prevYear,
    prevMonth,
    clampDay(prevYear, prevMonth, statementDay),
    12,
    0,
    0,
    0,
  );
}

export function buildCreditCardStatementSummary(
  card: CreditCard | null,
  cardTransactions: Transaction[],
  linkedCardPayments: Transaction[],
  installmentPayments: InstallmentPayment[],
  ref = new Date(),
): CreditCardStatementSummary {
  if (!card) {
    return {
      previousBalance: 0,
      payments: 0,
      purchases: 0,
      installmentsDue: 0,
      newBalance: 0,
      interestFreePayment: 0,
      displayBalanceAdjustment: 0,
    };
  }

  const lastClose = getLastStatementCloseDate(card.statementDay, ref);
  const prevClose = getPrevStatementCloseDate(lastClose, card.statementDay);

  // Use the CLOSED billing cycle (prevClose → lastClose) so "Balance Anterior"
  // and "Pagos" reflect what actually happened in the last completed period.
  const cycleCardTxs = cardTransactions.filter((tx) => {
    const d = parseIsoDate(tx.date);
    return d > prevClose && d <= lastClose;
  });
  const cycleLinkedPayments = linkedCardPayments.filter((tx) => {
    const d = parseIsoDate(tx.date);
    return d > prevClose && d <= lastClose;
  });

  const payments = cycleLinkedPayments.reduce((sum, tx) => sum + tx.amount, 0);
  const purchases = cycleCardTxs
    .filter((tx) => tx.kind === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const paidCountByPurchaseId = new Map<string, number>();
  const paidAmountByPurchaseId = new Map<string, number>();

  for (const payment of installmentPayments) {
    if (!payment.isPaid) continue;

    paidCountByPurchaseId.set(
      payment.purchaseTransactionId,
      (paidCountByPurchaseId.get(payment.purchaseTransactionId) ?? 0) + 1,
    );

    paidAmountByPurchaseId.set(
      payment.purchaseTransactionId,
      (paidAmountByPurchaseId.get(payment.purchaseTransactionId) ?? 0) + payment.amount,
    );
  }

  let installmentsDue = 0;
  let displayBalanceAdjustment = 0;

  for (const transaction of cardTransactions) {
    if (transaction.kind !== "installments") continue;

    const totalPayments = parseInstallmentTotal(transaction.note);
    const paidCount = paidCountByPurchaseId.get(transaction.id) ?? 0;

    if (paidCount >= totalPayments) continue;

    const firstPaymentDate = getInstallmentFirstPaymentDate(transaction, card);
    if (firstPaymentDate > ref) continue;

    const roundedInstallmentAmount = Math.round(transaction.amount / totalPayments);
    const exactPaidAmount = paidAmountByPurchaseId.get(transaction.id) ?? 0;
    const exactRemainingAmount = Math.max(transaction.amount - exactPaidAmount, 0);
    const displayRemainingAmount = roundedInstallmentAmount * (totalPayments - paidCount);

    installmentsDue += roundedInstallmentAmount;
    displayBalanceAdjustment += displayRemainingAmount - exactRemainingAmount;
  }

  const newBalance = card.balance + displayBalanceAdjustment;
  const previousBalance = Math.max(newBalance + payments - purchases, 0);
  const interestFreePayment = Math.max(newBalance - installmentsDue, 0);

  return {
    previousBalance,
    payments,
    purchases,
    installmentsDue,
    newBalance,
    interestFreePayment,
    displayBalanceAdjustment,
  };
}
