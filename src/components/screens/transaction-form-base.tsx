"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarCheck2,
  ChevronDown,
  Clock,
  CreditCard,
  Layers,
  MessageSquare,
  RotateCcw,
  SquarePen,
  Wallet,
} from "lucide-react";

import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { DatePickerField } from "@/components/date-picker-field";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic",
] as const;

export function formatDateISO(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  const year = parts[0];
  const month = parseInt(parts[1] ?? "1", 10);
  const day = parseInt(parts[2] ?? "1", 10);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

// ─── Layout ───────────────────────────────────────────────────────────────────
// h-dvh + flex-col so header and footer never scroll, only the middle does.

export function TransactionFormLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-full w-full max-w-[36rem] flex-col px-4 sm:max-w-[40rem] sm:px-5 md:max-w-[700px] md:px-6 lg:max-w-[820px] lg:px-8">
        {children}
      </div>
    </div>
  );
}

// ─── Header (non-scrolling) ───────────────────────────────────────────────────

export function TransactionFormHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <header className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center pt-3 pb-1">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
        {title}
      </h1>
      <div aria-hidden="true" />
    </header>
  );
}

// ─── Scroll body (middle area, fills available space and scrolls) ─────────────

export function FormScrollBody({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-safe-edge min-h-0 flex-1 overflow-y-auto">
      {children}
    </div>
  );
}

// ─── Amount section ───────────────────────────────────────────────────────────

export function AmountSection({
  value,
  onChange,
  currencyCode = DEFAULT_CURRENCY_CODE,
}: {
  value: string;
  onChange: (v: string) => void;
  currencyCode?: string;
}) {
  const displayValue = formatMoneyInput(value, currencyCode);
  return (
    <section className="px-1 pt-7 text-center">
      <p className="text-[0.76rem] font-medium tracking-wide text-[var(--text-secondary)]">
        Monto
      </p>
      <div className="mt-1.5 flex items-baseline justify-center gap-[1px] type-display font-medium text-[var(--text-primary)]">
        <span aria-hidden="true">$</span>
        <label htmlFor="amount" className="sr-only">
          Monto
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(e) =>
            onChange(sanitizeNumericInput(stripMoneyFormat(e.target.value, currencyCode), "integer"))
          }
          onBlur={() =>
            onChange(normalizeNumericBlurValue(value, "integer"))
          }
          style={{ width: getNumericInputWidth(displayValue) }}
          className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
        />
      </div>
    </section>
  );
}

// ─── Field primitives ─────────────────────────────────────────────────────────

export function FieldRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-[var(--line)] py-3 ${className}`}>
      {children}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[0.74rem] font-medium tracking-[0.01em] text-[var(--text-secondary)]"
    >
      {children}
    </label>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

export function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-[50px] shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        checked ? "bg-[var(--accent)]" : "bg-white/[0.22]"
      }`}
    >
      <span
        className={`absolute top-[2px] h-[24px] w-[24px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-transform duration-200 ${
          checked ? "left-[2px] translate-x-[22px]" : "left-[2px] translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Composed field components ────────────────────────────────────────────────

export function FormTextField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FieldRow className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="shrink-0 text-white/55">{icon}</span>
        ) : null}
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="type-body min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </FieldRow>
  );
}

export function FormSelectField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  options,
  className = "",
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <FieldRow className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative flex items-center gap-3">
        {icon ? (
          <span className="shrink-0 text-white/55">{icon}</span>
        ) : null}
        <select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="type-body min-h-[1.75rem] flex-1 appearance-none border-0 bg-transparent py-0 pr-5 text-[var(--text-primary)] outline-none"
        >
          {placeholder ? (
            <option
              value=""
              className="bg-[var(--app-bg)] text-[var(--text-secondary)]"
            >
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[var(--app-bg)] text-[var(--text-primary)]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/50"
        />
      </div>
    </FieldRow>
  );
}

export function FormDateField({
  id,
  label,
  value,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <DatePickerField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

export function FormToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  className = "",
}: {
  icon?: ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <FieldRow className={className}>
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="shrink-0 text-white/55">{icon}</span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="type-body font-medium text-[var(--text-primary)]">
            {label}
          </p>
          {description ? (
            <p className="mt-0.5 text-[0.74rem] leading-snug text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </FieldRow>
  );
}

// Notas: no border-b (always last field), true multiline textarea
export function FormNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-3">
      <FieldLabel>Notas</FieldLabel>
      <div className="flex items-start gap-3">
        <span className="mt-[2px] shrink-0 text-white/55">
          <MessageSquare size={16} />
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder=""
          className="type-body min-h-[4rem] flex-1 resize-none border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}

// ─── Save button (non-scrolling, pinned to bottom) ────────────────────────────

export function SaveButton({ isSaving = false }: { isSaving?: boolean }) {
  return (
    <div className="shrink-0 border-t border-white/[0.06] pb-6 pt-4">
      <button
        type="submit"
        disabled={isSaving}
        className="type-body h-14 w-full rounded-2xl bg-[var(--accent)] font-semibold text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] transition hover:brightness-105 disabled:opacity-60"
      >
        {isSaving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}

// ─── Re-exports of commonly used icons ───────────────────────────────────────

export { SquarePen, Wallet, CreditCard, Layers, Bell, Clock, CalendarCheck2, RotateCcw, MessageSquare };
