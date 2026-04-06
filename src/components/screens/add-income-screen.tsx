"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, RotateCcw, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  FormDateField,
  FormNotesField,
  FormScrollBody,
  FormSelectField,
  FormTextField,
  FormToggleRow,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";

export function AddIncomeScreen() {
  const router = useRouter();
  const { accounts, update: updateAccount } = useDebitAccounts();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO);
  const [isRecurring, setIsRecurring] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!depositAccountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const account = (accounts ?? []).find((a) => a.id === depositAccountId);
      const categoryName = (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";
      const meta = KIND_META.income;

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
        note: [
          notes.trim(),
          isRecurring ? "Recurrente" : "",
        ].filter(Boolean).join(" · ") || undefined,
        statusLabel: meta.statusLabel,
      });

      // Sumar al balance de la cuenta
      if (account) {
        await updateAccount(depositAccountId, { balance: account.balance + numAmount });
      }

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
            <FormSelectField
              id="deposit-account"
              label="Depositar en"
              icon={<Wallet size={16} />}
              value={depositAccountId}
              onChange={(v) => { setDepositAccountId(v); setError(""); }}
              placeholder="Selecciona cuenta"
              options={accountOptions}
            />
            <FormDateField id="payment-date" label="Día de pago" value={paymentDate} onChange={setPaymentDate} />
            <FormToggleRow
              icon={<RotateCcw size={16} />}
              label="Recurrente"
              checked={isRecurring}
              onChange={setIsRecurring}
            />
            <FormSelectField
              id="category"
              label="Categoría"
              icon={<Layers size={16} />}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Selecciona categoría"
              options={categoryOptions}
            />
            <FormNotesField value={notes} onChange={setNotes} />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>
    </TransactionFormLayout>
  );
}
