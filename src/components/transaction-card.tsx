import Link from "next/link";
import {
  Check,
  Clock,
  HeartPulse,
  Layers3,
  PiggyBank,
  ShoppingCart,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";

import type { Transaction, TransactionIconKind } from "@/lib/models";
import { formatAmountCLP } from "@/lib/currency";
import { formatShortDateEs } from "@/lib/date";

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
  const isPending = transaction.isPending === true;

  // Para pagos pendientes: detectar si está retrasado
  const isOverdue = isPending && transaction.date < new Date().toISOString().split("T")[0];

  return (
    <div
      className={[
        "overflow-hidden rounded-[0.9rem] border shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition",
        isPending
          ? "border-[#f55a3d]/25 bg-[#1f1510] hover:border-[#f55a3d]/40"
          : "border-white/[0.06] bg-[#17212b] hover:border-white/[0.11]",
      ].join(" ")}
    >
      <div
        className={[
          "type-label flex min-h-[2rem] items-center justify-between border-b px-3 md:min-h-[2.2rem] md:px-4",
          isPending
            ? "border-[#f55a3d]/20 bg-[#f55a3d]/[0.07] text-[#f55a3d]/80"
            : "border-white/[0.06] bg-white/[0.065] text-white/84",
        ].join(" ")}
      >
        <span>{formatShortDateEs(transaction.date)}</span>
        {isPending ? (
          <Clock size={14} strokeWidth={2.3} className="shrink-0" />
        ) : (
          <Check size={15} strokeWidth={2.3} className="shrink-0" />
        )}
      </div>

      <Link
        href={`/cuentas/debito/${accountSlug}/transaccion/${transaction.id}`}
        prefetch={true}
        className={[
          "flex min-h-[4.8rem] items-center gap-3 px-3 py-3 transition md:min-h-[5.15rem] md:px-4 md:py-3.5",
          isPending ? "hover:bg-[#251810]" : "hover:bg-[#1b2732]",
        ].join(" ")}
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem] md:h-10 md:w-10"
          style={{
            backgroundColor: isPending ? "#2a1208" : transaction.iconBackground,
            color: isPending ? "#f55a3d" : transaction.iconColor,
          }}
        >
          {isPending
            ? <Clock size={15} strokeWidth={2.2} />
            : renderTransactionIcon(transaction.iconKind)}
        </div>

        <div className="min-w-0 flex-1 self-center">
          <p className="type-body truncate text-[var(--text-primary)]">{transaction.description}</p>
          {accountName ? (
            <p className="type-label mt-1.5 text-white/82">{accountName}</p>
          ) : null}
          {isPending && (
            <p className={`type-label mt-1 font-semibold tracking-wide ${isOverdue ? "text-[#f55a3d]" : "text-[#f5a43d]"}`}>
              {isOverdue ? "● RETRASADO" : "● PENDIENTE"}
            </p>
          )}
        </div>

        <div className="shrink-0 self-center text-right">
          <p className={`type-body ${isPending ? "text-[#f55a3d]/80" : "text-[var(--text-primary)]"}`}>
            {formatAmountCLP(transaction.amount)}
          </p>
        </div>
      </Link>
    </div>
  );
}
