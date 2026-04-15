"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
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
import { AccountPickerSheet } from "@/components/screens/picker-sheets";

type TransferDraft = {
  amount: string;
  description: string;
  fromAccountId: string;
  toAccountId: string;
  date: string;
  isRecurring: boolean;
  autoPayment: boolean;
  notes: string;
};

export function AddTransferScreen() {
  const router = useRouter();
  const { accounts, adjustBalance: adjustAccountBalance } = useDebitAccounts();
  const { create: createTransaction, update: updateTransaction } = useTransactions();
  const { readDraft, saveDraft, clearDraft } = useFormDraft<TransferDraft>("add-transfer");

  const draft = readDraft();
  const [amount, setAmount] = useState(draft?.amount ?? "0");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [fromAccountId, setFromAccountId] = useState(draft?.fromAccountId ?? "");
  const [toAccountId, setToAccountId] = useState(draft?.toAccountId ?? "");
  const [date, setDate] = useState(draft?.date ?? todayISO);
  const [isRecurring, setIsRecurring] = useState(draft?.isRecurring ?? false);
  const [autoPayment, setAutoPayment] = useState(draft?.autoPayment ?? false);
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showFromAccountPicker, setShowFromAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);

  const recurring = useRecurringSection();

  // Persist draft on every relevant change
  useEffect(() => {
    saveDraft({ amount, description, fromAccountId, toAccountId, date, isRecurring, autoPayment, notes });
  }, [amount, description, fromAccountId, toAccountId, date, isRecurring, autoPayment, notes, saveDraft]);

  // Reopen the correct picker when returning from the add-account flow
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "from-account") setShowFromAccountPicker(true);
    if (pending === "to-account") setShowToAccountPicker(true);
  }, []);

  const fromAccountName =
    (accounts ?? []).find((a) => a.id === fromAccountId)?.name ?? "";
  const toAccountName =
    (accounts ?? []).find((a) => a.id === toAccountId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!fromAccountId) { setError("Selecciona la cuenta origen."); return; }
    if (!toAccountId) { setError("Selecciona la cuenta destino."); return; }
    if (fromAccountId === toAccountId) { setError("Origen y destino no pueden ser la misma cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const fromAccount = (accounts ?? []).find((a) => a.id === fromAccountId);
      const toAccount = (accounts ?? []).find((a) => a.id === toAccountId);
      const meta = KIND_META.transfer;
      const desc = description.trim() || "Transferencia";

      const recurringNote = isRecurring
        ? [
            recurring.buildNoteFragment(),
            autoPayment ? "Pago automático" : "",
          ].filter(Boolean).join(" · ")
        : "";
      const noteStr = [notes.trim(), recurringNote].filter(Boolean).join(" · ") || undefined;

      const txFrom = await createTransaction({
        accountId: fromAccountId,
        amount: numAmount,
        description: desc,
        category: `→ ${toAccount?.name ?? "otra cuenta"}`,
        date,
        paymentDate: date,
        kind: "transfer",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: noteStr,
        statusLabel: meta.statusLabel,
      });

      const txTo = await createTransaction({
        accountId: toAccountId,
        amount: numAmount,
        description: desc,
        category: `← ${fromAccount?.name ?? "otra cuenta"}`,
        date,
        paymentDate: date,
        kind: "transfer",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: noteStr,
        statusLabel: meta.statusLabel,
      });

      // Vincular las dos transacciones entre sí
      await Promise.all([
        updateTransaction(txFrom.id, { transferPairId: txTo.id }),
        updateTransaction(txTo.id, { transferPairId: txFrom.id }),
      ]);

      await adjustAccountBalance(fromAccountId, -numAmount);
      await adjustAccountBalance(toAccountId, numAmount);

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
      <TransactionFormHeader title="Agregar Transferencia" />

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
              label="Cuenta origen"
              icon={<Wallet size={16} />}
              value={fromAccountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowFromAccountPicker(true)}
            />
            <FormPickerField
              label="Cuenta destino"
              icon={<Wallet size={16} />}
              value={toAccountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowToAccountPicker(true)}
            />
            <FormDateField
              id="date"
              label="Fecha de Transaccion"
              value={date}
              onChange={setDate}
            />
            <FormToggleRow
              icon={<RotateCcw size={16} />}
              label="Recurrente"
              checked={isRecurring}
              onChange={setIsRecurring}
            />

            {isRecurring && (
              <>
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
                <AutoPaymentRow checked={autoPayment} onChange={setAutoPayment} />
              </>
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

      {showFromAccountPicker && (
        <AccountPickerSheet
          selected={fromAccountId}
          onSelect={(id) => { setFromAccountId(id); setError(""); }}
          onClose={() => setShowFromAccountPicker(false)}
          pickerKey="from-account"
        />
      )}

      {showToAccountPicker && (
        <AccountPickerSheet
          selected={toAccountId}
          onSelect={(id) => { setToAccountId(id); setError(""); }}
          onClose={() => setShowToAccountPicker(false)}
          pickerKey="to-account"
        />
      )}
    </TransactionFormLayout>
  );
}
