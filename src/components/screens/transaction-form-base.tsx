"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
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
  X,
} from "lucide-react";

import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import { DatePickerField, InlineDatePicker } from "@/components/date-picker-field";

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

// ─── Clickable picker field (opens a bottom sheet) ───────────────────────────

export function FormPickerField({
  label,
  icon,
  value,
  placeholder,
  onClick,
  className = "",
}: {
  label: string;
  icon?: ReactNode;
  value: string;
  placeholder?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <FieldRow className={className}>
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3"
      >
        {icon ? (
          <span className="shrink-0 text-white/55">{icon}</span>
        ) : null}
        <span
          className={[
            "type-body min-w-0 flex-1 text-left",
            value
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)]",
          ].join(" ")}
        >
          {value || placeholder}
        </span>
      </button>
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

// ─── Recurring section — shared types, hook, and components ──────────────────

export type RecurringInterval = "diario" | "semanal" | "quincenal" | "mensual" | "anual";
export type RecurringStopMode = "nunca" | "en-la-fecha";

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Drop-in hook — call once per form that has a Recurrente toggle. */
export function useRecurringSection() {
  const [repeatInterval, setRepeatInterval] = useState<RecurringInterval>("mensual");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [stopMode, setStopMode] = useState<RecurringStopMode>("nunca");
  const [stopDate, setStopDate] = useState("");
  const [showEachPicker, setShowEachPicker] = useState(false);

  function handleStopMode(mode: RecurringStopMode) {
    setStopMode(mode);
    if (mode === "en-la-fecha" && !stopDate) setStopDate(oneYearFromNow());
  }

  function buildNoteFragment(): string {
    return [
      `Recurrente: ${repeatInterval}, cada ${repeatEvery}`,
      stopMode === "en-la-fecha" && stopDate
        ? `hasta ${formatDateISO(stopDate)}`
        : "sin fecha límite",
    ].join(", ");
  }

  return {
    repeatInterval, setRepeatInterval,
    repeatEvery, setRepeatEvery,
    stopMode, stopDate, setStopDate,
    showEachPicker, setShowEachPicker,
    handleStopMode,
    buildNoteFragment,
  };
}

/**
 * Renders the "Repetir + Cada" two-column row and the "Parar" row.
 * Place inside a section, immediately after the Recurrente toggle.
 */
export function RecurringFields({
  repeatInterval,
  onRepeatInterval,
  repeatEvery,
  onOpenEachPicker,
  stopMode,
  onStopMode,
  stopDate,
  onStopDate,
}: {
  repeatInterval: RecurringInterval;
  onRepeatInterval: (v: RecurringInterval) => void;
  repeatEvery: number;
  onOpenEachPicker: () => void;
  stopMode: RecurringStopMode;
  onStopMode: (v: RecurringStopMode) => void;
  stopDate: string;
  onStopDate: (v: string) => void;
}) {
  return (
    <>
      {/* Repetir + Cada */}
      <FieldRow>
        <div className="grid grid-cols-2 divide-x divide-[var(--line)]">
          <div className="pr-5">
            <FieldLabel htmlFor="repeat-interval">Repetir</FieldLabel>
            <div className="relative flex items-center">
              <select
                id="repeat-interval"
                value={repeatInterval}
                onChange={(e) => onRepeatInterval(e.target.value as RecurringInterval)}
                className="type-body min-h-[1.75rem] w-full appearance-none border-0 bg-transparent py-0 pr-4 text-[var(--text-primary)] outline-none"
              >
                <option value="diario" className="bg-[var(--app-bg)]">Diario</option>
                <option value="semanal" className="bg-[var(--app-bg)]">Semanal</option>
                <option value="quincenal" className="bg-[var(--app-bg)]">Quincenal</option>
                <option value="mensual" className="bg-[var(--app-bg)]">Mensual</option>
                <option value="anual" className="bg-[var(--app-bg)]">Anual</option>
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/50"
              />
            </div>
          </div>
          <div className="pl-5">
            <FieldLabel>Cada</FieldLabel>
            <button
              type="button"
              onClick={onOpenEachPicker}
              className="type-body block w-full text-left text-[var(--text-primary)] transition hover:opacity-75"
              aria-label={`Repetir cada ${repeatEvery}. Tap para cambiar`}
            >
              {repeatEvery}
            </button>
          </div>
        </div>
      </FieldRow>

      {/* Parar */}
      <FieldRow>
        <FieldLabel>Parar</FieldLabel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onStopMode("nunca")}
              className={[
                "rounded-full px-4 py-1.5 text-[0.88rem] font-medium transition",
                stopMode === "nunca"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white/10 text-[var(--text-secondary)] hover:bg-white/15",
              ].join(" ")}
            >
              Nunca
            </button>
            <button
              type="button"
              onClick={() => onStopMode("en-la-fecha")}
              className={[
                "rounded-full px-4 py-1.5 text-[0.88rem] font-medium transition",
                stopMode === "en-la-fecha"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white/10 text-[var(--text-secondary)] hover:bg-white/15",
              ].join(" ")}
            >
              En la fecha
            </button>
          </div>
          {stopMode === "en-la-fecha" && (
            <InlineDatePicker
              id="recurring-stop-date"
              value={stopDate}
              onChange={onStopDate}
            />
          )}
        </div>
      </FieldRow>
    </>
  );
}

