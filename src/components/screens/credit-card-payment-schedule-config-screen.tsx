"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, CalendarDays, Clock, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import {
  formatMoneyInput,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import type { AutoPaymentAmountMode, PaymentScheduleMode } from "@/lib/models";
import { FormToggleRow, TimePickerSheet, ToggleSwitch, NumberPickerSheet } from "@/components/screens/transaction-form-base";
import { AccountPickerSheet } from "@/components/screens/picker-sheets";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type Mode = PaymentScheduleMode;
type AmountMode = AutoPaymentAmountMode;

// ─── Opciones de recordatorio ─────────────────────────────────────────────────

const REMINDER_DAY_OPTIONS = [
  { value: "day-before", label: "Día anterior" },
  { value: "same-day", label: "Mismo día" },
  { value: "two-days-before", label: "Dos días antes" },
  { value: "week-before", label: "Una semana antes" },
] as const;

// ─── Sub-componentes locales ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2 className="type-body font-semibold text-[var(--text-primary)]">{children}</h2>
      <div className="mt-2 border-t border-white/[0.1]" />
    </>
  );
}

function FieldDivider() {
  return <div className="border-t border-white/[0.06]" />;
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function CreditCardPaymentScheduleConfigScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";
  const router = useRouter();

  const { cards, isLoading, update } = useCreditCards();
  const { accounts } = useDebitAccounts();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  // ── Estado del formulario ──
  const [mode, setMode] = useState<Mode | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [amountMode, setAmountMode] = useState<AmountMode>("statement_balance");
  const [fixedAmountStr, setFixedAmountStr] = useState("0");
  const [scheduleDay, setScheduleDay] = useState<number>(1);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDay, setReminderDay] = useState("day-before");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [cashbackCountsAsPayment, setCashbackCountsAsPayment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Pickers visibles ──
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Inicializar estado desde la tarjeta (una vez cargada) ──
  const initialized = useState(false);
  const hasInitialized = initialized[0];
  const setHasInitialized = initialized[1];

  if (card && !hasInitialized) {
    setHasInitialized(true);
    setFromAccountId(card.autoPayFromAccountId ?? "");
    setAmountMode(card.autoPayAmountMode ?? "statement_balance");
    setFixedAmountStr(String(card.autoPayFixedAmount ?? 0));
    setScheduleDay(card.autoPayScheduleDay ?? card.paymentDay ?? 1);
    setReminderEnabled(card.autoPayReminderEnabled ?? false);
    const h = String(card.autoPayReminderHour ?? 9).padStart(2, "0");
    const m = String(card.autoPayReminderMinute ?? 0).padStart(2, "0");
    setReminderTime(`${h}:${m}`);
    setCashbackCountsAsPayment(card.autoPayCashbackCountsAsPayment ?? false);
  }

  const currentMode: Mode = mode ?? card?.paymentScheduleMode ?? "manual";
  const backHref = `/cuentas/tarjeta/${cardId}/pagos-programados`;

  const fromAccountName = (accounts ?? []).find((a) => a.id === fromAccountId)?.name ?? "";

  async function handleApply() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const [rh, rm] = reminderTime.split(":").map(Number);
      const patch: Parameters<typeof update>[1] = {
        paymentScheduleMode: currentMode,
      };
      if (currentMode === "automatic") {
        patch.autoPayFromAccountId = fromAccountId || undefined;
        patch.autoPayAmountMode = amountMode;
        patch.autoPayFixedAmount =
          amountMode === "fixed_amount" ? parseNumericInput(fixedAmountStr) : undefined;
        patch.autoPayScheduleDay = scheduleDay;
        patch.autoPayReminderEnabled = reminderEnabled;
        patch.autoPayReminderHour = reminderEnabled ? (rh ?? 9) : undefined;
        patch.autoPayReminderMinute = reminderEnabled ? (rm ?? 0) : undefined;
        patch.autoPayCashbackCountsAsPayment = cashbackCountsAsPayment;
      }
      await update(cardId, patch);
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  // ── Estados de carga / no encontrado ──
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col items-center justify-center px-4">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link href="/cuentas?tab=credito" aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]">
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">—</h1>
            <div aria-hidden="true" />
          </header>
          <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
            No encontramos esta tarjeta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-full w-full max-w-[36rem] flex-col px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">

        {/* Header */}
        <header className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href={backHref}
            prefetch={true}
            aria-label="Volver"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
            {card.name}
          </h1>
          <div aria-hidden="true" />
        </header>

        {/* Body scrollable */}
        <div className="scroll-safe-edge min-h-0 flex-1 overflow-y-auto pb-6">

          {/* ── Sección: Generación de Pagos ── */}
          <div className="mt-6">
            <SectionTitle>Generación de Pagos</SectionTitle>
            <p className="mt-3 type-label text-[var(--text-secondary)]">
              Selecciona como deseas crear tus pagos de tarjeta
            </p>

            <div className="mt-5 space-y-6">
              {([
                { value: "manual" as const, title: "Manual", description: "Programa tus pagos de tarjeta manualmente cada mes" },
                { value: "automatic" as const, title: "Automático", description: "Los pagos de tarjeta se programan automáticamente cada mes" },
              ]).map((option) => {
                const isActive = currentMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className="flex w-full items-start gap-4 text-left"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isActive ? (
                        <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--accent)]">
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-[var(--accent)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="type-body font-semibold text-[var(--text-primary)]">{option.title}</p>
                      <p className="type-label mt-0.5 text-[var(--text-secondary)]">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Secciones exclusivas del modo automático ── */}
          {currentMode === "automatic" && (
            <>
              {/* Pagar desde */}
              <div className="mt-8">
                <SectionTitle>Pagar desde</SectionTitle>
                <p className="mt-3 type-label text-[var(--text-secondary)]">
                  Selecciona la cuenta de la que deseas realizar el pago
                </p>
                <button
                  type="button"
                  onClick={() => setShowAccountPicker(true)}
                  className="mt-3 flex w-full items-center gap-3 rounded-[0.75rem] border border-white/[0.08] bg-[#17212b] px-4 py-3.5 transition hover:border-white/[0.14]"
                >
                  <Wallet size={18} strokeWidth={1.9} className="shrink-0 text-[var(--text-tertiary)]" />
                  <span className={["type-body", fromAccountName ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"].join(" ")}>
                    {fromAccountName || "Selecciona cuenta"}
                  </span>
                </button>
              </div>

              {/* Monto de Pago */}
              <div className="mt-8">
                <SectionTitle>Monto de Pago</SectionTitle>
                <p className="mt-3 type-label text-[var(--text-secondary)]">
                  Monto a incluir en el pago de tu tarjeta
                </p>

                {/* Toggle Monto fijo / Saldo al corte */}
                <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[0.75rem] border border-white/[0.08] bg-[#17212b]">
                  {([
                    { value: "fixed_amount" as const, label: "Monto fijo" },
                    { value: "statement_balance" as const, label: "Saldo al corte" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAmountMode(opt.value)}
                      className={[
                        "py-3 text-center type-label font-medium transition",
                        amountMode === opt.value
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-secondary)]",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Campo monto fijo */}
                {amountMode === "fixed_amount" && (
                  <div className="mt-3 rounded-[0.75rem] border border-white/[0.08] bg-[#17212b] px-4 py-3">
                    <p className="type-label text-[var(--text-secondary)]">Monto</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatMoneyInput(fixedAmountStr, DEFAULT_CURRENCY_CODE)}
                      onChange={(e) =>
                        setFixedAmountStr(
                          sanitizeNumericInput(
                            stripMoneyFormat(e.target.value, DEFAULT_CURRENCY_CODE),
                            "integer",
                          ),
                        )
                      }
                      onBlur={() =>
                        setFixedAmountStr((v) => normalizeNumericBlurValue(v, "integer"))
                      }
                      className="type-body mt-1 block w-full border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Programación de Pagos */}
              <div className="mt-8">
                <SectionTitle>Programación de Pagos</SectionTitle>
                <p className="mt-3 type-label text-[var(--text-secondary)]">
                  Tu fecha de pago es el {card.paymentDay} de cada mes. Selecciona el día del mes en el que deseas programar el pago.
                </p>

                <button
                  type="button"
                  onClick={() => setShowDayPicker(true)}
                  className="mt-3 flex w-full items-center justify-between rounded-[0.75rem] border border-white/[0.08] bg-[#17212b] px-4 py-3.5 transition hover:border-white/[0.14]"
                >
                  <span className="type-body text-[var(--text-primary)]">Programar pago en día</span>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <CalendarDays size={17} strokeWidth={1.9} />
                    <span className="type-body font-medium text-[var(--text-primary)]">{scheduleDay}</span>
                  </div>
                </button>
              </div>

              {/* Recordatorio de pago */}
              <div className="mt-8">
                <FormToggleRow
                  icon={<Bell size={16} />}
                  label="Recordatorio de pago"
                  checked={reminderEnabled}
                  onChange={setReminderEnabled}
                />

                {reminderEnabled && (
                  <>
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

                    <div className="border-b border-[var(--line)] py-3">
                      <button
                        type="button"
                        onClick={() => setShowTimePicker(true)}
                        className="flex w-full items-center gap-3"
                      >
                        <span className="shrink-0 text-white/55"><Clock size={16} /></span>
                        <span className="type-body text-[var(--text-primary)]">{reminderTime}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Cash back cuenta como pago */}
              <div className="mt-8">
                <FieldDivider />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="type-body font-semibold text-[var(--text-primary)]">Cash back cuenta como pago</p>
                    <p className="type-label mt-1 leading-snug text-[var(--text-secondary)]">
                      Cuando está habilitado, las recompensas de cashback reducirán tu saldo de tarjeta de crédito inmediatamente y se incluirán en los cálculos de pago de la tarjeta.
                    </p>
                  </div>
                  <ToggleSwitch checked={cashbackCountsAsPayment} onChange={setCashbackCountsAsPayment} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botón Aplicar — solo en modo automático */}
        {currentMode === "automatic" && (
          <div className="shrink-0 border-t border-white/[0.06] pb-6 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleApply}
              className="type-body h-14 w-full rounded-2xl bg-[var(--accent)] font-semibold text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] transition hover:brightness-105 disabled:opacity-60"
            >
              {isSaving ? "Guardando…" : "Aplicar"}
            </button>
          </div>
        )}
      </div>

      {/* ── Pickers ── */}
      {showAccountPicker && (
        <AccountPickerSheet
          selected={fromAccountId}
          onSelect={(id) => setFromAccountId(id)}
          onClose={() => setShowAccountPicker(false)}
        />
      )}

      {showDayPicker && (
        <NumberPickerSheet
          title="Día del mes"
          value={scheduleDay}
          onSelect={(n) => setScheduleDay(n === 0 ? 1 : n)}
          onClose={() => setShowDayPicker(false)}
        />
      )}

      {showTimePicker && (
        <TimePickerSheet
          value={reminderTime}
          onSelect={setReminderTime}
          onClose={() => setShowTimePicker(false)}
        />
      )}
    </div>
  );
}
