"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Filter, Landmark, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, Segmented, SmallIconButton, SurfaceCard } from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type CalDay = {
  day: number;
  muted: boolean;
  /** ISO date string "YYYY-MM-DD", null for muted days */
  dateKey: string | null;
};

function buildCalendarDays(year: number, month: number): CalDay[] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Dom … 6=Sáb
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: CalDay[] = [];

  // Días finales del mes anterior (apagados)
  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, muted: true, dateKey: null });
  }

  // Días del mes actual
  const mm = String(month + 1).padStart(2, "0");
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      muted: false,
      dateKey: `${year}-${mm}-${String(d).padStart(2, "0")}`,
    });
  }

  // Días iniciales del mes siguiente para completar la última fila
  const remainder = days.length % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      days.push({ day: d, muted: true, dateKey: null });
    }
  }

  return days;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CalendarScreen() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { accounts } = useDebitAccounts();
  const { cards } = useCreditCards();
  const { transactions } = useTransactions();

  // Grilla del mes visualizado
  const calDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // Totales diarios de transacciones del mes visualizado
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    const mm = String(viewMonth + 1).padStart(2, "0");

    (transactions ?? []).forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return;
      const key = `${viewYear}-${mm}-${String(d.getDate()).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + t.amount);
    });

    return map;
  }, [transactions, viewYear, viewMonth]);

  // Totales globales de cuentas y tarjetas
  const accountsTotal = useMemo(
    () => (accounts ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );

  const creditTotal = useMemo(
    () => (cards ?? []).reduce((sum, c) => sum + c.balance, 0),
    [cards],
  );

  // ¿Estamos viendo el mes actual? → marcar el día de hoy
  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const todayDay = now.getDate();

  // Último día del mes para el label de balance
  const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
  const balanceDateLabel = `${lastDay} ${MONTH_NAMES[viewMonth].toLowerCase()}`;

  // Hay transacciones en este mes para mostrar el empty state o no
  const hasMonthTransactions = calDays.some(
    (d) => d.dateKey !== null && (dailyTotals.get(d.dateKey) ?? 0) > 0,
  );

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 md:space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[2rem] font-medium tracking-[-0.04em] md:text-[2.35rem]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={goToPrev}
            className="grid h-10 w-10 place-items-center rounded-full text-white/90"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={goToNext}
            className="grid h-10 w-10 place-items-center rounded-full text-white/90"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* ── Grilla del calendario ── */}
      <SurfaceCard className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex items-center gap-2">
          <Segmented items={["Balance", "Flujo de efectivo"]} className="flex-1" />
          <SmallIconButton aria-label="Filtrar por cuenta">
            <Landmark size={18} />
          </SmallIconButton>
          <SmallIconButton aria-label="Filtrar">
            <Filter size={18} />
          </SmallIconButton>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-y-4 text-center">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={`wl-${i}`} className="text-sm text-[var(--text-tertiary)]">
              {label}
            </span>
          ))}

          {calDays.map((entry, i) => {
            const amount = entry.dateKey ? (dailyTotals.get(entry.dateKey) ?? 0) : 0;
            const isSelected = !entry.muted && isCurrentMonth && entry.day === todayDay;

            return (
              <div key={`cd-${i}`} className="space-y-1 py-1">
                <div
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-base ${
                    isSelected
                      ? "border border-white/70 text-white"
                      : entry.muted
                        ? "text-white/18"
                        : "text-[var(--text-primary)]"
                  }`}
                >
                  {entry.day}
                </div>
                <p
                  className={`text-[0.72rem] ${
                    entry.muted
                      ? "text-white/18"
                      : amount > 0
                        ? "text-white/60"
                        : "text-white/28"
                  }`}
                >
                  {entry.muted ? "\u00a0" : amount > 0 ? formatAmountCLP(amount) : ""}
                </p>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      {/* ── Resumen de balance ── */}
      <SurfaceCard className="px-5 py-4 md:px-6 md:py-5">
        <div className="grid grid-cols-[1fr_1fr_1.1fr_auto] items-center gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Balance al</p>
            <p className="mt-1 text-2xl font-semibold">{balanceDateLabel}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Cuentas</p>
            <p className="mt-1 text-2xl font-semibold">{formatAmountCLP(accountsTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Tarjetas de crédito</p>
            <p className="mt-1 text-2xl font-semibold">{formatAmountCLP(creditTotal)}</p>
          </div>
          <ChevronDown className="text-[var(--text-secondary)]" />
        </div>
      </SurfaceCard>

      {/* ── Empty state ── */}
      {!hasMonthTransactions ? (
        <EmptyState icon={<ReceiptText size={26} />} title="Sin entradas aún" />
      ) : null}
    </div>
  );
}