/** Renders the "Pago Automático" row with CalendarCheck2 icon and toggle. */
export function AutoPaymentRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <FieldRow>
      <FieldLabel>Pago Automático</FieldLabel>
      <div className="flex items-start gap-3">
        <span className="mt-[1px] shrink-0 text-white/55">
          <CalendarCheck2 size={16} />
        </span>
        <p className="type-body flex-1 leading-snug text-[var(--text-primary)]">
          Marcar como pagado automáticamente en la fecha de vencimiento
        </p>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
    </FieldRow>
  );
}

// ─── Number picker sheet ──────────────────────────────────────────────────────
// Bottom sheet for picking a number (e.g. "Cada N" in recurring forms).
// Same slide-up UX as the DayPickerSheet in budget-config-screen.tsx.

// 1–30 + 0 (0 = "Último día del mes", igual que en DayPickerSheet de budget-config)
const NUMBER_ITEMS = [...Array.from({ length: 30 }, (_, i) => i + 1), 0] as const;

function formatPickerNumber(n: number): string {
  return n === 0 ? "Último día del mes" : String(n);
}

export function NumberPickerSheet({
  value,
  onClose,
  onSelect,
  title = "Cada",
}: {
  value: number;
  onClose: () => void;
  onSelect: (n: number) => void;
  title?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setIsVisible(true));
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [isVisible]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 260);
  }

  function handleSelect(n: number) {
    onSelect(n);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar selector"
        className={[
          "absolute inset-0 transition-[background-color] duration-200",
          isVisible ? "bg-black/55" : "bg-black/0",
        ].join(" ")}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          "relative z-10 flex max-h-[68svh] flex-col rounded-t-[1.5rem]",
          "border border-[var(--line)] bg-[var(--surface)]",
          "shadow-[0_-20px_50px_rgba(0,0,0,0.45)]",
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "will-change-transform",
          "sm:mx-auto sm:w-full sm:max-w-[640px] lg:max-w-[720px]",
        ].join(" ")}
        style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Fixed header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[var(--text-secondary)] transition hover:bg-white/16 hover:text-white"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {NUMBER_ITEMS.map((n) => {
            const isSelected = value === n;
            return (
              <button
                key={n}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                onClick={() => handleSelect(n)}
                className={[
                  "w-full border-b border-[var(--line)] py-[0.85rem] text-center transition",
                  n === 0
                    ? "text-[1rem] font-semibold"
                    : "text-[1.05rem] font-normal",
                  isSelected
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-primary)] hover:bg-white/[0.03]",
                ].join(" ")}
              >
                {formatPickerNumber(n)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Re-exports of commonly used icons ───────────────────────────────────────

export { SquarePen, Wallet, CreditCard, Layers, Bell, Clock, CalendarCheck2, RotateCcw, MessageSquare };
