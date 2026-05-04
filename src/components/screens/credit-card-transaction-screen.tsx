"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Info,
  Layers,
  Navigation,
  ReceiptText,
  SquarePen,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { resolveIcon } from "@/lib/category-icons";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import {
  FieldLabel,
  FieldRow,
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormTextField,
  FormToggleRow,
} from "@/components/screens/transaction-form-base";
import { CategoryPickerSheet } from "@/components/screens/picker-sheets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function calcBillingInfo(
  refDateISO: string,
  statementDay: number,
  paymentDay: number,
): { statementDate: string; firstPaymentDate: string } {
  const ref = new Date(refDateISO + "T12:00:00");
  const refDay = ref.getDate();
  const refMonth = ref.getMonth();
  const refYear = ref.getFullYear();

  let stMonth = refMonth;
  let stYear = refYear;
  if (statementDay < refDay) {
    stMonth += 1;
    if (stMonth > 11) {
      stMonth = 0;
      stYear += 1;
    }
  }
  const statementDate = new Date(stYear, stMonth, statementDay);

  let pmMonth = stMonth + 1;
  let pmYear = stYear;
  if (pmMonth > 11) {
    pmMonth = 0;
    pmYear += 1;
  }
  const firstPaymentDate = new Date(pmYear, pmMonth, paymentDay);

  return {
    statementDate: fmtDate(statementDate),
    firstPaymentDate: fmtDate(firstPaymentDate),
  };
}

function kindTitle(kind: string): string {
  switch (kind) {
    case "installments": return "Compra a Meses";
    case "cardPayment":  return "Editar Pago de Tarjeta";
    case "expense":      return "Editar Gasto";
    case "cashback":     return "Editar Cashback";
    default:             return "Editar Transacción";
  }
}

