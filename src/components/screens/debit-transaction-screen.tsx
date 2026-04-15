"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Clock, Layers, Trash2, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput, sanitizeNumericInput, stripMoneyFormat, formatMoneyInput, getNumericInputWidth, normalizeNumericBlurValue } from "@/lib/numeric-input";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { FormDateField, FormNotesField, FormPickerField, FormTextField } from "@/components/screens/transaction-form-base";
import { AccountPickerSheet, CategoryPickerSheet } from "@/components/screens/picker-sheets";

type ActiveDialog = "delete" | "undo" | null;

export function DebitTransactionScreen() {
  const params = useParams<{ accountSlug: string; transactionSlug: string }>();
  const router = useRouter();
  const accountId =
    typeof params.accountSlug === "string" ? params.accountSlug : "";
  const transactionId =
    typeof params.transactionSlug === "string" ? params.transactionSlug : "";

  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { categories } = useCategories();
  const { transactions, isLoading: txLoading, remove, update } = useTransactions();

  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );
  const transaction = useMemo(
    () => (transactions ?? []).find((t) => t.id === transactionId) ?? null,
    [transactions, transactionId],
  );

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Campos editables — valores ISO / raw
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  // Inicializar una sola vez cuando la transacción carga
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!transaction || initializedRef.current) return;
    initializedRef.current = true;
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setDate(transaction.date);
    setPaymentDate(transaction.paymentDate);
    setSelectedAccountId(transaction.accountId);
    // categoría: buscar por nombre para obtener id
    setNotes(transaction.note ?? "");
  }, [transaction]);

  // Resolver categoryId desde el nombre en transaction (categorías cargan async)
  const categoryResolved = useRef(false);
  useEffect(() => {
    if (!transaction || !categories || categoryResolved.current) return;
    const match = categories.find((c) => c.name === transaction.category);
    if (match) {
      setCategoryId(match.id);
      categoryResolved.current = true;
    }
  }, [transaction, categories]);

  const selectedAccountName =
    (accounts ?? []).find((a) => a.id === selectedAccountId)?.name ?? "";
  const selectedCategoryName =
    (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";

  const isDirty = useMemo(() => {
    if (!transaction) return false;
    const numAmount = parseNumericInput(amount);
    const origCategory = (categories ?? []).find((c) => c.id === categoryId)?.name ?? categoryId;
    return (
      numAmount !== transaction.amount ||
      description !== transaction.description ||
      date !== transaction.date ||
      paymentDate !== transaction.paymentDate ||
      selectedAccountId !== transaction.accountId ||
      origCategory !== transaction.category ||
      (notes.trim() || undefined) !== (transaction.note ?? undefined)
    );
  }, [transaction, amount, description, date, paymentDate, selectedAccountId, categoryId, notes, categories]);

  const handleDelete = async () => {
    if (!transaction) return;
    await remove(transaction.id);
    router.push(
      `/cuentas/debito/${accountId}?updated=1&deleted=${encodeURIComponent(transaction.description)}`,
    );
  };

  const handleSave = async () => {
    if (!transaction || !isDirty || isSaving) return;
    setIsSaving(true);
    try {
      await update(transaction.id, {
        amount: parseNumericInput(amount) || transaction.amount,
        description: description.trim() || transaction.description,
        date,
        paymentDate,
        accountId: selectedAccountId || transaction.accountId,
        category: selectedCategoryName || transaction.category,
        note: notes.trim() || undefined,
      });
      router.back();
    } finally {
      setIsSaving(false);
    }
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

  const displayAmount = formatMoneyInput(amount, DEFAULT_CURRENCY_CODE);

  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-full w-full max-w-[36rem] flex-col px-4 sm:max-w-[40rem] sm:px-5 md:max-w-[700px] md:px-6 lg:max-w-[820px] lg:px-8">

        {/* Header */}
        <header className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center pt-3 pb-1">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Editar Gasto
          </h1>
          <button
            type="button"
            aria-label="Eliminar gasto"
            onClick={() => setActiveDialog("delete")}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <Trash2 size={22} strokeWidth={2.2} />
          </button>
        </header>

        {/* Scroll body */}
        <div className="scroll-safe-edge min-h-0 flex-1 overflow-y-auto">

          {/* Monto editable */}
          <section className="px-1 pt-7 text-center">
            <p className="text-[0.76rem] font-medium tracking-wide text-[var(--text-secondary)]">
              Monto
            </p>
            <div className="mt-1.5 flex items-baseline justify-center gap-[1px] type-display font-medium text-[var(--text-primary)]">
              <span aria-hidden="true">$</span>
              <label htmlFor="edit-amount" className="sr-only">Monto</label>
              <input
                id="edit-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={(e) =>
                  setAmount(sanitizeNumericInput(stripMoneyFormat(e.target.value, DEFAULT_CURRENCY_CODE), "integer"))
                }
                onBlur={() => setAmount(normalizeNumericBlurValue(amount, "integer"))}
                style={{ width: getNumericInputWidth(displayAmount) }}
                className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
              />
            </div>
            <div className="mt-3 flex justify-center">
              <StatusBadge label={transaction.statusLabel} />
            </div>
          </section>

          {/* Campos */}
          <section className="mt-8">
            <FormTextField
              id="edit-description"
              label="Descripción"
              value={description}
              onChange={setDescription}
            />
            <FormDateField
              id="edit-date"
              label="Fecha de Transacción"
              value={date}
              onChange={setDate}
            />
            <FormDateField
              id="edit-payment-date"
              label="Fecha de Pago"
              value={paymentDate}
              onChange={setPaymentDate}
            />
            <FormPickerField
              label="Cuenta"
              icon={<Wallet size={16} />}
              value={selectedAccountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowAccountPicker(true)}
            />
            <FormPickerField
              label="Categoría"
              icon={<Layers size={16} />}
              value={selectedCategoryName}
              placeholder="Selecciona categoría"
              onClick={() => setShowCategoryPicker(true)}
            />
            <FormNotesField value={notes} onChange={setNotes} />
          </section>
        </div>

        {/* Footer pinned */}
        <div className="shrink-0 border-t border-white/[0.06] pb-6 pt-4">
          {isDirty ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="type-body h-14 w-full rounded-2xl bg-[var(--accent)] font-semibold text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] transition hover:brightness-105 disabled:opacity-60"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveDialog("undo")}
              className="type-body h-14 w-full rounded-2xl bg-[#16485c] font-semibold text-[var(--accent)] transition hover:brightness-105"
            >
              Deshacer Pago
            </button>
          )}
        </div>
      </div>

      {/* Dialogs */}
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
        onConfirm={() => router.push(`/cuentas/debito/${accountId}?updated=1`)}
      />

      {showAccountPicker && (
        <AccountPickerSheet
          selected={selectedAccountId}
          onSelect={(id) => setSelectedAccountId(id)}
          onClose={() => setShowAccountPicker(false)}
          pickerKey="account"
        />
      )}

      {showCategoryPicker && (
        <CategoryPickerSheet
          type="expense"
          selected={categoryId}
          onSelect={setCategoryId}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type StatusConfig = { icon: ReactNode; color: string };

function resolveStatus(label: string): StatusConfig {
  const normalized = label.toLowerCase();
  if (normalized === "retrasado") {
    return {
      icon: <AlertTriangle size={13} strokeWidth={2.4} />,
      color: "text-[#f55a3d]",
    };
  }
  if (normalized === "programado") {
    return {
      icon: <Clock size={13} strokeWidth={2.4} />,
      color: "text-white/80",
    };
  }
  return {
    icon: <Check size={13} strokeWidth={2.4} />,
    color: "text-white/80",
  };
}

function StatusBadge({ label }: { label: string }) {
  const { icon, color } = resolveStatus(label);
  return (
    <span className={`inline-flex items-center gap-1 text-[0.72rem] font-semibold tracking-[0.08em] ${color}`}>
      {icon}
      <span>{label.toUpperCase()}</span>
    </span>
  );
}
