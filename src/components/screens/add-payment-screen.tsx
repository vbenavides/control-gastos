"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, RotateCcw, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { parseNumericInput } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  AutoPaymentRow,
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormScrollBody,
  FormTextField,
  FormToggleRow,
  NumberPickerSheet,
  RecurringFields,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
  useRecurringSection,
} from "@/components/screens/transaction-form-base";
import {
  AccountPickerSheet,
  CategoryPickerSheet,
} from "@/components/screens/picker-sheets";

type PaymentDraft = {
  amount: string;
  description: string;
  payFromAccountId: string;
  categoryId: string;
  dueDate: string;
  isRecurring: boolean;
  autoPayment: boolean;
  notes: string;
};

export function AddPaymentScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts } = useDebitAccounts();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();
  const { readDraft, saveDraft, clearDraft } = useFormDraft<PaymentDraft>("add-payment");

  const draft = readDraft();
  const prefilledAccountId = searchParams.get("account") ?? "";
  const [amount, setAmount] = useState(draft?.amount ?? "0");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [payFromAccountId, setPayFromAccountId] = useState(draft?.payFromAccountId || prefilledAccountId);
  const [categoryId, setCategoryId] = useState(draft?.categoryId ?? "");
  const [dueDate, setDueDate] = useState(draft?.dueDate ?? todayISO);
  const [isRecurring, setIsRecurring] = useState(draft?.isRecurring ?? false);
  const [autoPayment, setAutoPayment] = useState(draft?.autoPayment ?? false);
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const recurring = useRecurringSection();

  // Persist draft on every relevant change
  useEffect(() => {
    saveDraft({ amount, description, payFromAccountId, categoryId, dueDate, isRecurring, autoPayment, notes });
  }, [amount, description, payFromAccountId, categoryId, dueDate, isRecurring, autoPayment, notes, saveDraft]);

  // Reopen the correct picker when returning from the add-account/add-category flow
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "account") setShowAccountPicker(true);
    if (pending === "category") setShowCategoryPicker(true);
  }, []);

  const accountName =
    (accounts ?? []).find((a) => a.id === payFromAccountId)?.name ?? "";
  const categoryName =
    (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!payFromAccountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const meta = KIND_META.payment;

      const noteFragments = [
        notes.trim(),
        isRecurring ? recurring.buildNoteFragment() : "",
        autoPayment ? "Pago automático activado" : "",
      ].filter(Boolean);

      await createTransaction({
        accountId: payFromAccountId,
        amount: numAmount,
        description: description.trim() || "Pago",
        category: categoryName,
        date: dueDate,
        paymentDate: dueDate,
        kind: "payment",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: noteFragments.join(" · ") || undefined,
        statusLabel: meta.statusLabel,
        isPending: true,
      });

      clearDraft();
      router.back();
    } catch {
      setError("Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TransactionFormLayout>
      <TransactionFormHeader title="Agregar Pago" />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <FormScrollBody>
          <AmountSection value={amount} onChange={(v) => { setAmount(v); setError(""); }} />

          <section className="mt-8">
            <FormTextField
              id="description"
              label="Descripción"
              icon={<SquarePen size={16} />}
              value={description}
              onChange={setDescription}
            />
            <FormPickerField
              label="Pagar desde"
              icon={<Wallet size={16} />}
              value={accountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowAccountPicker(true)}
            />
            <FormPickerField
              label="Categoría"
              icon={<Layers size={16} />}
              value={categoryName}
              placeholder="Selecciona categoría"
              onClick={() => setShowCategoryPicker(true)}
            />

            {/* Fecha límite del pago futuro */}
            <FormDateField
              id="due-date"
              label="Pagar antes de"
              value={dueDate}
              onChange={setDueDate}
            />

            {/* Pago Recurrente */}
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

            {/* Pago Automático */}
            <AutoPaymentRow checked={autoPayment} onChange={setAutoPayment} />

            <FormNotesField value={notes} onChange={setNotes} />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>

      {recurring.showEachPicker && (
        <NumberPickerSheet
          value={recurring.repeatEvery}
          onClose={() => recurring.setShowEachPicker(false)}
          onSelect={recurring.setRepeatEvery}
        />
      )}

      {showAccountPicker && (
        <AccountPickerSheet
          selected={payFromAccountId}
          onSelect={(id) => { setPayFromAccountId(id); setError(""); }}
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

    </TransactionFormLayout>
  );
}
