"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CircleHelp,
  Clock3,
  CreditCard,
  Percent,
  SquarePen,
  TrendingUp,
} from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { useState } from "react";

import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import {
  getNumericInputWidth,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/lib/numeric-input";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";

export function AddCreditCardScreen() {
  const router = useRouter();
  const { create } = useCreditCards();

  const [balance, setBalance] = useState("0");
  const [description, setDescription] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [annualInterestRate, setAnnualInterestRate] = useState("0");
  const [statementDay, setStatementDay] = useState("1");
  const [paymentDay, setPaymentDay] = useState("1");
  const [gracePeriodDays, setGracePeriodDays] = useState("10");
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currencyCode = DEFAULT_CURRENCY_CODE;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      await create({
        name: description.trim() || "Sin nombre",
        last4: lastFourDigits.slice(0, 4),
        balance: parseNumericInput(balance),
        limit: parseNumericInput(creditLimit),
        currencyCode,
        interestRate: parseNumericInput(annualInterestRate),
        statementDay: parseInt(statementDay, 10) || 1,
        paymentDay: parseInt(paymentDay, 10) || 1,
        gracePeriodDays: parseInt(gracePeriodDays, 10) || 10,
        paymentReminderEnabled,
      });
      router.push("/cuentas?tab=credito");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-4 pt-3 md:max-w-[40rem] md:px-6 md:pb-6 md:pt-4 lg:max-w-[680px] lg:px-8">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href="/cuentas?tab=credito"
            prefetch={true}
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Agregar tarjeta de crédito
          </h1>

          <div aria-hidden="true" />
        </header>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <section className="px-1 pt-8 text-center">
            <p className="type-label text-[var(--text-primary)]">Balance</p>

            <div className="type-display mt-2.5 flex items-baseline justify-center gap-[1px] font-medium text-[var(--text-primary)]">
              <span aria-hidden="true">$</span>
              <label htmlFor="credit-card-balance" className="sr-only">
                Balance
              </label>
              <input
                id="credit-card-balance"
                name="balance"
                type="text"
                inputMode="numeric"
                value={balance}
                onChange={(event) => setBalance(sanitizeNumericInput(event.target.value, "integer"))}
                onBlur={() => setBalance((current) => normalizeNumericBlurValue(current, "integer"))}
                style={{ width: getNumericInputWidth(balance) }}
                className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
              />
            </div>

            <p className="type-helper mt-3 text-[var(--text-secondary)]">
              CLP activo por ahora · USD próximamente.
            </p>
          </section>

          <section className="mt-10 space-y-0">
            <FormField htmlFor="credit-card-description" label="Descripción">
              <InlineInput
                id="credit-card-description"
                icon={<SquarePen size={16} className="shrink-0 text-white/92" />}
                value={description}
                onChange={setDescription}
                placeholder="Nombre de la tarjeta"
              />
            </FormField>

            <FormField htmlFor="credit-card-last-four" label="Últimos 4 dígitos" withTopPadding>
              <InlineInput
                id="credit-card-last-four"
                icon={<CreditCard size={16} className="shrink-0 text-white/92" />}
                value={lastFourDigits}
                onChange={(value) => setLastFourDigits(value.replace(/\D/g, "").slice(0, 4))}
                placeholder=""
                inputMode="numeric"
              />
            </FormField>

            <FormField htmlFor="credit-card-limit" label="Límite de crédito" withTopPadding>
              <InlineAmountInput
                id="credit-card-limit"
                icon={<TrendingUp size={16} className="shrink-0 text-white/92" />}
                prefix="$"
                value={creditLimit}
                onChange={setCreditLimit}
                mode="integer"
              />
            </FormField>

            <FormField
              htmlFor="credit-card-interest-rate"
              label="Tasa de Interés Anual"
              withTopPadding
            >
              <InlineAmountInput
                id="credit-card-interest-rate"
                icon={<Percent size={16} className="shrink-0 text-white/92" />}
                value={annualInterestRate}
                onChange={setAnnualInterestRate}
                mode="decimal"
              />
            </FormField>

            <div className="border-b border-[var(--line-strong)] pb-2.5 pt-2.5">
              <div className="grid grid-cols-2 gap-4">
                <DayField
                  id="statement-day"
                  label="Día de corte"
                  value={statementDay}
                  onChange={setStatementDay}
                />
                <DayField
                  id="payment-day"
                  label="Día de pago"
                  value={paymentDay}
                  onChange={setPaymentDay}
                />
              </div>
            </div>

            <div className="border-b border-[var(--line-strong)] pb-2.5 pt-2.5">
              <label
                htmlFor="credit-card-grace-period"
                className="type-label mb-1 flex items-center gap-1.5 text-[var(--text-primary)]"
              >
                <span>Período de gracia (días)</span>
                <CircleHelp size={14} className="text-white/90" />
              </label>

              <InlineInput
                id="credit-card-grace-period"
                icon={<CalendarDays size={16} className="shrink-0 text-white/92" />}
                value={gracePeriodDays}
                onChange={(value) => setGracePeriodDays(value.replace(/\D/g, "").slice(0, 2))}
                placeholder="10"
                inputMode="numeric"
              />

              <p className="type-helper mt-1.5 max-w-[30rem] italic text-white/88">
                Ajusta este valor solo si tus fechas de pago en la app no coinciden con el
                calendario de pagos de tu tarjeta.
              </p>
            </div>

            <div className="border-b border-[var(--line-strong)] py-5">
              <div className="flex items-center justify-between gap-4">
                <p className="type-body text-[var(--text-primary)]">
                  Recordatorio de fecha de vencimiento de pago
                </p>

                <button
                  type="button"
                  aria-pressed={paymentReminderEnabled}
                  onClick={() => setPaymentReminderEnabled((current) => !current)}
                  className={`relative h-8 w-[3.25rem] rounded-full p-1 transition-colors ${
                    paymentReminderEnabled ? "bg-[var(--accent)]" : "bg-white/16"
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white transition-transform ${
                      paymentReminderEnabled ? "translate-x-[1.25rem]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <ReminderRow
                  icon={<Bell size={17} className="text-white/92" />}
                  value="Día anterior"
                />
                <ReminderRow
                  icon={<Clock3 size={17} className="text-white/92" />}
                  value="10:00"
                />
              </div>
            </div>
          </section>

          <div className="mt-auto pt-8">
            <div className="border-t border-white/6 px-2 pb-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="type-body flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] disabled:opacity-60"
              >
                {isSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  htmlFor,
  label,
  children,
  withTopPadding = false,
}: Readonly<{
  htmlFor: string;
  label: string;
  children: ReactNode;
  withTopPadding?: boolean;
}>) {
  return (
    <div className={`border-b border-[var(--line-strong)] pb-2.5 ${withTopPadding ? "pt-2.5" : ""}`}>
      <label htmlFor={htmlFor} className="type-label mb-1 block text-[var(--text-primary)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function InlineInput({
  id,
  icon,
  value,
  onChange,
  placeholder,
  inputMode,
}: Readonly<{
  id: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}>) {
  return (
    <div className="flex items-center gap-3 text-[var(--text-primary)]">
      {icon}
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="type-body min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[var(--text-secondary)]"
        placeholder={placeholder}
      />
    </div>
  );
}

function InlineAmountInput({
  id,
  icon,
  prefix,
  value,
  onChange,
  mode = "integer",
}: Readonly<{
  id: string;
  icon: ReactNode;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "integer" | "decimal";
}>) {
  return (
    <div className="flex items-center gap-3 text-[var(--text-primary)]">
      {icon}
      <div className="flex items-center gap-2">
        {prefix ? <span className="type-body">{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode={mode === "decimal" ? "decimal" : "numeric"}
          value={value}
          onChange={(event) => onChange(sanitizeNumericInput(event.target.value, mode))}
          onBlur={() => onChange(normalizeNumericBlurValue(value, mode))}
          style={{ width: getNumericInputWidth(value, 4) }}
          className="type-body min-w-[4ch] max-w-full border-0 bg-transparent p-0 outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}

function DayField({
  id,
  label,
  value,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div>
      <label htmlFor={id} className="type-label mb-1 block text-[var(--text-primary)]">
        {label}
      </label>
      <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
        <CalendarDays size={16} className="shrink-0 text-white/92" />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, 2))
          }
          className="type-body w-[2ch] border-0 bg-transparent p-0 outline-none"
        />
      </div>
    </div>
  );
}

function ReminderRow({
  icon,
  value,
}: Readonly<{
  icon: ReactNode;
  value: string;
}>) {
  return (
    <div className="type-body flex items-center gap-3 text-[var(--text-primary)]">
      {icon}
      <span>{value}</span>
    </div>
  );
}
