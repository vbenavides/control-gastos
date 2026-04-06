"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CreditCard,
  MessageSquare,
  ShoppingCart,
  SquarePen,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatAmountCLP } from "@/lib/currency";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

type ActiveDialog = "delete" | "undo" | null;

export function DebitTransactionScreen() {
  const params = useParams<{ accountSlug: string; transactionSlug: string }>();
  const router = useRouter();
  const accountId =
    typeof params.accountSlug === "string" ? params.accountSlug : "";
  const transactionId =
    typeof params.transactionSlug === "string" ? params.transactionSlug : "";

  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { transactions, isLoading: txLoading, remove } = useTransactions();

  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );
  const transaction = useMemo(
    () => (transactions ?? []).find((t) => t.id === transactionId) ?? null,
    [transactions, transactionId],
  );

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  // Campos del formulario inicializados desde el transaction
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setTransactionDate(transaction.date);
      setPaymentDate(transaction.paymentDate);
      setCategory(transaction.category);
      setNote(transaction.note ?? "");
    }
  }, [transaction]);

  const handleDelete = async () => {
    if (!transaction) return;
    await remove(transaction.id);
    router.push(
      `/cuentas/debito/${accountId}?updated=1&deleted=${encodeURIComponent(transaction.description)}`,
    );
  };

  if (accountsLoading || txLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="flex min-h-dvh items-center justify-center">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!account || !transaction) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=debito"
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
              Movimiento no encontrado
            </h1>
            <div aria-hidden="true" />
          </header>

          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta transacción.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-28 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className="type-subsection-title text-center font-semibold text-[var(--text-primary)]">
            Editar Gasto
          </h1>

          <button
            type="button"
            aria-label="Eliminar gasto"
            onClick={() => setActiveDialog("delete")}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Trash2 size={22} strokeWidth={2.2} />
          </button>
        </header>

        <section className="px-1 pt-8 text-center md:pt-10">
          <p className="type-body text-[var(--text-primary)]">Monto</p>
          <div className="type-display mt-1 flex items-center justify-center gap-1 font-medium text-[var(--text-primary)]">
            <span>{formatAmountCLP(transaction.amount)}</span>
          </div>

          <div className="type-label mt-4 inline-flex items-center gap-1.5 font-semibold tracking-[0.06em] text-[var(--text-primary)]">
            <Check size={15} strokeWidth={2.4} />
            <span>{transaction.statusLabel}</span>
          </div>
        </section>

        <section className="mt-12 grid gap-x-8 gap-y-0 md:grid-cols-2 lg:mx-auto lg:w-full lg:max-w-[60rem] xl:max-w-[64rem]">
          <FieldRow
            label="Descripción"
            icon={<SquarePen size={16} className="shrink-0 text-white/92" />}
            value={description}
            onChange={setDescription}
            className="md:col-span-2"
          />
          <FieldRow
            label="Fecha de Transacción"
            icon={<CalendarDays size={16} className="shrink-0 text-white/92" />}
            value={transactionDate}
            onChange={setTransactionDate}
            withTopPadding
          />
          <FieldRow
            label="Fecha de pago"
            icon={<CalendarDays size={16} className="shrink-0 text-white/92" />}
            value={paymentDate}
            onChange={setPaymentDate}
            withTopPadding
          />
          <FieldRow
            label="Cuenta"
            icon={<CreditCard size={16} className="shrink-0 text-white/92" />}
            value={account.name}
            onChange={() => {
              /* cambio de cuenta: TODO */
            }}
            withTopPadding
          />
          <FieldRow
            label="Categoría"
            icon={<ShoppingCart size={16} className="shrink-0 text-white/92" />}
            value={category}
            onChange={setCategory}
            withTopPadding
          />
          <TextAreaRow
            label="Notas"
            icon={<MessageSquare size={16} className="shrink-0 text-white/92" />}
            value={note}
            onChange={setNote}
            withTopPadding
            className="md:col-span-2"
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[#111a23] px-6 pb-5 pt-5 shadow-[0_-10px_28px_rgba(0,0,0,0.28)] md:bottom-4 md:left-1/2 md:right-auto md:w-[min(52rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.2rem] md:border md:px-5 lg:w-[min(56rem,calc(100vw-4rem))]">
        <div className="mx-auto flex w-full gap-3">
          <button
            type="button"
            onClick={() => setActiveDialog("undo")}
            className="flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[#16485c] px-6 text-[1rem] font-medium text-[var(--accent)]"
          >
            Deshacer Pago
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={activeDialog === "delete"}
        title="¿Eliminar gasto?"
        description="El registro de esta transacción se eliminará permanentemente."
        confirmLabel="SI"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        isOpen={activeDialog === "undo"}
        title="Deshacer Pago"
        description="Este registro se enviará de vuelta a los pagos programados"
        confirmLabel="SI"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={() =>
          router.push(`/cuentas/debito/${accountId}?updated=1`)
        }
      />
    </div>
  );
}

function FieldRow({
  label,
  icon,
  value,
  onChange,
  withTopPadding = false,
  className,
}: Readonly<{
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  withTopPadding?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={`${className ?? ""} border-b border-[var(--line-strong)] pb-3 ${withTopPadding ? "pt-3" : ""}`}
    >
      <p className="type-label mb-2 text-[var(--text-primary)]">{label}</p>

      <div className="flex items-center gap-3 text-[var(--text-primary)]">
        {icon}
        <input
          type="text"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="type-body min-h-9 min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}

function TextAreaRow({
  label,
  icon,
  value,
  onChange,
  withTopPadding = false,
  className,
}: Readonly<{
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  withTopPadding?: boolean;
  className?: string;
}>) {
  return (
    <div
      className={`${className ?? ""} border-b border-[var(--line-strong)] pb-3 ${withTopPadding ? "pt-3" : ""}`}
    >
      <p className="type-label mb-2 text-[var(--text-primary)]">{label}</p>

      <div className="flex items-start gap-3 text-[var(--text-primary)]">
        <div className="pt-2">{icon}</div>
        <textarea
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="type-body min-h-[4.5rem] min-w-0 flex-1 resize-none border-0 bg-transparent p-0 pt-1 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}
