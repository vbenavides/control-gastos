"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarCheck2, Clock, Layers, RotateCcw, SquarePen, Wallet } from "lucide-react";

import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  FieldLabel,
  FieldRow,
  FormDateField,
  FormNotesField,
  FormScrollBody,
  FormSelectField,
  FormTextField,
  FormToggleRow,
  SaveButton,
  ToggleSwitch,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";

const REMINDER_DAY_OPTIONS = [
  { value: "day-before", label: "Día anterior" },
  { value: "same-day", label: "Mismo día" },
  { value: "two-days-before", label: "Dos días antes" },
  { value: "week-before", label: "Una semana antes" },
];

export function AddPaymentScreen() {
  const router = useRouter();
  const { accounts, update: updateAccount } = useDebitAccounts();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState(todayISO);
  const [isRecurring, setIsRecurring] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDay, setReminderDay] = useState("day-before");
  const [reminderTime, setReminderTime] = useState("10:00");
  const [autoPayment, setAutoPayment] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNumericInput(amount);
    if (!numAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!payFromAccountId) { setError("Selecciona una cuenta."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const account = (accounts ?? []).find((a) => a.id === payFromAccountId);
      const categoryName = (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";
      const meta = KIND_META.payment;

      const noteFragments = [
        notes.trim(),
        isRecurring ? "Recurrente" : "",
        reminderEnabled
          ? `Recordatorio: ${REMINDER_DAY_OPTIONS.find((o) => o.value === reminderDay)?.label ?? reminderDay} ${reminderTime}`
          : "",
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
        statusLabel: autoPayment ? "Pagado" : meta.statusLabel,
      });

      // Descontar del balance si se marca como pago automático
      if (autoPayment && account) {
        await updateAccount(payFromAccountId, { balance: account.balance - numAmount });
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
            <FormSelectField
              id="pay-from"
              label="Pagar desde"
              icon={<Wallet size={16} />}
              value={payFromAccountId}
              onChange={(v) => { setPayFromAccountId(v); setError(""); }}
              placeholder="Selecciona cuenta"
              options={accountOptions}
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
            <FormDateField id="due-date" label="Pagar antes de" value={dueDate} onChange={setDueDate} />

            <FormToggleRow
              icon={<RotateCcw size={16} />}
              label="Pago Recurrente"
              checked={isRecurring}
              onChange={setIsRecurring}
            />

            {/* Recordatorio — sin icono */}
            <FormToggleRow
              label="Recordatorio"
              checked={reminderEnabled}
              onChange={setReminderEnabled}
            />

            {reminderEnabled ? (
              <>
                {/* Día anterior — sin border-b */}
                <div className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-white/55"><Bell size={16} /></span>
                    <select
                      value={reminderDay}
                      onChange={(e) => setReminderDay(e.target.value)}
                      aria-label="Día del recordatorio"
                      className="type-body flex-1 appearance-none border-0 bg-transparent py-0 text-[var(--text-primary)] outline-none"
                    >
                      {REMINDER_DAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[var(--app-bg)]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 10:00 — con border-b */}
                <div className="border-b border-[var(--line)] py-3">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-white/55"><Clock size={16} /></span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      aria-label="Hora del recordatorio"
                      className="type-body border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {/* Pago Automático */}
            <FieldRow>
              <FieldLabel>Pago Automático</FieldLabel>
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-white/55"><CalendarCheck2 size={16} /></span>
                <p className="flex-1 text-[0.875rem] leading-snug text-[var(--text-primary)]">
                  Marcar como pagado automáticamente en la fecha de vencimiento
                </p>
                <ToggleSwitch checked={autoPayment} onChange={setAutoPayment} />
              </div>
            </FieldRow>

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
