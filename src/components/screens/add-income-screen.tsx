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

type IncomeDraft = {
  amount: string;
  description: string;
  depositAccountId: string;
  paymentDate: string;
  isRecurring: boolean;
  autoPayment: boolean;
  categoryId: string;
  notes: string;
};

export function AddIncomeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, adjustBalance: adjustAccountBalance } = useDebitAccounts();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();
  const { readDraft, saveDraft, clearDraft } = useFormDraft<IncomeDraft>("add-income");

  const draft = readDraft();
  const prefilledAccountId = searchParams.get("account") ?? "";
  const [amount, setAmount] = useState(draft?.amount ?? "0");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [depositAccountId, setDepositAccountId] = useState(draft?.depositAccountId || prefilledAccountId);
  const [paymentDate, setPaymentDate] = useState(draft?.paymentDate ?? todayISO);
  const [isRecurring, setIsRecurring] = useState(draft?.isRecurring ?? false);
  const [autoPayment, setAutoPayment] = useState(draft?.autoPayment ?? false);
  const [categoryId, setCategoryId] = useState(draft?.categoryId ?? "");
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const recurring = useRecurringSection();

  // Persist draft on every relevant change
  useEffect(() => {
    saveDraft({ amount, description, depositAccountId, paymentDate, isRecurring, autoPayment, categoryId, notes });
  }, [amount, description, depositAccountId, paymentDate, isRecurring, autoPayment, categoryId, notes, saveDraft]);

  // Reopen the correct picker when returning from the add-account/add-category flow
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "account") setShowAccountPicker(true);
    if (pending === "category") setShowCategoryPicker(true);
  }, []);

  const accountName =
    (accounts ?? []).find((a) => a.id === depositAccountId)?.name ?? "";
  const categoryName =
    (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!depositAccountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const meta = KIND_META.income;

      const recurringNote = isRecurring
        ? [
            recurring.buildNoteFragment(),
            autoPayment ? "Pago automático" : "",
          ].filter(Boolean).join(" · ")
        : "";

      await createTransaction({
        accountId: depositAccountId,
        amount: numAmount,
        description: description.trim() || "Ingreso",
        category: categoryName,
        date: paymentDate,
        paymentDate,
        kind: "income",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: [notes.trim(), recurringNote].filter(Boolean).join(" · ") || undefined,
        statusLabel: meta.statusLabel,
      });

      await adjustAccountBalance(depositAccountId, numAmount);
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
      <TransactionFormHeader title="Agregar Ingreso" />

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
              label="Depositar en"
              icon={<Wallet size={16} />}
              value={accountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowAccountPicker(true)}
            />
            <FormDateField
              id="payment-date"
              label="Día de pago"
              value={paymentDate}
              onChange={setPaymentDate}
            />
            <FormToggleRow
              icon={<RotateCcw size={16} />}
              label="Recurrente"
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

            <FormPickerField
              label="Categoría"
              icon={<Layers size={16} />}
              value={categoryName}
              placeholder="Selecciona categoría"
              onClick={() => setShowCategoryPicker(true)}
            />

            {isRecurring && (
              <AutoPaymentRow checked={autoPayment} onChange={setAutoPayment} />
            )}

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
          selected={depositAccountId}
          onSelect={(id) => { setDepositAccountId(id); setError(""); }}
          onClose={() => setShowAccountPicker(false)}
          pickerKey="account"
        />
      )}

      {showCategoryPicker && (
        <CategoryPickerSheet
          type="income"
          selected={categoryId}
          onSelect={setCategoryId}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </TransactionFormLayout>
  );
}
