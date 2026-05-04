"use client";

import { AlertTriangle, ArrowLeft, Check, Clock, CreditCard, Trash2, Wallet } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SwipeToPayButton } from "@/components/swipe-to-pay-button";

import {
  FormDateField,
  FormNotesField,
  FormPickerField,
  FormScrollBody,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  AmountSection,
} from "@/components/screens/transaction-form-base";
import { AccountPickerSheet } from "@/components/screens/picker-sheets";
import { formatAmountCLP } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useInstallmentPayments } from "@/lib/hooks/use-installment-payments";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { getInstallmentSchedule, parseInstallmentTotal } from "@/lib/installments";
import { parseNumericInput } from "@/lib/numeric-input";

export function CreditCardInstallmentPaymentScreen() {
  const params = useParams<{
    cardId: string;
    transactionId: string;
    installmentNumber: string;
  }>();

  const cardId = typeof params.cardId === "string" ? params.cardId : "";
  const transactionId = typeof params.transactionId === "string" ? params.transactionId : "";
  const installmentNumber = Number(params.installmentNumber ?? 0);

  const supabase = useMemo(() => createClient(), []);
  const { cards, isLoading: cardsLoading } = useCreditCards();
  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const {
    installmentPayments,
    isLoading: paymentsLoading,
    refresh,
  } = useInstallmentPayments();

  const [amount, setAmount] = useState("0");
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [error, setError] = useState("");
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const card = useMemo(
    () => (cards ?? []).find((item) => item.id === cardId) ?? null,
    [cards, cardId],
  );

  const transaction = useMemo(
    () => (transactions ?? []).find((item) => item.id === transactionId) ?? null,
    [transactions, transactionId],
  );

  const installmentPayment = useMemo(
    () => (installmentPayments ?? []).find((item) =>
      item.purchaseTransactionId === transactionId && item.installmentNumber === installmentNumber,
    ) ?? null,
    [installmentPayments, transactionId, installmentNumber],
  );

  const schedule = useMemo(() => {
    if (!card || !transaction) return [];
    return getInstallmentSchedule(transaction, card);
  }, [card, transaction]);

  const installment = schedule.find((item) => item.installmentNumber === installmentNumber) ?? null;
  const totalPayments = useMemo(
    () => parseInstallmentTotal(transaction?.note),
    [transaction?.note],
  );

  useEffect(() => {
    if (!installment) return;
    setAmount(String(installmentPayment?.amount ?? installment.scheduledAmount));
    setPayFromAccountId(installmentPayment?.paidFromAccountId ?? "");
    setPaymentDate(installmentPayment?.paymentDate.split("T")[0] ?? installment.dueDate);
    setNotes(installmentPayment?.note ?? "");
  }, [installment, installmentPayment]);

  const accountName = (accounts ?? []).find((account) => account.id === payFromAccountId)?.name ?? "";
  const selectedAccount = (accounts ?? []).find((account) => account.id === payFromAccountId) ?? null;
  const numericAmount = parseNumericInput(amount);

  const today = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue = paymentDate ? paymentDate < today : false;

  const installmentLabel = transaction
    ? `${transaction.description} (${installmentNumber} de ${totalPayments})`
    : "Cuota";

  const handleUndo = async () => {
    if (!installmentPayment || isUndoing) return;
    setIsUndoing(true);
    setError("");
    try {
      const isCurrentlyPaid = installmentPayment.isPaid;
      const rpcName = isCurrentlyPaid
        ? "undo_installment_payment"
        : "delete_installment_payment";

      const { error: rpcError } = await supabase.rpc(rpcName, {
        p_installment_payment_id: installmentPayment.id,
      });

      if (rpcError) throw rpcError;

      await refresh();
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : "Ocurrió un error al deshacer. Intenta de nuevo.";
      console.error("Error al deshacer pago de cuota", unknownError);
      setError(message || "Ocurrió un error al deshacer. Intenta de nuevo.");
      setIsUndoing(false);
    }
  };

  const handleSwipePay = async () => {
    if (!installmentPayment || !transaction || !card || !installment || !selectedAccount || isPaying) return;
    setIsPaying(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("upsert_installment_payment", {
        p_purchase_transaction_id: transaction.id,
        p_installment_number: installmentNumber,
        p_amount: numericAmount,
        p_paid_from_account_id: payFromAccountId,
        p_payment_date: paymentDate,
        p_note: notes.trim() || null,
        p_is_paid: true,
      });

      if (rpcError) throw rpcError;

      const resultRow = Array.isArray(data) ? data[0] : data;
      if (!resultRow) throw new Error("No recibimos respuesta del pago.");

      const params = new URLSearchParams({
        noticeAccount: resultRow.notice_account_name,
        noticeBalance: String(resultRow.notice_account_balance),
        noticeAt: String(Date.now()),
      });

      window.location.assign(
        `/cuentas/tarjeta/${resultRow.card_id}/compras-a-meses/${transaction.id}?${params.toString()}`,
      );
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : "Ocurrió un error al pagar. Intenta de nuevo.";
      console.error("Error al confirmar pago de cuota", unknownError);
      setError(message || "Ocurrió un error al pagar. Intenta de nuevo.");
      setIsPaying(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!transaction || !card || !installment || !selectedAccount) {
      setError("No encontramos toda la información del pago.");
      return;
    }

    if (!numericAmount) {
      setError("Ingresa un monto mayor a $0.");
      return;
    }

    if (isSaving) return;

    setError("");
    setIsSaving(true);

    try {
      const { data, error: rpcError } = await supabase.rpc("upsert_installment_payment", {
        p_purchase_transaction_id: transaction.id,
        p_installment_number: installmentNumber,
        p_amount: numericAmount,
        p_paid_from_account_id: payFromAccountId,
        p_payment_date: paymentDate,
        p_note: notes.trim() || null,
        p_is_paid: false,
      });

      if (rpcError) {
        throw rpcError;
      }

      const resultRow = Array.isArray(data) ? data[0] : data;

      if (!resultRow) {
        throw new Error("No recibimos respuesta del pago.");
      }

      await refresh();
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : "Ocurrió un error al guardar. Intenta de nuevo.";
      console.error("Error al guardar pago de cuota", unknownError);
      setError(message || "Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  if (cardsLoading || accountsLoading || transactionsLoading || paymentsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!card || !transaction || !installment) {
    return (
      <div className="flex h-full flex-col">
        <TransactionFormHeader title="Pago de Tarjeta" />
        <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
          No encontramos esta cuota.
        </div>
      </div>
    );
  }

  const isPaid = installmentPayment?.isPaid ?? false;
  const isPending = installmentPayment !== null && !isPaid;

  return (
    <TransactionFormLayout>
      {installmentPayment ? (
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pb-1 pt-3">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => window.history.back()}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Pago de Tarjeta
          </h1>
          <button
            type="button"
            aria-label="Eliminar pago programado"
            onClick={handleUndo}
            disabled={isUndoing}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5 disabled:opacity-40"
          >
            <Trash2 size={21} strokeWidth={2.1} />
          </button>
        </header>
      ) : (
        <TransactionFormHeader title="Agregar Pago de Tarjeta" />
      )}

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <FormScrollBody>
          <div className={isPending ? "pointer-events-none" : ""}>
            <AmountSection value={amount} onChange={(value) => { setAmount(value); setError(""); }} />
          </div>

          {isPaid ? (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[#8de56c]">
              <Check size={13} strokeWidth={2.6} />
              <span className="text-[0.72rem] font-semibold tracking-[0.12em]">PAGADO</span>
            </div>
          ) : isPending ? (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {isOverdue ? (
                <>
                  <AlertTriangle size={13} strokeWidth={2.4} className="text-[#f55a3d]" />
                  <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-[#f55a3d]">RETRASADO</span>
                </>
              ) : (
                <>
                  <Clock size={13} strokeWidth={2.4} className="text-[#f5a43d]" />
                  <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-[#f5a43d]">A TIEMPO</span>
                </>
              )}
            </div>
          ) : null}

          <section className="mx-0 mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <p className="mb-3 text-center text-[0.74rem] font-medium tracking-[0.02em] text-[var(--text-secondary)]">
              Distribución de Pago
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[1rem] text-[var(--text-primary)]">Saldo Revolvente</span>
                <span className="text-[1rem] font-medium text-[var(--text-primary)]">$0</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {installmentPayment ? (
                    <button
                      type="button"
                      aria-label="Eliminar pago programado"
                      onClick={handleUndo}
                      disabled={isUndoing}
                      className="shrink-0 text-[var(--text-secondary)] transition hover:text-[#f55a3d] disabled:opacity-40"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  ) : null}
                  <span className="truncate text-[1rem] text-[var(--text-primary)]">{installmentLabel}</span>
                </div>
                <span className="text-[1rem] font-medium text-[var(--text-primary)]">
                  {formatAmountCLP(numericAmount || installment.scheduledAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                <span className="text-[1rem] font-semibold text-[var(--text-primary)]">Total</span>
                <span className="text-[1rem] font-semibold text-[var(--text-primary)]">
                  {formatAmountCLP(numericAmount || installment.scheduledAmount)}
                </span>
              </div>
            </div>
          </section>

          <section className={`mt-4 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
            <FormPickerField
              label="Tarjeta de crédito"
              icon={<CreditCard size={16} />}
              value={card.name}
              placeholder="Selecciona tarjeta"
              onClick={() => undefined}
              className="pointer-events-none"
            />

            <FormPickerField
              label="Pagar desde"
              icon={<Wallet size={16} />}
              value={accountName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowAccountPicker(true)}
            />

            <FormDateField
              id="installment-payment-date"
              label="Fecha de pago"
              value={paymentDate}
              onChange={setPaymentDate}
            />

            <FormNotesField value={notes} onChange={setNotes} />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        {isPending ? (
          <div className="shrink-0 px-0 pb-6 pt-4">
            <SwipeToPayButton onConfirm={handleSwipePay} isLoading={isPaying} />
          </div>
        ) : isPaid ? (
          <div className="shrink-0 px-0 pb-6 pt-4">
            <button
              type="button"
              onClick={handleUndo}
              disabled={isUndoing}
              className="type-body h-14 w-full rounded-2xl bg-[#16485c] font-semibold text-[var(--accent)] transition hover:brightness-105 disabled:opacity-60"
            >
              {isUndoing ? "Deshaciendo…" : "Deshacer pago"}
            </button>
          </div>
        ) : (
          <SaveButton isSaving={isSaving} />
        )}
      </form>

      {showAccountPicker ? (
        <AccountPickerSheet
          selected={payFromAccountId}
          onSelect={(id) => { setPayFromAccountId(id); setError(""); }}
          onClose={() => setShowAccountPicker(false)}
          pickerKey="account"
        />
      ) : null}
    </TransactionFormLayout>
  );
}