function parseInstallmentTotal(note?: string): number {
  if (!note) return 1;
  const match = /^(\d+) pagos/.exec(note);
  return match ? Math.max(1, parseInt(match[1]!, 10)) : 1;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CreditCardTransactionScreen() {
  const params = useParams<{ cardId: string; transactionId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";
  const transactionId = typeof params.transactionId === "string" ? params.transactionId : "";

  const router = useRouter();

  const { cards, isLoading: cardsLoading, update: updateCard } = useCreditCards();
  const { categories } = useCategories();
  const { transactions, isLoading: txLoading, update: updateTx, remove: removeTx } = useTransactions();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const transaction = useMemo(
    () => (transactions ?? []).find((t) => t.id === transactionId) ?? null,
    [transactions, transactionId],
  );

  // ── Editable state ──
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [payments, setPayments] = useState("1");
  const [monthlyStr, setMonthlyStr] = useState("0");
  const [notes, setNotes] = useState("");
  const [buyNowPayLater, setBuyNowPayLater] = useState(false);
  const [payLaterDate, setPayLaterDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const initialized = useRef(false);
  useEffect(() => {
    if (!transaction || initialized.current) return;
    initialized.current = true;
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setDate(transaction.date.split("T")[0] ?? transaction.date);
    setNotes(transaction.note ?? "");
    setPayLaterDate(transaction.paymentDate.split("T")[0] ?? transaction.paymentDate);
    setBuyNowPayLater(transaction.note?.includes("Compra ahora, paga después") ?? false);
    if (transaction.kind === "installments") {
      const totalPayments = parseInstallmentTotal(transaction.note);
      setPayments(String(totalPayments));
      setMonthlyStr(totalPayments > 0 ? (transaction.amount / totalPayments).toFixed(2) : "0");
    }
  }, [transaction]);

  const categoryResolved = useRef(false);
  useEffect(() => {
    if (!transaction || !categories || categoryResolved.current) return;
    const match = categories.find((c) => c.name === transaction.category);
    if (match) {
      setCategoryId(match.id);
      categoryResolved.current = true;
    }
  }, [transaction, categories]);

  const categoryName = (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";
  const selectedCategory = (categories ?? []).find((c) => c.id === categoryId) ?? null;
  const CategoryIcon = resolveIcon(selectedCategory?.iconKey, 12);
  const numericAmount = parseNumericInput(amount);
  const paymentCount = Math.max(1, parseInt(payments || "1", 10));
  const isInstallment = transaction?.kind === "installments";
  const numericMonthly = parseFloat(monthlyStr) || 0;

  const monthlyDisplayValue = numericMonthly
    ? numericMonthly.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

  const isDirty = useMemo(() => {
    if (!transaction) return false;
    const toDate = (iso: string) => iso.split("T")[0] ?? iso;
    return (
      numericAmount !== transaction.amount ||
      description.trim() !== transaction.description ||
      date !== toDate(transaction.date) ||
      categoryName !== transaction.category ||
      (isInstallment && paymentCount !== parseInstallmentTotal(transaction.note)) ||
      (isInstallment && buyNowPayLater !== (transaction.note?.includes("Compra ahora, paga después") ?? false)) ||
      (isInstallment && buyNowPayLater && payLaterDate !== toDate(transaction.paymentDate)) ||
      (notes.trim() || undefined) !== (transaction.note ?? undefined)
    );
  }, [transaction, numericAmount, description, date, categoryName, paymentCount, isInstallment, buyNowPayLater, payLaterDate, notes]);

  const handleSave = useCallback(async () => {
    if (!transaction || !isDirty || isSaving) return;
    setIsSaving(true);
    try {
      let newNote = transaction.note;
      if (isInstallment) {
        const monthly = paymentCount > 0 ? numericAmount / paymentCount : 0;
        newNote = [
          `${paymentCount} pagos de $${monthly.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          buyNowPayLater ? "Compra ahora, paga después" : "",
        ].filter(Boolean).join(" · ");
      }

      await updateTx(transaction.id, {
        amount: numericAmount || transaction.amount,
        description: description.trim() || transaction.description,
        date,
        paymentDate: isInstallment ? (buyNowPayLater ? payLaterDate : date) : transaction.paymentDate,
        category: categoryName || transaction.category,
        note: newNote,
      });

      if (card && numericAmount !== transaction.amount) {
        const delta = numericAmount - transaction.amount;
        await updateCard(cardId, { balance: card.balance + delta });
      }

      router.back();
    } finally {
      setIsSaving(false);
    }
  }, [transaction, isDirty, isSaving, isInstallment, numericAmount, description, date, categoryName, paymentCount, buyNowPayLater, payLaterDate, card, cardId, updateTx, updateCard, router]);

  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    if (card) {
      await updateCard(cardId, { balance: Math.max(0, card.balance - transaction.amount) });
    }
    await removeTx(transaction.id);
    router.push(`/cuentas/tarjeta/${cardId}`);
  }, [transaction, card, cardId, updateCard, removeTx, router]);

  const handlePaymentsChange = (v: string) => setPayments(sanitizeNumericInput(v, "integer"));
  const handlePaymentsBlur = () => setPayments(normalizeNumericBlurValue(payments, "integer") || "1");

  useEffect(() => {
    if (!isInstallment) return;
    const p = Math.max(1, parseInt(payments || "1", 10));
    setMonthlyStr(numericAmount ? (numericAmount / p).toFixed(2) : "0");
  }, [isInstallment, payments, numericAmount]);

  const handleMonthlyChange = (v: string) => {
    const stripped = v.replace(/\./g, "").replace(",", ".");
    const sanitized = stripped.replace(/[^0-9.]/g, "");
    setMonthlyStr(sanitized);
    const m = parseFloat(sanitized) || 0;
    setAmount(m ? String(Math.round(m * paymentCount)) : "0");
  };

  const handleMonthlyBlur = () => {
    const n = parseFloat(monthlyStr) || 0;
    setMonthlyStr(n ? n.toFixed(2) : "0");
    setAmount(n ? String(Math.round(n * paymentCount)) : "0");
  };

  // ── Loading ──
  if (cardsLoading || txLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  // ── Not found ──
  if (!transaction || !card) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => router.back()}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </button>
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
  const billingInfo = isInstallment
    ? calcBillingInfo(buyNowPayLater ? payLaterDate : date, card.statementDay, card.paymentDay)
    : null;

  return (
    <>
      <div className="mx-auto w-full max-w-[36rem] sm:max-w-[40rem] md:max-w-[700px] lg:max-w-[820px]">

        {/* ── Header ── */}
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
            {kindTitle(transaction.kind)}
          </h1>
          <button
            type="button"
            aria-label="Eliminar transacción"
            onClick={() => setShowDeleteDialog(true)}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <Trash2 size={22} strokeWidth={2.2} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="pb-32">

          {/* Monto */}
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
                  setAmount(
                    sanitizeNumericInput(
                      stripMoneyFormat(e.target.value, DEFAULT_CURRENCY_CODE),
                      "integer",
                    ),
                  )
                }
                onBlur={() => setAmount(normalizeNumericBlurValue(amount, "integer"))}
                style={{ width: getNumericInputWidth(displayAmount) }}
                className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
              />
            </div>
          </section>

          {/* Campos */}
          <section className="mt-8">
            {isInstallment ? (
              <>
                <FormTextField
                  id="edit-description"
                  label="Descripción"
                  icon={<SquarePen size={16} />}
                  value={description}
                  onChange={setDescription}
                />

                <FormPickerField
                  label="Categoria"
                  icon={<CategoryIcon size={16} />}
                  value={categoryName}
                  placeholder="Sin categoría"
                  onClick={() => setShowCategoryPicker(true)}
                />

                <FieldRow>
                  <FieldLabel>Tarjeta de crédito</FieldLabel>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-white/55"><CreditCard size={16} /></span>
                    <span className="type-body text-[var(--text-primary)]">{card.name}</span>
                  </div>
                </FieldRow>

                <FieldRow>
                  <div className="grid grid-cols-2 gap-x-6">
                    <div>
                      <FieldLabel htmlFor="edit-payments">Número de Pagos</FieldLabel>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-white/55"><Navigation size={16} /></span>
                        <input
                          id="edit-payments"
                          name="payments"
                          type="text"
                          inputMode="numeric"
                          value={payments}
                          onChange={(e) => handlePaymentsChange(e.target.value)}
                          onBlur={handlePaymentsBlur}
                          style={{ width: getNumericInputWidth(payments, 2) }}
                          className="type-body min-w-[2ch] border-0 bg-transparent p-0 font-medium text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Mensualidad</FieldLabel>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-white/55"><ReceiptText size={16} /></span>
                        <span className="type-body font-medium text-[var(--text-primary)]">$</span>
                        <input
                          id="edit-monthly"
                          name="monthly"
                          type="text"
                          inputMode="decimal"
                          value={monthlyDisplayValue}
                          placeholder="0"
                          onChange={(e) => handleMonthlyChange(e.target.value)}
                          onBlur={handleMonthlyBlur}
                          style={{ width: getNumericInputWidth(monthlyDisplayValue || "0", 2) }}
                          className="type-body min-w-[2ch] border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                        />
                      </div>
                    </div>
                  </div>
                </FieldRow>

                <FormDateField
                  id="edit-date"
                  label="Fecha de compra"
                  value={date}
                  onChange={setDate}
                />

                <FormToggleRow
                  label="Compra ahora y paga después"
                  description="Asigna una fecha para comenzar a pagar"
                  checked={buyNowPayLater}
                  onChange={setBuyNowPayLater}
                />

                {buyNowPayLater && (
                  <FormDateField
                    id="edit-pay-later-date"
                    label="Fecha de inicio de pago"
                    value={payLaterDate}
                    onChange={setPayLaterDate}
                  />
                )}

                {billingInfo && (
                  <div className="mt-3 flex items-start gap-3 py-3 text-[var(--text-secondary)]">
                    <span className="mt-[1px] shrink-0 text-[var(--text-tertiary)]">
                      <Info size={16} />
                    </span>
                    <p className="type-label leading-snug italic text-[var(--text-secondary)]">
                      Tu compra será incluida en el estado de cuenta del {billingInfo.statementDate}, y tu primer pago vence en {billingInfo.firstPaymentDate}.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <FormTextField
                  id="edit-description"
                  label="Descripción"
                  icon={<SquarePen size={16} />}
                  value={description}
                  onChange={setDescription}
                />
                <FieldRow>
                  <FieldLabel>Tarjeta</FieldLabel>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-white/55"><CreditCard size={16} /></span>
                    <span className="type-body text-[var(--text-primary)]">{card.name}</span>
                  </div>
                </FieldRow>
                <FormPickerField
                  label="Categoría"
                  icon={<Layers size={16} />}
                  value={categoryName}
                  placeholder="Sin categoría"
                  onClick={() => setShowCategoryPicker(true)}
                />
                <FormDateField
                  id="edit-date"
                  label="Fecha"
                  value={date}
                  onChange={setDate}
                />
                <FormNotesField value={notes} onChange={setNotes} />
              </>
            )}
          </section>
        </div>
      </div>

      {/* ── Footer fijo ── */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-[var(--app-bg)] px-4 pb-8 pt-4">
          <div className="mx-auto w-full max-w-[36rem] sm:max-w-[40rem] md:max-w-[700px] lg:max-w-[820px]">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="type-body h-14 w-full rounded-2xl bg-[var(--accent)] font-semibold text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] transition hover:brightness-105 disabled:opacity-60"
            >
              {isSaving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete dialog ── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="¿Eliminar transacción?"
        description="El registro se eliminará permanentemente y el balance de la tarjeta se ajustará."
        confirmLabel="Eliminar"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />

      {/* ── Category picker ── */}
      {showCategoryPicker && (
        <CategoryPickerSheet
          type="expense"
          selected={categoryId}
          onSelect={setCategoryId}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </>
  );
}
