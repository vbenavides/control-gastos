"use client";

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Bus,
  Baby,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Smartphone,
  Stethoscope,
  TrainFront,
  Tv,
  Utensils,
  Wine,
  Zap,
  Gamepad2,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { CircularProgress, ProgressBar, SurfaceCard } from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { sortTransactionsDesc } from "@/lib/date";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";

// ─── Icon registry (espejo del de categories-screen) ─────────────────────────

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

function resolveIcon(iconKey: string | undefined): LucideIcon {
  if (iconKey && ICON_MAP[iconKey]) return ICON_MAP[iconKey]!;
  return BookOpen;
}

/** Sub-componente estable fuera del render — usa createElement para evitar variable capitalizada */
function CategoryIconBadge({
  iconKey,
  accent,
  size = 26,
}: {
  iconKey: string | undefined;
  accent: string;
  size?: number;
}) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl"
      style={{
        width: size * 2,
        height: size * 2,
        backgroundColor: `${accent}28`,
        color: accent,
      }}
    >
      {React.createElement(resolveIcon(iconKey), { size, strokeWidth: 1.9 })}
    </div>
  );
}

// ─── Month helpers ────────────────────────────────────────────────────────────

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatTxDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CategoryDetailScreen() {
  const params = useParams<{ categoryId: string }>();
  const searchParams = useSearchParams();
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";

  const now = new Date();
  const initMonth = parseInt(searchParams.get("month") ?? String(now.getMonth()), 10);
  const initYear  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()), 10);

  const [viewMonth, setViewMonth] = useState(Number.isNaN(initMonth) ? now.getMonth() : initMonth);
  const [viewYear,  setViewYear]  = useState(Number.isNaN(initYear)  ? now.getFullYear() : initYear);

  const { categories, isLoading: catLoading } = useCategories();
  const { transactions } = useTransactions();
  const { accounts } = useDebitAccounts();

  const prevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const category = useMemo(
    () => (categories ?? []).find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  // Transacciones de esta categoría en el mes visto
  const catTransactions = useMemo(() => {
    if (!category) return [];
    return sortTransactionsDesc(
      (transactions ?? []).filter((t) => {
        if (t.category !== category.name) return false;
        const d = new Date(t.date);
        return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
      })
    );
  }, [transactions, category, viewMonth, viewYear]);

  const accountMap = useMemo(() => {
    const m = new Map<string, string>();
    (accounts ?? []).forEach((a) => m.set(a.id, a.name));
    return m;
  }, [accounts]);

  const spent   = catTransactions.reduce((s, t) => s + t.amount, 0);
  const budget  = category?.budget ?? 0;
  const remaining = budget - spent;
  const progress  = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

  const monthLabel = `${MONTHS_ES[viewMonth] ?? ""} ${viewYear}`;

  // ── Estados de carga / error ──────────────────────────────────────────────

  if (catLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="flex min-h-dvh items-center justify-center">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 md:px-6">
          <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-2">
            <Link href="/categorias" aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]">
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-medium">Categoría</h1>
            <div aria-hidden="true" />
          </header>
          <div className="flex flex-1 items-center justify-center text-[var(--text-secondary)]">
            Categoría no encontrada.
          </div>
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-[36rem] px-4 pb-10 md:max-w-[680px] md:px-6 lg:max-w-[860px] lg:px-8">

        {/* ── Header sticky ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-2">
          <Link
            href="/categorias"
            aria-label="Volver a presupuesto"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)] transition hover:bg-white/5"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title truncate text-center font-semibold text-[var(--text-primary)]">
            {category.name}
          </h1>
          <div aria-hidden="true" />
        </header>

        <div className="space-y-5 pt-2">

          {/* ── Summary card ────────────────────────────────────────────── */}
          <SurfaceCard className="flex items-center gap-5 px-5 py-5">
            {/* Icon badge */}
            <CategoryIconBadge iconKey={category.iconKey} accent={category.accent} size={24} />

            {/* Progress ring + budget info */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="type-label font-semibold text-[var(--text-secondary)]">
                  Presupuesto mensual
                </span>
                <span className="type-body font-semibold text-[var(--text-primary)]">
                  {formatAmountCLP(budget)}
                </span>
              </div>
              <ProgressBar value={progress} color={category.accent} />
              <div className="flex items-center justify-between gap-2 text-[0.8rem]">
                <span className="text-[var(--text-secondary)]">
                  Gastado{" "}
                  <span style={{ color: category.accent }} className="font-semibold">
                    {formatAmountCLP(spent)}
                  </span>
                </span>
                <span className="text-[var(--text-secondary)]">
                  {formatAmountCLP(remaining)} restante
                </span>
              </div>
            </div>

            {/* Circular % */}
            <CircularProgress
              value={progress}
              center={
                <span className="text-[0.78rem] font-bold" style={{ color: category.accent }}>
                  {progress} %
                </span>
              }
              className="h-[4.25rem] w-[4.25rem] shrink-0"
              innerClassName="h-[3.35rem] w-[3.35rem]"
            />
          </SurfaceCard>

          {/* ── Month nav ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="type-body font-semibold text-[var(--text-primary)]">{monthLabel}</p>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* ── Transaction list ────────────────────────────────────────── */}
          {catTransactions.length === 0 ? (
            <div className="rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-10 text-center">
              <p className="type-body text-[var(--text-secondary)]">
                Sin movimientos en {monthLabel}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {catTransactions.map((tx) => {
                const accountName = accountMap.get(tx.accountId);
                return (
                  <Link
                    key={tx.id}
                    href={`/cuentas/debito/${tx.accountId}/transaccion/${tx.id}`}
                    prefetch={true}
                    className="block overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] transition hover:border-white/[0.11]"
                  >
                    {/* Date row */}
                    <div className="flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 text-[0.75rem] text-white/84 md:min-h-[2.2rem] md:px-4">
                      <span>{formatTxDate(tx.date)}</span>
                      <Check size={14} strokeWidth={2.3} className="shrink-0" />
                    </div>
                    {/* Amount row */}
                    <div className="flex min-h-[4rem] items-center gap-3 px-3 py-3 md:px-4">
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem]"
                        style={{ backgroundColor: tx.iconBackground, color: tx.iconColor }}
                      >
                        <ShoppingCart size={15} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="type-body truncate text-[var(--text-primary)]">{tx.description}</p>
                        {accountName ? (
                          <p className="type-label mt-0.5 text-white/70">{accountName}</p>
                        ) : null}
                      </div>
                      <p className="type-body shrink-0 font-semibold text-[var(--text-primary)]">
                        {formatAmountCLP(tx.amount)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
