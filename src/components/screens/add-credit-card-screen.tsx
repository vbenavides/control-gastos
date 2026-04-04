"use client";

import Link from "next/link";
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

export function AddCreditCardScreen() {
  const [balance, setBalance] = useState("0");
  const [description, setDescription] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [annualInterestRate, setAnnualInterestRate] = useState("0,00");
  const [statementDay, setStatementDay] = useState("1");
  const [paymentDay, setPaymentDay] = useState("1");
  const [gracePeriodDays, setGracePeriodDays] = useState("10");
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(true);

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-4 pt-3 md:max-w-[560px] md:px-6 md:pb-6 md:pt-4 lg:max-w-[680px] lg:px-8">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href="/cuentas?tab=credito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="text-center text-[1.34rem] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
            Agregar tarjeta de crédito
          </h1>

          <div aria-hidden="true" />
        </header>

        <form className="flex flex-1 flex-col" onSubmit={(event) => event.preventDefault()}>
          <section className="px-1 pt-8 text-center">
            <p className="text-[0.84rem] text-[var(--text-primary)]">Balance</p>

            <div className="mt-2.5 flex items-baseline justify-center gap-[1px] font-medium leading-none tracking-[-0.02em] text-[var(--text-primary)]">
              <span aria-hidden="true" className="text-[2.18rem] leading-none sm:text-[2.28rem]">
                $
              </span>
              <label htmlFor="credit-card-balance" className="sr-only">
                Balance
              </label>
              <input
                id="credit-card-balance"
                name="balance"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                onBlur={() => {
                  if (balance.trim() === "") {
                    setBalance("0");
                  }
                }}
                className="w-[2.3ch] border-0 bg-transparent p-0 text-center text-[2.18rem] font-medium leading-none tracking-[-0.02em] text-[var(--text-primary)] outline-none [appearance:textfield] sm:text-[2.28rem] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
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
              />
            </FormField>

            <FormField htmlFor="credit-card-interest-rate" label="Tasa de Interés Anual" withTopPadding>
              <InlineAmountInput
                id="credit-card-interest-rate"
                icon={<Percent size={16} className="shrink-0 text-white/92" />}
                value={annualInterestRate}
                onChange={setAnnualInterestRate}
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
                className="mb-1 flex items-center gap-1.5 text-[0.86rem] text-[var(--text-primary)]"
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

              <p className="mt-1.5 max-w-[30rem] text-[0.74rem] leading-[1.35] text-white/88 italic">
                Ajusta este valor solo si tus fechas de pago en la app no coinciden con el calendario de pagos de tu tarjeta.
              </p>
            </div>

            <div className="border-b border-[var(--line-strong)] py-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.98rem] text-[var(--text-primary)]">Recordatorio de fecha de vencimiento de pago</p>

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
                <ReminderRow icon={<Bell size={17} className="text-white/92" />} value="Día anterior" />
                <ReminderRow icon={<Clock3 size={17} className="text-white/92" />} value="10:00" />
              </div>
            </div>
          </section>

          <div className="mt-auto pt-8">
            <div className="border-t border-white/6 px-2 pb-3 pt-4">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 text-[1rem] font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)]"
              >
                Guardar
              </button>
            </div>
          </div>

          <p className="sr-only">
            Pantalla visual lista. La persistencia de la tarjeta de crédito todavía no está implementada.
          </p>
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
      <label htmlFor={htmlFor} className="mb-1 block text-[0.86rem] text-[var(--text-primary)]">
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
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[1rem] leading-none outline-none placeholder:text-[var(--text-secondary)]"
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
}: Readonly<{
  id: string;
  icon: ReactNode;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="flex items-center gap-3 text-[var(--text-primary)]">
      {icon}
      <div className="flex items-center gap-2 leading-none">
        {prefix ? <span className="text-[1rem]">{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-[5ch] border-0 bg-transparent p-0 text-[1rem] leading-none outline-none placeholder:text-[var(--text-secondary)]"
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
      <label htmlFor={id} className="mb-1 block text-[0.86rem] text-[var(--text-primary)]">
        {label}
      </label>
      <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
        <CalendarDays size={16} className="shrink-0 text-white/92" />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-[2ch] border-0 bg-transparent p-0 text-[1rem] leading-none outline-none"
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
    <div className="flex items-center gap-3 text-[1rem] text-[var(--text-primary)]">
      {icon}
      <span>{value}</span>
    </div>
  );
}
