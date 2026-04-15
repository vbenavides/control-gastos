"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { parseNumericInput } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormScrollBody,
  FormTextField,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";
import {
  AccountPickerSheet,
  CategoryPickerSheet,
} from "@/components/screens/picker-sheets";

type ExpenseDraft = {
  amount: string;
  description: string;
  date: string;
  accountId: string;
  categoryId: string;
  notes: string;
};

export function AddExpenseScreen() {
  const router = useRouter();
  const { accounts, adjustBalance: adjustAccountBalance } = useDebitAccounts();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();
  const { readDraft, saveDraft, clearDraft } = useFormDraft<ExpenseDraft>("add-expense");

  const draft = readDraft();
  const [amount, setAmount] = useState(draft?.amount ?? "0");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [date, setDate] = useState(draft?.date ?? todayISO);
  const [accountId, setAccountId] = useState(draft?.accountId ?? "");
  const [categoryId, setCategoryId] = useState(draft?.categoryId ?? "");
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Persist draft on every relevant change
  useEffect(() => {
    saveDraft({ amount, description, date, accountId, categoryId, notes });
  }, [amount, description, date, accountId, categoryId, notes, saveDraft]);

  // Reopen the correct picker when returning from the add-account/add-category flow
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "account") setShowAccountPicker(true);
    if (pending === "category") setShowCategoryPicker(true);
  }, []);

  const accountName =
    (accounts ?? []).find((a) => a.id === accountId)?.name ?? "";
  const categoryName =
    (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!accountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const meta = KIND_META.expense;

      await createTransaction({
        accountId,
        amount: numAmount,
        description: description.trim() || "Gasto",
        category: categoryName,
        date,
        paymentDate: date,
        kind: "expense",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: notes.trim() || undefined,
        statusLabel: meta.statusLabel,
      });

      await adjustAccountBalance(accountId, -numAmount);

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
      <TransactionFormHeader title="Agregar Gasto" />

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
            <FormDateField id="date" label="Fecha de Transaccion" value={date} onChange={setDate} />
            <FormPickerField
              label="Cuenta"
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
            <FormNotesField value={notes} onChange={setNotes} />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>

      {showAccountPicker && (
        <AccountPickerSheet
          selected={accountId}
          onSelect={(id) => { setAccountId(id); setError(""); }}
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
