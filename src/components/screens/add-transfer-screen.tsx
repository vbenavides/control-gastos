"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
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

export function AddTransferScreen() {
  const router = useRouter();
  const { accounts, update: updateAccount } = useDebitAccounts();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(todayISO);
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: a.name }));

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
      const noteStr = [
        notes.trim(),
        isRecurring ? "Recurrente" : "",
      ].filter(Boolean).join(" · ") || undefined;

      // Transacción de salida (cuenta origen)
      await createTransaction({
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

      // Transacción de entrada (cuenta destino)
      await createTransaction({
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

      // Actualizar balances
      if (fromAccount) {
        await updateAccount(fromAccountId, { balance: fromAccount.balance - numAmount });
      }
      if (toAccount) {
        await updateAccount(toAccountId, { balance: toAccount.balance + numAmount });
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
            <FormSelectField
              id="from-account"
              label="Cuenta origen"
              icon={<Wallet size={16} />}
              value={fromAccountId}
              onChange={(v) => { setFromAccountId(v); setError(""); }}
              placeholder="Selecciona cuenta"
              options={accountOptions}
            />
            <FormSelectField
              id="to-account"
              label="Cuenta destino"
              icon={<Wallet size={16} />}
              value={toAccountId}
              onChange={(v) => { setToAccountId(v); setError(""); }}
              placeholder="Selecciona cuenta"
              options={accountOptions}
            />
            <FormDateField id="date" label="Fecha de Transaccion" value={date} onChange={setDate} />
            <FormToggleRow
              icon={<RotateCcw size={16} />}
              label="Recurrente"
              checked={isRecurring}
              onChange={setIsRecurring}
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
