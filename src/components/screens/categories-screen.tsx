"use client";

import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Music,
  Plane,
  PiggyBank,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tv,
  Utensils,
  Zap,
  Shirt,
  PawPrint,
  Baby,
  Wine,
  Landmark,
  Gamepad2,
  Scissors,
  Stethoscope,
  Bus,
  TrainFront,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { CircularProgress, ProgressBar, SurfaceCard } from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";

// ─── Icon registry ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  "utensils": Utensils,
  "shopping-cart": ShoppingCart,
  "car": Car,
  "bus": Bus,
  "train": TrainFront,
  "house": House,
  "heart-pulse": HeartPulse,
  "stethoscope": Stethoscope,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  "music": Music,
  "tv": Tv,
  "gamepad": Gamepad2,
  "shopping-bag": ShoppingBag,
  "piggy-bank": PiggyBank,
  "coffee": Coffee,
  "plane": Plane,
  "briefcase": Briefcase,
  "smartphone": Smartphone,
  "paw-print": PawPrint,
  "baby": Baby,
  "gift": Gift,
  "landmark": Landmark,
  "zap": Zap,
  "shirt": Shirt,
  "wine": Wine,
  "dumbbell": Dumbbell,
  "scissors": Scissors,
};

// Ciclo de fallback para categorías sin iconKey
const FALLBACK_CYCLE: LucideIcon[] = [
  Utensils, Car, House, HeartPulse, GraduationCap,
  Music, ShoppingBag, PiggyBank, Coffee, Plane,
  Briefcase, Tv, BookOpen, Dumbbell, Smartphone,
  Gift, Zap, PawPrint, Wine, Gamepad2,
];

function resolveIcon(iconKey: string | undefined, fallbackIndex: number): LucideIcon {
  if (iconKey) {
    const found = ICON_MAP[iconKey];
    if (found) return found;
  }
  return FALLBACK_CYCLE[fallbackIndex % FALLBACK_CYCLE.length] ?? Utensils;
}

// ─── Month helpers ────────────────────────────────────────────────────────────

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CategoriesScreen() {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { categories, isLoading: catLoading } = useCategories();
  const { transactions } = useTransactions();

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // ── Aggregate transactions for viewed month ───────────────────────────────

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (transactions ?? []).forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) return;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return map;
  }, [transactions, viewMonth, viewYear]);

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (transactions ?? []).forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) return;
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    });
    return map;
  }, [transactions, viewMonth, viewYear]);

  const totalBudget = useMemo(
    () => (categories ?? []).reduce((sum, c) => sum + c.budget, 0),
    [categories],
  );

  const totalSpent = useMemo(
    () => Array.from(spentByCategory.values()).reduce((sum, v) => sum + v, 0),
    [spentByCategory],
  );

  const remaining = totalBudget - totalSpent;
  const progressPct =
    totalBudget > 0
      ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
      : 0;

  const monthLabel = `${MONTHS_ES[viewMonth] ?? ""} ${viewYear}`;
  const totalTx = Array.from(countByCategory.values()).reduce((s, v) => s + v, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  if (catLoading) {
    return (
      <div className="mx-auto w-full max-w-[1080px] pt-4">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5 pb-8 pt-2 md:space-y-6">

      {/* ── Month navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="type-page-title font-medium text-[var(--text-primary)]">
          {monthLabel}
        </h1>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Mes anterior"
            className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Mes siguiente"
            className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <SurfaceCard className="flex items-center gap-5 px-5 py-5 md:px-7 md:py-6">
        <CircularProgress
          value={progressPct}
          center={
            <span className="text-[0.9rem] font-semibold text-[var(--text-primary)]">
              {progressPct} %
            </span>
          }
          className="h-[5.5rem] w-[5.5rem] shrink-0"
          innerClassName="h-[4.5rem] w-[4.5rem]"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            Restante
          </p>
          <p className="type-display font-semibold leading-none text-[var(--text-primary)]">
            {formatAmountCLP(remaining)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[0.875rem] text-[var(--text-secondary)]">
            <span>Gastado {formatAmountCLP(totalSpent)} de</span>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-0.5 text-[0.82rem] font-semibold text-[var(--accent)]">
              {formatAmountCLP(totalBudget)}
            </span>
          </div>
        </div>
      </SurfaceCard>

      {/* ── Group header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-[var(--line)] pb-4 pt-1">
        <div>
          <p className="type-body font-semibold text-[var(--text-primary)]">Sin grupo</p>
          <p className="type-label mt-0.5 text-[var(--text-secondary)]">
            {totalTx} {totalTx === 1 ? "transacción" : "transacciones"}
          </p>
        </div>
        <div className="text-right">
          <p className="type-body font-semibold text-[var(--text-primary)]">
            {formatAmountCLP(totalSpent)}
          </p>
          <p className="type-label mt-0.5 text-[var(--text-secondary)]">
            {formatAmountCLP(remaining)} restante
          </p>
        </div>
      </div>

      {/* ── Category cards ───────────────────────────────────────────────── */}
      {(categories ?? []).length === 0 ? (
        <div className="type-body rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-8 text-center text-[var(--text-secondary)]">
          No hay categorías todavía.
        </div>
      ) : (
        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-3">
          {(categories ?? []).map((category, index) => {
            const Icon = resolveIcon(category.iconKey, index);
            const spent = spentByCategory.get(category.name) ?? 0;
            const catRemaining = category.budget - spent;
            const catProgress =
              category.budget > 0
                ? Math.min(Math.round((spent / category.budget) * 100), 100)
                : 0;
            const txCount = countByCategory.get(category.name) ?? 0;

            const detailHref = `/categorias/${category.id}?month=${viewMonth}&year=${viewYear}`;

            return (
              <Link
                key={category.id}
                href={detailHref}
                prefetch={true}
                className="block transition hover:opacity-90"
              >
                <SurfaceCard className="px-4 py-4">
                  <div className="flex items-start gap-3.5">
                    {/* Colored icon badge */}
                    <div
                      className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-2xl"
                      style={{
                        backgroundColor: `${category.accent}28`,
                        color: category.accent,
                      }}
                    >
                      <Icon size={24} strokeWidth={1.9} />
                    </div>

                    {/* Info + progress */}
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="type-body truncate font-semibold text-[var(--text-primary)]">
                            {category.name}
                          </p>
                          <p className="type-label mt-0.5 text-[var(--text-secondary)]">
                            {txCount} {txCount === 1 ? "transacción" : "transacciones"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="type-label font-semibold text-[var(--text-primary)]">
                            {formatAmountCLP(spent)} de {formatAmountCLP(category.budget)}
                          </p>
                          <p className="type-helper mt-0.5 text-[var(--text-secondary)]">
                            {formatAmountCLP(catRemaining)} restante
                          </p>
                        </div>
                      </div>

                      <ProgressBar value={catProgress} color={category.accent} />
                    </div>
                  </div>
                </SurfaceCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
