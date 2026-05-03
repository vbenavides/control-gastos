"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
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
import { AccountPickerSheet } from "@/components/screens/picker-sheets";

type RefundDraft = {
  amount: string;
  description: string;
  depositAccountId: string;
  date: string;
  notes: string;
};

export function AddRefundScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, adjustBalance: adjustAccountBalance } = useDebitAccounts();
  const { create: createTransaction } = useTransactions();
  const { readDraft, saveDraft, clearDraft } = useFormDraft<RefundDraft>("add-refund");

  const draft = readDraft();
  const prefilledAccountId = searchParams.get("account") ?? "";
  const [amount, setAmount] = useState(draft?.amount ?? "0");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [depositAccountId, setDepositAccountId] = useState(draft?.depositAccountId || prefilledAccountId);
  const [date, setDate] = useState(draft?.date ?? todayISO);
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Persist draft on every relevant change
  useEffect(() => {
    saveDraft({ amount, description, depositAccountId, date, notes });
  }, [amount, description, depositAccountId, date, notes, saveDraft]);

  // Reopen picker when returning from the add-account flow
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "account") setShowAccountPicker(true);
  }, []);

  const accountName =
    (accounts ?? []).find((a) => a.id === depositAccountId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!depositAccountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const meta = KIND_META.refund;

      await createTransaction({
        accountId: depositAccountId,
        amount: numAmount,
        description: description.trim() || "Reembolso",
        category: "Reembolso",
        date,
        paymentDate: date,
        kind: "refund",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: notes.trim() || undefined,
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
      <TransactionFormHeader title="Agregar Reembolso" />

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
            <FormDateField id="date" label="Fecha de Transaccion" value={date} onChange={setDate} />
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
          selected={depositAccountId}
          onSelect={(id) => { setDepositAccountId(id); setError(""); }}
          onClose={() => setShowAccountPicker(false)}
          pickerKey="account"
        />
      )}
    </TransactionFormLayout>
  );
}
