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

import { getDebitAccountDetail, getDebitAccountTransaction } from "@/lib/mock-data";

type ActiveDialog = "delete" | "undo" | null;

export function DebitTransactionScreen() {
  const params = useParams<{ accountSlug: string; transactionSlug: string }>();
  const router = useRouter();
  const accountSlug = typeof params.accountSlug === "string" ? params.accountSlug : "";
  const transactionSlug = typeof params.transactionSlug === "string" ? params.transactionSlug : "";

  const account = useMemo(() => getDebitAccountDetail(accountSlug), [accountSlug]);
  const transaction = useMemo(
    () => getDebitAccountTransaction(accountSlug, transactionSlug),
    [accountSlug, transactionSlug],
  );
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [amount, setAmount] = useState(() => transaction?.amount.replace("$", "") ?? "0");
  const [description, setDescription] = useState(() => transaction?.description ?? "");
  const [transactionDate, setTransactionDate] = useState(() => transaction?.transactionDate ?? "");
  const [paymentDate, setPaymentDate] = useState(() => transaction?.paymentDate ?? "");
  const [accountName, setAccountName] = useState(() => transaction?.accountName ?? "");
  const [category, setCategory] = useState(() => transaction?.category ?? "");
  const [note, setNote] = useState(() => transaction?.note ?? "");

  if (!account || !transaction) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-8 pt-3 md:max-w-[560px] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=debito"
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">Movimiento no encontrado</h1>
            <div aria-hidden="true" />
          </header>

          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta transacción mockeada todavía.
          </div>
        </div>
      </div>
    );
  }

  const accountHref = `/cuentas/debito/${account.slug}`;

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-28 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href={accountHref}
            aria-label="Volver a cuenta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

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
            <span>$</span>
            <label htmlFor="transaction-amount" className="sr-only">
              Monto
            </label>
            <input
              id="transaction-amount"
              name="transaction-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-[7ch] border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
            />
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
            label="Fecha de Transaccion"
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
            value={accountName}
            onChange={setAccountName}
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
        <div className="mx-auto w-full">
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
        description="El balance de tu cuenta se actualizará"
        confirmLabel="SI"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={() =>
          router.push(`/cuentas/debito/${account.slug}?updated=1&deleted=${encodeURIComponent(transaction.description)}`)
        }
      />

      <ConfirmDialog
        isOpen={activeDialog === "undo"}
        title="Deshacer Pago"
        description="Este registro se enviará de vuelta a los pagos programados"
        confirmLabel="SI"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={() => router.push(`/cuentas/debito/${account.slug}?updated=1`)}
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
    <div className={`${className ?? ""} border-b border-[var(--line-strong)] pb-3 ${withTopPadding ? "pt-3" : ""}`}>
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
    <div className={`${className ?? ""} border-b border-[var(--line-strong)] pb-3 ${withTopPadding ? "pt-3" : ""}`}>
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

function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onCancel,
  onConfirm,
}: Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}>) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[22.5rem] rounded-[1.8rem] bg-[#121d27] px-6 py-7 shadow-[0_18px_42px_rgba(0,0,0,0.38)]"
      >
        <h2 className="type-subsection-title font-medium text-[var(--text-primary)]">{title}</h2>
        <p className="type-body mt-6 max-w-[18rem] text-[var(--text-primary)]">{description}</p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="type-body min-w-[4rem] rounded-full bg-[#0f2a39] px-5 py-2 font-medium text-[var(--accent)]"
          >
            NO
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`type-body min-w-[4rem] rounded-full bg-[#0f2a39] px-5 py-2 font-medium ${confirmClassName ?? "text-[var(--accent)]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
