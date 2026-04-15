"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { CalendarModal } from "@/components/date-picker-field";
import type { Category, TransactionKind } from "@/lib/models";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function getDefaultDates(): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setFullYear(from.getFullYear(), from.getMonth() - 1, from.getDate());
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodPreset = "last-month" | "this-month" | "this-year" | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "last-month": "Mes pasado",
  "this-month": "Este mes",
  "this-year": "Este año",
  "custom": "Personalizado",
};

export const PERIOD_PRESETS = ["last-month", "this-month", "this-year", "custom"] as const;

export const TRANSACTION_KINDS: { kind: TransactionKind; label: string }[] = [
  { kind: "expense", label: "Gasto" },
  { kind: "payment", label: "Pago" },
  { kind: "income", label: "Ingreso" },
  { kind: "transfer", label: "Transferencia" },
  { kind: "cardPayment", label: "Pago de Tarjeta" },
  { kind: "refund", label: "Reembolso" },
  { kind: "installments", label: "Compra a meses" },
  { kind: "cashback", label: "Cashback" },
];

export type RecurringFilter = "all" | "yes" | "no";
export type AutoPayFilter = "all" | "yes" | "no";

export interface FilterState {
  period: PeriodPreset;
  dateFrom: Date;
  dateTo: Date;
  accountIds: string[];
  kinds: TransactionKind[];
  categoryIds: string[];
  recurring: RecurringFilter;
  autoPay: AutoPayFilter;
}

export function getDefaultFilterState(initialAccountId?: string): FilterState {
  const { from, to } = getDefaultDates();
  return {
    period: "custom",
    dateFrom: from,
    dateTo: to,
    accountIds: initialAccountId ? [initialAccountId] : [],
    kinds: [],
    categoryIds: [],
    recurring: "all",
    autoPay: "all",
  };
}

export function applyPreset(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  if (preset === "last-month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to };
  }
  if (preset === "this-month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
  if (preset === "this-year") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { from, to };
  }
  return getDefaultDates();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition",
        selected
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--app-bg)]"
          : "border-white/10 bg-white/[0.05] text-[var(--text-primary)] hover:border-white/16 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function CheckboxRow({
  checked,
  indeterminate,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-3 py-1"
    >
      <span
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
          checked || indeterminate
            ? "border-[var(--accent)] bg-[var(--accent)]"
            : "border-white/20 bg-transparent",
        ].join(" ")}
      >
        {(checked || indeterminate) && (
          <Check size={12} strokeWidth={3} className="text-[var(--app-bg)]" />
        )}
      </span>
      <span className="type-label text-[var(--text-primary)]">{label}</span>
    </button>
  );
}

// ─── Sheet animation ──────────────────────────────────────────────────────────

export function useSheetAnimation(onClose: () => void) {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setIsVisible(true));
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss]);

  return { isVisible, dismiss };
}

// ─── Period dropdown ──────────────────────────────────────────────────────────

