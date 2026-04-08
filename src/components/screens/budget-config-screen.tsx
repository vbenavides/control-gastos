"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatAmountCLP } from "@/lib/currency";
import { resolveIcon } from "@/lib/category-icons";
import { useCategories } from "@/lib/hooks/use-categories";
import { useBudgetSettings } from "@/lib/hooks/use-budget-settings";

// ─── Button class (identical to accounts screen "add" button) ─────────────────

const NEW_CATEGORY_CLASS =
  "type-body mx-auto flex min-h-[2.55rem] items-center justify-center rounded-full bg-[#0f2a39] px-9 font-medium text-[var(--accent)] transition hover:opacity-90";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-[1.8rem] w-[3.25rem] shrink-0 rounded-full p-[3px] transition-colors duration-200",
        checked ? "bg-[var(--accent)]" : "bg-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "block h-[1.25rem] w-[1.25rem] rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[1.45rem]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

// ─── Day picker sheet ─────────────────────────────────────────────────────────

// Stores 0 internally to mean "Último día del mes"
const DAY_ITEMS = [...Array.from({ length: 30 }, (_, i) => i + 1), 0] as const;

function formatResetDay(day: number): string {
  return day === 0 ? "Último día del mes" : String(day);
}

function DayPickerSheet({
  value,
  onClose,
  onSelect,
}: {
  value: number;
  onClose: () => void;
  onSelect: (day: number) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Slide-up animation on mount + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Scroll selected item into view once visible
  useEffect(() => {
    if (!isVisible) return;
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [isVisible]);

  // Keyboard close
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

  function handleSelect(day: number) {
    onSelect(day);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar selector de día"
        className={[
          "absolute inset-0 transition-[background-color] duration-200",
          isVisible ? "bg-black/55" : "bg-black/0",
        ].join(" ")}
        onClick={handleClose}
      />

      {/* Sheet — slides up from bottom, centered on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar día de reinicio"
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
        {/* ── Fixed header ─────────────────────────────────────────── */}
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

        {/* ── Scrollable list ──────────────────────────────────────── */}
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
                  isLast
                    ? "text-[1rem] font-semibold"
                    : "text-[1.05rem] font-normal",
                  isSelected
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-primary)] hover:bg-white/[0.03]",
                ].join(" ")}
              >
                {formatResetDay(day)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function BudgetConfigScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useBudgetSettings();
  const { categories, update: updateCategory } = useCategories();

  // Only expense categories in the "Límites de gasto" section
  const expenseCategories = useMemo(
    () => (categories ?? []).filter((c) => (c.type ?? "expense") === "expense"),
    [categories],
  );

  const totalCategoryBudget = useMemo(
    () => expenseCategories.reduce((sum, c) => sum + c.budget, 0),
    [expenseCategories],
  );

  const remaining = settings.monthlyBudget - totalCategoryBudget;

  // ── Category budget inline editing ────────────────────────────────────────
  // ── Day picker state ──────────────────────────────────────────────────────
  const [showDayPicker, setShowDayPicker] = useState(false);

  // ── Category budget inline editing ────────────────────────────────────────
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catEditValue, setCatEditValue] = useState("");
  const catInputRef = useRef<HTMLInputElement>(null);

  function startEditCat(id: string, budget: number) {
    setEditingCatId(id);
    setCatEditValue(budget === 0 ? "" : String(budget));
    setTimeout(() => catInputRef.current?.focus(), 0);
  }

  async function commitEditCat(id: string) {
    const parsed = parseInt(catEditValue.replace(/\D/g, ""), 10);
    await updateCategory(id, { budget: isNaN(parsed) ? 0 : parsed });
    setEditingCatId(null);
    setCatEditValue("");
  }

  // ── Monthly budget inline editing ─────────────────────────────────────────
  const [editingMonthly, setEditingMonthly] = useState(false);
  const [monthlyValue, setMonthlyValue] = useState("");
  const monthlyInputRef = useRef<HTMLInputElement>(null);

  function startEditMonthly() {
    setEditingMonthly(true);
    setMonthlyValue(String(settings.monthlyBudget));
    setTimeout(() => monthlyInputRef.current?.focus(), 0);
  }

  function commitEditMonthly() {
    const parsed = parseInt(monthlyValue.replace(/\D/g, ""), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateSettings({ monthlyBudget: parsed });
    }
    setEditingMonthly(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative flex shrink-0 items-center justify-between px-2 pb-2 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-primary)] transition hover:bg-white/5"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[1rem] font-semibold">
          Presupuesto
        </h1>

        {/* Spacer */}
        <div className="h-11 w-11" aria-hidden="true" />
      </header>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] lg:max-w-[760px]">

          {/* ── 1. Día de reinicio del periodo ──────────────────────────── */}
          <section className="border-b border-[var(--line)] px-4 py-5">
            <h2 className="type-body font-semibold text-[var(--text-primary)]">
              Día de reinicio del periodo
            </h2>
            <p className="mt-1 text-[0.82rem] text-[var(--text-secondary)]">
              Selecciona el día del mes en que comienza tu presupuesto.
            </p>
            {/* Tappable row: opens day picker sheet */}
            <button
              type="button"
              onClick={() => setShowDayPicker(true)}
              className="mt-3 flex w-full items-center gap-2.5 text-[var(--text-primary)] transition hover:opacity-80"
            >
              <CalendarDays size={18} className="text-[var(--text-secondary)]" />
              <span className="text-[var(--text-primary)]">
                {formatResetDay(settings.resetDay)}
              </span>
            </button>
          </section>

          {/* ── 2. Incluir trans. programadas ───────────────────────────── */}
          <section className="flex items-start gap-4 border-b border-[var(--line)] px-4 py-5">
            <div className="flex-1">
              <h2 className="type-body font-semibold text-[var(--text-primary)]">
                Incluir trans. programadas en cálculo de gastado
              </h2>
              <p className="mt-1 text-[0.82rem] leading-snug text-[var(--text-secondary)]">
                Cuenta las transacciones programadas como si ya se hubieran gastado para mostrar
                un presupuesto restante más preciso.
              </p>
            </div>
            <Toggle
              checked={settings.includeScheduledTx}
              onChange={(v) => updateSettings({ includeScheduledTx: v })}
            />
          </section>

          {/* ── 3. Presupuesto Mensual ──────────────────────────────────── */}
          <section className="border-b border-[var(--line)] px-4 py-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="type-body font-semibold text-[var(--text-primary)]">
                  Presupuesto Mensual
                </h2>
                <p className="mt-1 text-[0.82rem] text-[var(--text-secondary)]">
                  Establece una cantidad total que deseas gastar cada mes.
                </p>
              </div>
              <Toggle
                checked={settings.monthlyBudgetEnabled}
                onChange={(v) => updateSettings({ monthlyBudgetEnabled: v })}
              />
            </div>

            {settings.monthlyBudgetEnabled && (
              <div className="mt-4 space-y-3">
                {/* Editable monthly amount */}
                {editingMonthly ? (
                  <input
                    ref={monthlyInputRef}
                    type="number"
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    onBlur={commitEditMonthly}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEditMonthly(); }}
                    className="type-subsection-title w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder="0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEditMonthly}
                    className="type-subsection-title font-semibold text-[var(--text-primary)]"
                  >
                    {formatAmountCLP(settings.monthlyBudget)}
                  </button>
                )}

                {/* Info box */}
                <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
                  <p className="text-[0.82rem] leading-relaxed text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatAmountCLP(totalCategoryBudget)}
                    </span>{" "}
                    asignado a categorías. El{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatAmountCLP(Math.max(0, remaining))}
                    </span>{" "}
                    restante puede asignarse a una categoría o dejarse libre para cualquier gasto.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── 4. Límites de gasto ─────────────────────────────────────── */}
          <section className="px-4 pb-10 pt-5">
            <h2 className="type-body font-semibold text-[var(--text-primary)]">
              Límites de gasto
            </h2>
            <p className="mt-1 text-[0.82rem] leading-snug text-[var(--text-secondary)]">
              Establece la cantidad máxima para gastar en las categorías que deseas limitar
              cada mes. Puedes personalizar esta cantidad por periodo más adelante.
            </p>

            {/* Group header */}
            <div className="mt-4 flex items-center justify-between py-1">
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Sin grupo
              </span>
              <span className="type-body font-semibold text-[var(--text-primary)]">
                {formatAmountCLP(totalCategoryBudget)}
              </span>
            </div>

            {/* Category rows */}
            <ul>
              {expenseCategories.map((cat, index) => {
                const Icon = resolveIcon(cat.iconKey, index);
                const isEditing = editingCatId === cat.id;

                return (
                  <li
                    key={cat.id}
                    className="flex items-center gap-3 border-t border-[var(--line)] py-[0.62rem]"
                  >
                    {/* Icon badge */}
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.6rem]"
                      style={{ backgroundColor: cat.accent }}
                      aria-hidden="true"
                    >
                      <Icon size={17} strokeWidth={1.9} color="#fff" />
                    </div>

                    {/* Name */}
                    <span className="flex-1 text-[0.95rem] text-[var(--text-primary)]">
                      {cat.name}
                    </span>

                    {/* Budget amount (editable) */}
                    {isEditing ? (
                      <input
                        ref={catInputRef}
                        type="number"
                        value={catEditValue}
                        onChange={(e) => setCatEditValue(e.target.value)}
                        onBlur={() => commitEditCat(cat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEditCat(cat.id);
                        }}
                        className="w-24 bg-transparent text-right text-[0.9rem] font-medium text-[var(--accent)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditCat(cat.id, cat.budget)}
                        className="shrink-0 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                      >
                        {formatAmountCLP(cat.budget)}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Nueva Categoría button */}
            <div className="mt-6">
              <Link
                href="/gestion/categorias/nueva?type=expense"
                className={NEW_CATEGORY_CLASS}
              >
                Nueva Categoría
              </Link>
            </div>
          </section>

        </div>
      </div>

      {/* ── Day picker bottom sheet ──────────────────────────────────── */}
      {showDayPicker && (
        <DayPickerSheet
          value={settings.resetDay}
          onClose={() => setShowDayPicker(false)}
          onSelect={(day) => updateSettings({ resetDay: day })}
        />
      )}
    </div>
  );
}
