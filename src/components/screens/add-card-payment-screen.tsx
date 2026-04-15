"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormScrollBody,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";
import {
  AccountPickerSheet,
  CreditCardPickerSheet,
} from "@/components/screens/picker-sheets";

export function AddCardPaymentScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, update: updateAccount } = useDebitAccounts();
  const { cards, update: updateCard } = useCreditCards();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [cardId, setCardId] = useState(() => searchParams.get("cardId") ?? "");
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Reopen the correct picker when returning from create flows
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "credit-card") setShowCardPicker(true);
    if (pending === "account") setShowAccountPicker(true);
  }, []);

  const cardName = (cards ?? []).find((c) => c.id === cardId)?.name ?? "";
  const accountName =
    (accounts ?? []).find((a) => a.id === payFromAccountId)?.name ?? "";

  const numericAmount = parseNumericInput(amount);
  const formatMoney = (n: number) => `$${n.toLocaleString("es-CL")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!cardId) { setError("Selecciona una tarjeta de crédito."); return; }
    if (!payFromAccountId) { setError("Selecciona la cuenta desde la que pagas."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const account = (accounts ?? []).find((a) => a.id === payFromAccountId);
      const card = (cards ?? []).find((c) => c.id === cardId);
      const meta = KIND_META.cardPayment;

      await createTransaction({
        accountId: payFromAccountId,
        amount: numericAmount,
        description: `Pago tarjeta ${card?.name ?? ""}`.trim(),
        category: "Pago de Tarjeta",
        date: paymentDate,
        paymentDate,
        kind: "cardPayment",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: notes.trim() || undefined,
        statusLabel: meta.statusLabel,
      });

      if (account) {
        await updateAccount(payFromAccountId, { balance: account.balance - numericAmount });
      }

      if (card) {
        const newBalance = Math.max(0, card.balance - numericAmount);
        await updateCard(cardId, { balance: newBalance });
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
      <TransactionFormHeader title="Agregar Pago de Tarjeta" />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <FormScrollBody>
          <AmountSection value={amount} onChange={(v) => { setAmount(v); setError(""); }} />

          {/* Distribución de Pago */}
          <section className="mx-0 mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="mb-3 text-center text-[0.74rem] font-medium tracking-[0.02em] text-[var(--text-secondary)]">
              Distribución de Pago
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[1rem] text-[var(--text-primary)]">Saldo Revolvente</span>
                <span className="text-[1rem] font-medium text-[var(--text-primary)]">
                  {formatMoney(numericAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                <span className="text-[1rem] font-semibold text-[var(--text-primary)]">Total</span>
                <span className="text-[1rem] font-semibold text-[var(--text-primary)]">
                  {formatMoney(numericAmount)}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <FormPickerField
              label="Tarjeta de crédito"
              icon={<CreditCard size={16} />}
              value={cardName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowCardPicker(true)}
            />
            <FormPickerField
              label="Pagar desde"
              icon={<Wallet size={16} />}
              value={accountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowAccountPicker(true)}
            />
            <FormDateField id="payment-date" label="Fecha de pago" value={paymentDate} onChange={setPaymentDate} />
            <FormNotesField value={notes} onChange={setNotes} />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>

      {showCardPicker && (
        <CreditCardPickerSheet
          selected={cardId}
          onSelect={(id) => { setCardId(id); setError(""); }}
          onClose={() => setShowCardPicker(false)}
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
    </TransactionFormLayout>
  );
}