export function PeriodDropdown({
  anchorRef,
  value,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  value: PeriodPreset;
  onSelect: (p: PeriodPreset) => void;
  onClose: () => void;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function update() {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [anchorRef, onClose]);

  if (!rect) return null;

  const top = rect.top - 8;
  const left = rect.left;
  const width = rect.width;

  return (
    <div
      ref={dropRef}
      className="fixed z-[200] overflow-hidden rounded-xl border border-white/10 bg-[var(--surface-strong)] shadow-2xl"
      style={{
        bottom: `calc(100dvh - ${top}px)`,
        left,
        width,
      }}
    >
      {PERIOD_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => { onSelect(preset); onClose(); }}
          className={[
            "flex w-full items-center justify-between px-4 py-3 text-[0.9rem] transition hover:bg-white/[0.06]",
            value === preset
              ? "font-semibold text-[var(--text-primary)]"
              : "font-medium text-[var(--text-secondary)]",
          ].join(" ")}
        >
          <span>{PERIOD_LABELS[preset]}</span>
          {value === preset && (
            <Check size={15} strokeWidth={2.5} className="text-[var(--accent)]" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Filter sheet ─────────────────────────────────────────────────────────────

export function FilterSheet({
  accounts,
  expenseCategories,
  incomeCategories,
  draft,
  setDraft,
  onApply,
  onClose,
}: {
  accounts: { id: string; name: string }[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  draft: FilterState;
  setDraft: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
  onClose: () => void;
  initialAccountId?: string;
}) {
  const { isVisible, dismiss } = useSheetAnimation(onClose);
  const periodBtnRef = useRef<HTMLButtonElement>(null);
  const [periodDropOpen, setPeriodDropOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<"from" | "to" | null>(null);

  function clearFilters() {
    setDraft(getDefaultFilterState());
  }

  function toggleAccount(id: string) {
    setDraft((prev) => ({
      ...prev,
      accountIds: prev.accountIds.includes(id)
        ? prev.accountIds.filter((a) => a !== id)
        : [...prev.accountIds, id],
    }));
  }

  function toggleKind(kind: TransactionKind) {
    setDraft((prev) => ({
      ...prev,
      kinds: prev.kinds.includes(kind)
        ? prev.kinds.filter((k) => k !== kind)
        : [...prev.kinds, kind],
    }));
  }

  function toggleCategory(id: string) {
    setDraft((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  function toggleAllExpense() {
    const allIds = expenseCategories.map((c) => c.id);
    const allSelected = allIds.every((id) => draft.categoryIds.includes(id));
    setDraft((prev) => {
      const incomeIds = prev.categoryIds.filter((id) =>
        incomeCategories.some((c) => c.id === id),
      );
      return {
        ...prev,
        categoryIds: allSelected ? incomeIds : [...incomeIds, ...allIds],
      };
    });
  }

  function toggleAllIncome() {
    const allIds = incomeCategories.map((c) => c.id);
    const allSelected = allIds.every((id) => draft.categoryIds.includes(id));
    setDraft((prev) => {
      const expenseIds = prev.categoryIds.filter((id) =>
        expenseCategories.some((c) => c.id === id),
      );
      return {
        ...prev,
        categoryIds: allSelected ? expenseIds : [...expenseIds, ...allIds],
      };
    });
  }

  function selectPreset(preset: PeriodPreset) {
    const { from, to } = preset === "custom" ? getDefaultDates() : applyPreset(preset);
    setDraft((prev) => ({ ...prev, period: preset, dateFrom: from, dateTo: to }));
  }

  const allExpenseSelected =
    expenseCategories.length > 0 &&
    expenseCategories.every((c) => draft.categoryIds.includes(c.id));
  const someExpenseSelected =
    expenseCategories.some((c) => draft.categoryIds.includes(c.id)) && !allExpenseSelected;

  const allIncomeSelected =
    incomeCategories.length > 0 &&
    incomeCategories.every((c) => draft.categoryIds.includes(c.id));
  const someIncomeSelected =
    incomeCategories.some((c) => draft.categoryIds.includes(c.id)) && !allIncomeSelected;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <button
          type="button"
          aria-label="Cerrar filtros"
          className={[
            "absolute inset-0 transition-[background-color] duration-200",
            isVisible ? "bg-black/55" : "bg-black/0",
          ].join(" ")}
          onClick={dismiss}
        />

        {/* Sheet panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtrar Transacciones"
          className={[
            "relative z-10 flex max-h-[90svh] flex-col",
            "rounded-t-[1.4rem] bg-[var(--app-bg-elevated)]",
            "border-t border-x border-[var(--line)]",
            "shadow-[0_-20px_60px_rgba(0,0,0,0.55)]",
            "transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
            "sm:mx-auto sm:w-full sm:max-w-[640px] lg:max-w-[720px]",
          ].join(" ")}
          style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
        >
          {/* Handle */}
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-[3px] w-10 rounded-full bg-white/20" />
          </div>

          {/* Fixed header */}
          <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-2">
            <h3 className="type-subsection-title font-semibold text-[var(--text-primary)]">
              Filtrar Transacciones
            </h3>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--text-primary)] transition hover:bg-white/[0.08]"
            >
              Limpiar
            </button>
          </div>
          <div className="h-px shrink-0 bg-[var(--line)]" />

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">

            {/* ── Período ── */}
            <div>
              <p className="type-label mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Periodo
              </p>
              <button
                ref={periodBtnRef}
                type="button"
                onClick={() => setPeriodDropOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[0.9rem] font-medium text-[var(--text-primary)] transition hover:bg-white/[0.08]"
              >
                <span>{PERIOD_LABELS[draft.period]}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={[
                    "shrink-0 text-[var(--text-secondary)] transition-transform duration-200",
                    periodDropOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {/* Date pickers */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="type-helper mb-1.5 text-[var(--text-tertiary)]">Desde</p>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen("from")}
                    className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-left transition hover:bg-white/[0.08]"
                  >
                    <CalendarDays size={14} strokeWidth={2} className="shrink-0 text-[var(--accent)]" />
                    <span className="flex-1 truncate text-[0.85rem] text-[var(--text-primary)]">
                      {formatDateLabel(draft.dateFrom)}
                    </span>
                  </button>
                </div>
                <div>
                  <p className="type-helper mb-1.5 text-[var(--text-tertiary)]">Hasta</p>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen("to")}
                    className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-left transition hover:bg-white/[0.08]"
                  >
                    <CalendarDays size={14} strokeWidth={2} className="shrink-0 text-[var(--accent)]" />
                    <span className="flex-1 truncate text-[0.85rem] text-[var(--text-primary)]">
                      {formatDateLabel(draft.dateTo)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Calendar modals */}
              {datePickerOpen === "from" && (
                <CalendarModal
                  value={toInputDate(draft.dateFrom)}
                  label="Fecha desde"
                  onAccept={(iso) => {
                    setDraft((prev) => ({
                      ...prev,
                      period: "custom",
                      dateFrom: fromInputDate(iso),
                    }));
                    setDatePickerOpen(null);
                  }}
                  onCancel={() => setDatePickerOpen(null)}
                />
              )}
              {datePickerOpen === "to" && (
                <CalendarModal
                  value={toInputDate(draft.dateTo)}
                  label="Fecha hasta"
                  onAccept={(iso) => {
                    setDraft((prev) => ({
                      ...prev,
                      period: "custom",
                      dateTo: fromInputDate(iso),
                    }));
                    setDatePickerOpen(null);
                  }}
                  onCancel={() => setDatePickerOpen(null)}
                />
              )}
            </div>

            {/* ── Cuentas ── */}
            {accounts.length > 0 && (
              <div>
                <p className="type-label mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Cuentas
                </p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    label="Todos"
                    selected={draft.accountIds.length === 0}
                    onClick={() => setDraft((prev) => ({ ...prev, accountIds: [] }))}
                  />
                  {accounts.map((acc) => (
                    <FilterChip
                      key={acc.id}
                      label={acc.name}
                      selected={draft.accountIds.includes(acc.id)}
                      onClick={() => toggleAccount(acc.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Tipos de transacción ── */}
            <div>
              <p className="type-label mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Tipos de transacción
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="Todos"
                  selected={draft.kinds.length === 0}
                  onClick={() => setDraft((prev) => ({ ...prev, kinds: [] }))}
                />
                {TRANSACTION_KINDS.map(({ kind, label }) => (
                  <FilterChip
                    key={kind}
                    label={label}
                    selected={draft.kinds.includes(kind)}
                    onClick={() => toggleKind(kind)}
                  />
                ))}
              </div>
            </div>

            {/* ── Categorías ── */}
            <div>
              <p className="type-label mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Categorías
              </p>
              <div className="mb-3">
                <FilterChip
                  label="Todos"
                  selected={draft.categoryIds.length === 0}
                  onClick={() => setDraft((prev) => ({ ...prev, categoryIds: [] }))}
                />
              </div>

              {expenseCategories.length > 0 && (
                <div className="mb-4">
                  <CheckboxRow
                    checked={allExpenseSelected}
                    indeterminate={someExpenseSelected}
                    label="Sin grupo"
                    onChange={toggleAllExpense}
                  />
                  <div className="mt-2 flex flex-wrap gap-2 pl-8">
                    {expenseCategories.map((cat: Category) => (
                      <FilterChip
                        key={cat.id}
                        label={cat.name}
                        selected={draft.categoryIds.includes(cat.id)}
                        onClick={() => toggleCategory(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {incomeCategories.length > 0 && (
                <div>
                  <CheckboxRow
                    checked={allIncomeSelected}
                    indeterminate={someIncomeSelected}
                    label="Categorías de ingreso"
                    onChange={toggleAllIncome}
                  />
                  <div className="mt-2 flex flex-wrap gap-2 pl-8">
                    {incomeCategories.map((cat: Category) => (
                      <FilterChip
                        key={cat.id}
                        label={cat.name}
                        selected={draft.categoryIds.includes(cat.id)}
                        onClick={() => toggleCategory(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Recurrente ── */}
            <div>
              <p className="type-label mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Recurrente
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "yes", "no"] as RecurringFilter[]).map((v) => (
                  <FilterChip
                    key={v}
                    label={v === "all" ? "Todos" : v === "yes" ? "Si" : "No"}
                    selected={draft.recurring === v}
                    onClick={() => setDraft((prev) => ({ ...prev, recurring: v }))}
                  />
                ))}
              </div>
            </div>

            {/* ── Pago Automático ── */}
            <div>
              <p className="type-label mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Pago Automático
              </p>
              <div className="flex flex-wrap gap-2">
                {(["all", "yes", "no"] as AutoPayFilter[]).map((v) => (
                  <FilterChip
                    key={v}
                    label={v === "all" ? "Todos" : v === "yes" ? "Si" : "No"}
                    selected={draft.autoPay === v}
                    onClick={() => setDraft((prev) => ({ ...prev, autoPay: v }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fixed footer */}
          <div className="shrink-0 border-t border-[var(--line)] px-5 pb-7 pt-4">
            <button
              type="button"
              onClick={() => { onApply(); dismiss(); }}
              className="type-body w-full rounded-[0.9rem] bg-[var(--accent)] py-[0.85rem] font-semibold text-white shadow-[0_8px_24px_rgba(41,187,243,0.18)] transition hover:brightness-105"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Period dropdown — portaled via fixed positioning to escape overflow */}
      {periodDropOpen && (
        <PeriodDropdown
          anchorRef={periodBtnRef}
          value={draft.period}
          onSelect={selectPreset}
          onClose={() => setPeriodDropOpen(false)}
        />
      )}
    </>
  );
}
