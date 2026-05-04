import { formatShortDateEs } from "@/lib/date";
import type { CreditCard, Transaction } from "@/lib/models";

export function parseInstallmentTotal(note?: string): number {
  if (!note) return 1;
  const match = /^(\d+) pagos/.exec(note);
  return match ? Math.max(1, parseInt(match[1] ?? "1", 10)) : 1;
}

export function isDeferredInstallment(note?: string): boolean {
  return note?.includes("Compra ahora, paga después") ?? false;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("T")[0]!.split("-").map((part) => parseInt(part, 10));
  return new Date(year || 0, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

function clampDay(year: number, monthIndex: number, day: number): number {
  return Math.min(day, new Date(year, monthIndex + 1, 0).getDate());
}

export function getInstallmentFirstPaymentDate(transaction: Transaction, card: CreditCard): Date {
  const refSource = isDeferredInstallment(transaction.note) ? transaction.paymentDate : transaction.date;
  const ref = parseIsoDate(refSource);
  const refDay = ref.getDate();
  let statementMonth = ref.getMonth();
  let statementYear = ref.getFullYear();

  if (card.statementDay < refDay) {
    statementMonth += 1;
    if (statementMonth > 11) {
      statementMonth = 0;
      statementYear += 1;
    }
  }

  let paymentMonth = statementMonth + 1;
  let paymentYear = statementYear;

  if (paymentMonth > 11) {
    paymentMonth = 0;
    paymentYear += 1;
  }

  return new Date(
    paymentYear,
    paymentMonth,
    clampDay(paymentYear, paymentMonth, card.paymentDay),
    12,
    0,
    0,
    0,
  );
}

export type InstallmentScheduleItem = {
  installmentNumber: number;
  dueDate: string;
  dueLabel: string;
  scheduledAmount: number;
};

export function getInstallmentSchedule(
  transaction: Transaction,
  card: CreditCard,
): InstallmentScheduleItem[] {
  const totalPayments = parseInstallmentTotal(transaction.note);
  const scheduledAmount = Math.round(transaction.amount / totalPayments);
  const firstPaymentDate = getInstallmentFirstPaymentDate(transaction, card);

  return Array.from({ length: totalPayments }, (_, index) => {
    const date = new Date(
      firstPaymentDate.getFullYear(),
      firstPaymentDate.getMonth() + index,
      clampDay(
        firstPaymentDate.getFullYear(),
        firstPaymentDate.getMonth() + index,
        firstPaymentDate.getDate(),
      ),
      12,
      0,
      0,
      0,
    );

    const dueDate = toIsoDate(date);

    return {
      installmentNumber: index + 1,
      dueDate,
      dueLabel: formatShortDateEs(dueDate),
      scheduledAmount,
    };
  });
}
