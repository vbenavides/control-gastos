import Link from "next/link";
import {
  Check,
  HeartPulse,
  Layers3,
  PiggyBank,
  ShoppingCart,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";

import type { Transaction, TransactionIconKind } from "@/lib/models";
import { formatAmountCLP } from "@/lib/currency";

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function renderTransactionIcon(kind: TransactionIconKind) {
  switch (kind) {
    case "piggy-bank":
      return <PiggyBank size={15} strokeWidth={2.2} />;
    case "shopping-cart":
      return <ShoppingCart size={15} strokeWidth={2.2} />;
    case "layers":
      return <Layers3 size={15} strokeWidth={2.2} />;
    case "train":
      return <TrainFront size={15} strokeWidth={2.2} />;
    case "heart":
      return <HeartPulse size={15} strokeWidth={2.2} />;
    case "utensils":
      return <UtensilsCrossed size={15} strokeWidth={2.2} />;
  }
}

export function TransactionCard({
  transaction,
  accountSlug,
  accountName,
}: Readonly<{
  transaction: Transaction;
  /** ID de la cuenta (parámetro de ruta). */
  accountSlug: string;
  /** Nombre legible de la cuenta para mostrar en la card. */
  accountName?: string;
}>) {
  return (
    <div className="overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:border-white/[0.11]">
      <div className="type-label flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 text-white/84 md:min-h-[2.2rem] md:px-4">
        <span>{formatDateLabel(transaction.date)}</span>
        <Check size={15} strokeWidth={2.3} className="shrink-0" />
      </div>

      <Link
        href={`/cuentas/debito/${accountSlug}/transaccion/${transaction.id}`}
        className="flex min-h-[4.8rem] items-center gap-3 px-3 py-3 transition hover:bg-[#1b2732] md:min-h-[5.15rem] md:px-4 md:py-3.5"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem] md:h-10 md:w-10"
          style={{
            backgroundColor: transaction.iconBackground,
            color: transaction.iconColor,
          }}
        >
          {renderTransactionIcon(transaction.iconKind)}
        </div>

        <div className="min-w-0 flex-1 self-center">
          <p className="type-body truncate text-[var(--text-primary)]">{transaction.description}</p>
          {accountName ? (
            <p className="type-label mt-1.5 text-white/82">{accountName}</p>
          ) : null}
        </div>

        <div className="shrink-0 self-center text-right">
          <p className="type-body text-[var(--text-primary)]">{formatAmountCLP(transaction.amount)}</p>
        </div>
      </Link>
    </div>
  );
}
