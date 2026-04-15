"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Layers, RotateCcw, Trash2, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput, sanitizeNumericInput, stripMoneyFormat, formatMoneyInput, getNumericInputWidth, normalizeNumericBlurValue } from "@/lib/numeric-input";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import {
  AutoPaymentRow,
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormTextField,
  FormToggleRow,
  NumberPickerSheet,
  RecurringFields,
  useRecurringSection,
} from "@/components/screens/transaction-form-base";
import { AccountPickerSheet, CategoryPickerSheet } from "@/components/screens/picker-sheets";

type ActiveDialog = "delete" | "undo" | null;

export function DebitTransactionScreen() {
  const params = useParams<{ accountSlug: string; transactionSlug: string }>();
  const router = useRouter();
  const accountId =
    typeof params.accountSlug === "string" ? params.accountSlug : "";
  const transactionId =
    typeof params.transactionSlug === "string" ? params.transactionSlug : "";

  const { accounts, isLoading: accountsLoading, update: updateAccount, adjustBalance: adjustAccountBalance } = useDebitAccounts();
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
  const [isPaying, setIsPaying] = useState(false);

  // Campos editables — valores ISO / raw
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  // Campos exclusivos de payment
  const [paymentDone, setPaymentDone] = useState(false);
  const [autoPayment, setAutoPayment] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const recurring = useRecurringSection();

  // Inicializar una sola vez cuando la transacción carga
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!transaction || initializedRef.current) return;
    initializedRef.current = true;
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setDate(transaction.date.split("T")[0] ?? transaction.date);
    setPaymentDate(transaction.paymentDate.split("T")[0] ?? transaction.paymentDate);
    setSelectedAccountId(transaction.accountId);
    setNotes(transaction.note ?? "");
    // payment-specific
    setPaymentDone(!transaction.isPending);
    setAutoPayment(transaction.note?.includes("Pago automático activado") ?? false);
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
    const toDateOnly = (iso: string) => iso.split("T")[0] ?? iso;
    const origPaymentDone = !transaction.isPending;
    return (
      numAmount !== transaction.amount ||
      description !== transaction.description ||
      date !== toDateOnly(transaction.date) ||
      paymentDate !== toDateOnly(transaction.paymentDate) ||
      selectedAccountId !== transaction.accountId ||
      origCategory !== transaction.category ||
      (notes.trim() || undefined) !== (transaction.note ?? undefined) ||
      paymentDone !== origPaymentDone
    );
  }, [transaction, amount, description, date, paymentDate, selectedAccountId, categoryId, notes, categories, paymentDone]);

  const handleDelete = async () => {
    if (!transaction) return;

    if (transaction.kind === "transfer") {
      // Restaurar balance de la cuenta actual
      const isOutgoing = transaction.category.startsWith("→");
      // salió → devolver (+); entró → quitar (-)
      await adjustAccountBalance(transaction.accountId, isOutgoing ? transaction.amount : -transaction.amount);

      // Borrar y restaurar balance de la contraparte si existe
      if (transaction.transferPairId) {
        const pair = (transactions ?? []).find((t) => t.id === transaction.transferPairId);
        if (pair) {
          const pairIsOutgoing = pair.category.startsWith("→");
          await adjustAccountBalance(pair.accountId, pairIsOutgoing ? pair.amount : -pair.amount);
          await remove(pair.id);
        }
      }
    }

    await remove(transaction.id);
    router.push(
      `/cuentas/debito/${accountId}?updated=1&deleted=${encodeURIComponent(transaction.description)}`,
    );
  };

  const handleUndoPayment = async () => {
    if (!transaction) return;
    setActiveDialog(null);
    try {
      await update(transaction.id, {
        isPending: true,
        statusLabel: "Programado",
      });
      await adjustAccountBalance(transaction.accountId, transaction.amount);
      router.back();
    } catch {
      // error silencioso — no hay UI de error aquí
    }
  };

  const handleConfirmPayment = async () => {
    if (!transaction || isPaying) return;
    setIsPaying(true);
    try {
      const today = new Date().toISOString().split("T")[0] ?? "";
      await update(transaction.id, {
        isPending: false,
        statusLabel: "Pagado",
        paymentDate: today,
      });
      await adjustAccountBalance(transaction.accountId, -transaction.amount);
      router.back();
    } finally {
      setIsPaying(false);
    }
  };

  const handleSave = async () => {
    if (!transaction || !isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const wasActuallyPending = transaction.isPending === true;
      const nowPending = !paymentDone;

      await update(transaction.id, {
        amount: parseNumericInput(amount) || transaction.amount,
        description: description.trim() || transaction.description,
        date,
        paymentDate,
        accountId: selectedAccountId || transaction.accountId,
        category: selectedCategoryName || transaction.category,
        note: notes.trim() || undefined,
        isPending: nowPending,
        statusLabel: nowPending ? "Programado" : "Pagado",
      });

      // Ajustar balance si el switch "Pago Realizado" cambió
      const numAmount = parseNumericInput(amount) || transaction.amount;
      if (wasActuallyPending && !nowPending) {
        // pendiente → pagado: descontar
        await adjustAccountBalance(transaction.accountId, -numAmount);
      } else if (!wasActuallyPending && nowPending) {
        // pagado → pendiente: restaurar
        await adjustAccountBalance(transaction.accountId, numAmount);
      }

      // Si sigue siendo pendiente quedarse en pantalla, si ya está pagado volver atrás
      if (nowPending) return;
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  if (accountsLoading || txLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!account || !transaction) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
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
    );
  }

  const displayAmount = formatMoneyInput(amount, DEFAULT_CURRENCY_CODE);

  return (
    <>
    <div className="mx-auto w-full max-w-[36rem] sm:max-w-[40rem] md:max-w-[700px] lg:max-w-[820px]">

        {/* Header */}
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            {transaction.kind === "payment" ? "Editar Pago" : "Editar Gasto"}
          </h1>
          <button
            type="button"
            aria-label={transaction.kind === "payment" ? "Eliminar pago" : "Eliminar gasto"}
            onClick={() => setActiveDialog("delete")}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <Trash2 size={22} strokeWidth={2.2} />
          </button>
        </header>

        {/* Body */}
        <div>

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
              {transaction.isPending
                ? <PendingStatusBadge dueDate={transaction.date} />
                : <StatusBadge label={transaction.statusLabel} />}
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
            {transaction.kind === "payment" ? (
              <>
                <FormPickerField
                  label="Pagar desde"
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

                {/* Pago Realizado */}
                <FormToggleRow
                  icon={<CheckCircle2 size={16} />}
                  label="Pago Realizado"
                  checked={paymentDone}
                  onChange={setPaymentDone}
                />

                {paymentDone ? (
                  <>
                    <FormDateField
                      id="edit-payment-date"
                      label="Fecha del pago"
                      value={paymentDate}
                      onChange={setPaymentDate}
                    />
                    <FormToggleRow
                      icon={<RotateCcw size={16} />}
                      label="Pago Recurrente"
                      checked={isRecurring}
                      onChange={setIsRecurring}
                    />
                    {isRecurring && (
                      <RecurringFields
                        repeatInterval={recurring.repeatInterval}
                        onRepeatInterval={recurring.setRepeatInterval}
                        repeatEvery={recurring.repeatEvery}
                        onOpenEachPicker={() => recurring.setShowEachPicker(true)}
                        stopMode={recurring.stopMode}
                        onStopMode={recurring.handleStopMode}
                        stopDate={recurring.stopDate}
                        onStopDate={recurring.setStopDate}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <FormDateField
                      id="edit-due-date"
                      label="Pagar antes de"
                      value={date}
                      onChange={setDate}
                    />
                    <FormToggleRow
                      icon={<RotateCcw size={16} />}
                      label="Pago Recurrente"
                      checked={isRecurring}
                      onChange={setIsRecurring}
                    />
                    {isRecurring && (
                      <RecurringFields
                        repeatInterval={recurring.repeatInterval}
                        onRepeatInterval={recurring.setRepeatInterval}
                        repeatEvery={recurring.repeatEvery}
                        onOpenEachPicker={() => recurring.setShowEachPicker(true)}
                        stopMode={recurring.stopMode}
                        onStopMode={recurring.handleStopMode}
                        stopDate={recurring.stopDate}
                        onStopDate={recurring.setStopDate}
                      />
                    )}
                    <AutoPaymentRow checked={autoPayment} onChange={setAutoPayment} />
                  </>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
            <FormNotesField value={notes} onChange={setNotes} />
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-[var(--app-bg)] border-t border-white/[0.06] pb-6 pt-4">
          {transaction.isPending && isDirty ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="type-body h-14 w-full rounded-2xl bg-[var(--accent)] font-semibold text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] transition hover:brightness-105 disabled:opacity-60"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
          ) : transaction.isPending ? (
            <SwipeToPayButton onConfirm={handleConfirmPayment} isLoading={isPaying} />
          ) : isDirty ? (
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

      {/* Dialogs — fuera del max-w wrapper */}
      <ConfirmDialog
        isOpen={activeDialog === "delete"}
        title={transaction.kind === "payment" ? "¿Eliminar pago?" : "¿Eliminar gasto?"}
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
        onConfirm={handleUndoPayment}
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

      {recurring.showEachPicker && (
        <NumberPickerSheet
          value={recurring.repeatEvery}
          onClose={() => recurring.setShowEachPicker(false)}
          onSelect={recurring.setRepeatEvery}
        />
      )}
    </>
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

// ─── Badge para pagos pendientes (A TIEMPO / RETRASADO) ───────────────────────

function PendingStatusBadge({ dueDate }: { dueDate: string }) {
  const today = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue = dueDate < today;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.72rem] font-semibold tracking-[0.08em] ${
        isOverdue ? "text-[#f55a3d]" : "text-[#f5a43d]"
      }`}
    >
      {isOverdue
        ? <AlertTriangle size={13} strokeWidth={2.4} />
        : <Clock size={13} strokeWidth={2.4} />}
      <span>{isOverdue ? "RETRASADO" : "A TIEMPO"}</span>
    </span>
  );
}

// ─── Slider "Desliza para pagar" ─────────────────────────────────────────────

function SwipeToPayButton({
  onConfirm,
  isLoading,
}: {
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const maxXRef = useRef(260);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [labelOpacity, setLabelOpacity] = useState(1);

  const THUMB_SIZE = 52;
  const THRESHOLD = 0.82;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLoading || confirmed) return;
    // Leer el ancho aquí (evento, no render)
    if (trackRef.current) {
      maxXRef.current = trackRef.current.offsetWidth - THUMB_SIZE - 8;
    }
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const rawX = e.clientX - rect.left - THUMB_SIZE / 2;
    const clamped = clamp(rawX, 0, maxXRef.current);
    setDragX(clamped);
    setLabelOpacity(Math.max(0, 1 - (clamped / maxXRef.current) * 2.5));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX / maxXRef.current >= THRESHOLD) {
      setConfirmed(true);
      setDragX(maxXRef.current);
      setLabelOpacity(0);
      onConfirm();
    } else {
      setDragX(0);
      setLabelOpacity(1);
    }
  };

  return (
    <div
      ref={trackRef}
      className="relative flex h-14 w-full select-none items-center overflow-hidden rounded-2xl bg-[var(--accent)] px-1"
      style={{ touchAction: "none" }}
    >
      {/* Track fill */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-2xl bg-white/10"
        style={{ width: dragX + THUMB_SIZE + 4, transition: isDragging ? "none" : "width 0.25s ease" }}
      />

      {/* Label */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.92rem] font-semibold text-white"
        style={{ opacity: labelOpacity, transition: "opacity 0.1s" }}
      >
        {isLoading || confirmed ? "Procesando…" : "Desliza para pagar"}
      </span>

      {/* Thumb */}
      <div
        className="relative z-10 grid h-[52px] w-[52px] cursor-grab shrink-0 place-items-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ArrowRight size={22} strokeWidth={2.5} className="text-[var(--accent)]" />
      </div>
    </div>
  );
}
