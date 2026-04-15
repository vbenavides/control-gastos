"use client";

import { useParams, useRouter } from "next/navigation";
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
  X,
} from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";

export function EditCreditCardScreen() {
  const params = useParams<{ cardId: string }>();
  const router = useRouter();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const { cards, update, isLoading: isDataLoading } = useCreditCards();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const currencyCode = DEFAULT_CURRENCY_CODE;

  const [balance, setBalance] = useState("0");
  const [description, setDescription] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [annualInterestRate, setAnnualInterestRate] = useState("0");
  const [statementDay, setStatementDay] = useState(1);
  const [paymentDay, setPaymentDay] = useState(1);
  const [gracePeriodDays, setGracePeriodDays] = useState("10");
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showStatementDayPicker, setShowStatementDayPicker] = useState(false);
  const [showPaymentDayPicker, setShowPaymentDayPicker] = useState(false);

  // Pre-cargar los datos del card cuando estén disponibles
  useEffect(() => {
    if (!card || initialized) return;
    setBalance(String(card.balance));
    setDescription(card.name);
    setLastFourDigits(card.last4);
    setCreditLimit(String(card.limit));
    setAnnualInterestRate(String(card.interestRate));
    setStatementDay(card.statementDay);
    setPaymentDay(card.paymentDay);
    setGracePeriodDays(String(card.gracePeriodDays));
    setPaymentReminderEnabled(card.paymentReminderEnabled);
    setInitialized(true);
  }, [card, initialized]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving || !card) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      await update(card.id, {
        name: description.trim() || "Sin nombre",
        last4: lastFourDigits.slice(0, 4),
        balance: parseNumericInput(balance),
        limit: parseNumericInput(creditLimit),
        currencyCode,
        interestRate: parseNumericInput(annualInterestRate),
        statementDay,
        paymentDay,
        gracePeriodDays: parseInt(gracePeriodDays, 10) || 10,
        paymentReminderEnabled,
      });
      router.push(`/cuentas/tarjeta/${card.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar los cambios.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Estado: cargando ──
  if (isDataLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Tarjeta no encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[36rem] px-4 pb-4 pt-3 md:max-w-[40rem] md:px-6 md:pb-6 md:pt-4 lg:max-w-[680px] lg:px-8">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Editar tarjeta
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
                value={formatMoneyInput(balance, currencyCode)}
                onChange={(event) =>
                  setBalance(
                    sanitizeNumericInput(
                      stripMoneyFormat(event.target.value, currencyCode),
                      "integer",
                    ),
                  )
                }
                onBlur={() =>
                  setBalance((current) => normalizeNumericBlurValue(current, "integer"))
                }
                style={{ width: getNumericInputWidth(formatMoneyInput(balance, currencyCode)) }}
                className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
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
                onChange={(value) =>
                  setLastFourDigits(value.replace(/\D/g, "").slice(0, 4))
                }
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
                currencyCode={currencyCode}
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
                <DayPickerField
                  label="Día de corte"
                  value={statementDay}
                  onOpen={() => setShowStatementDayPicker(true)}
                />
                <DayPickerField
                  label="Día de pago"
                  value={paymentDay}
                  onOpen={() => setShowPaymentDayPicker(true)}
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
                onChange={(value) =>
                  setGracePeriodDays(value.replace(/\D/g, "").slice(0, 2))
                }
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

              {paymentReminderEnabled && (
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
              )}
            </div>
          </section>

          <div className="mt-auto pt-8">
            {saveError ? (
              <p
                role="alert"
                className="type-helper mb-3 rounded-[0.6rem] bg-red-500/10 px-3 py-2 text-center text-red-400"
              >
                {saveError}
              </p>
            ) : null}
            <div className="border-t border-white/6 px-2 pb-3 pt-4">
              <button
                type="submit"
                disabled={isSaving || isDataLoading}
                className="type-body flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] disabled:opacity-60"
              >
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Day picker sheets ── */}
      {showStatementDayPicker && (
        <DayPickerSheet
          title="Día de corte"
          value={statementDay}
          onClose={() => setShowStatementDayPicker(false)}
          onSelect={(day) => setStatementDay(day)}
        />
      )}
      {showPaymentDayPicker && (
        <DayPickerSheet
          title="Día de pago"
          value={paymentDay}
          onClose={() => setShowPaymentDayPicker(false)}
          onSelect={(day) => setPaymentDay(day)}
        />
      )}
    </>
  );
}

// ─── Day items ────────────────────────────────────────────────────────────────

const DAY_ITEMS = [...Array.from({ length: 30 }, (_, i) => i + 1), 0] as const;

function formatDay(day: number): string {
  return day === 0 ? "Último día del mes" : String(day);
}

// ─── DayPickerSheet ───────────────────────────────────────────────────────────

function DayPickerSheet({
  title,
  value,
  onClose,
  onSelect,
}: Readonly<{
  title: string;
  value: number;
  onClose: () => void;
  onSelect: (day: number) => void;
}>) {
  const [isVisible, setIsVisible] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setIsVisible(true));
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [isVisible]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 260);
  }

  function handleSelect(day: number) {
    onSelect(day);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label={`Cerrar selector de ${title}`}
        className={[
          "absolute inset-0 transition-[background-color] duration-200",
          isVisible ? "bg-black/55" : "bg-black/0",
        ].join(" ")}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Seleccionar ${title}`}
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
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">Día</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[var(--text-secondary)] transition hover:bg-white/16 hover:text-white"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {DAY_ITEMS.map((day) => {
            const isSelected = value === day;
            const isLast = day === 0;
            return (
              <button
                key={day}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                onClick={() => handleSelect(day)}
                className={[
                  "w-full border-b border-[var(--line)] py-[0.85rem] text-center transition",
                  isLast ? "text-[1rem] font-semibold" : "text-[1.05rem] font-normal",
                  isSelected
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-primary)] hover:bg-white/[0.03]",
                ].join(" ")}
              >
                {formatDay(day)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── DayPickerField ───────────────────────────────────────────────────────────

function DayPickerField({
  label,
  value,
  onOpen,
}: Readonly<{
  label: string;
  value: number;
  onOpen: () => void;
}>) {
  return (
    <div>
      <p className="type-label mb-1 text-[var(--text-primary)]">{label}</p>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 text-[var(--text-primary)]"
      >
        <CalendarDays size={16} className="shrink-0 text-white/92" />
        <span className="type-body">{formatDay(value)}</span>
      </button>
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

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
    <div
      className={`border-b border-[var(--line-strong)] pb-2.5 ${withTopPadding ? "pt-2.5" : ""}`}
    >
      <label htmlFor={htmlFor} className="type-label mb-1 block text-[var(--text-primary)]">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── InlineInput ──────────────────────────────────────────────────────────────

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

// ─── InlineAmountInput ────────────────────────────────────────────────────────

function InlineAmountInput({
  id,
  icon,
  prefix,
  value,
  onChange,
  mode = "integer",
  currencyCode = "CLP",
}: Readonly<{
  id: string;
  icon: ReactNode;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "integer" | "decimal";
  currencyCode?: string;
}>) {
  const isMoney = mode === "integer";
  const displayValue = isMoney ? formatMoneyInput(value, currencyCode) : value;
  return (
    <div className="flex items-center gap-3 text-[var(--text-primary)]">
      {icon}
      <div className="flex items-center gap-2">
        {prefix ? <span className="type-body">{prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode={mode === "decimal" ? "decimal" : "numeric"}
          value={displayValue}
          onChange={(event) => {
            const raw = isMoney
              ? stripMoneyFormat(event.target.value, currencyCode)
              : event.target.value;
            onChange(sanitizeNumericInput(raw, mode));
          }}
          onBlur={() => onChange(normalizeNumericBlurValue(value, mode))}
          style={{ width: getNumericInputWidth(displayValue, 4) }}
          className="type-body min-w-[4ch] max-w-full border-0 bg-transparent p-0 outline-none placeholder:text-[var(--text-secondary)]"
        />
      </div>
    </div>
  );
}

// ─── ReminderRow ──────────────────────────────────────────────────────────────

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
