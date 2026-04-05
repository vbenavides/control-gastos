"use client";

import { BookOpen, ChevronLeft, ChevronRight, HeartPulse } from "lucide-react";
import { useMemo } from "react";

import { CircularProgress, ProgressBar, SurfaceCard } from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";

const CATEGORY_ICONS = [BookOpen, HeartPulse];

export function CategoriesScreen() {
  const { categories } = useCategories();
  const { transactions } = useTransactions();

  // Gasto por categoría en el mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (transactions ?? []).forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    });
    return map;
  }, [transactions, currentMonth, currentYear]);

  const totalBudget = useMemo(
    () => (categories ?? []).reduce((sum, c) => sum + c.budget, 0),
    [categories],
  );

  const totalSpent = useMemo(
    () => Array.from(spentByCategory.values()).reduce((sum, v) => sum + v, 0),
    [spentByCategory],
  );

  const remaining = totalBudget - totalSpent;
  const progressPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Nombre del mes actual
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5 pt-2 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="type-page-title font-medium">{monthLabel}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white/90"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white/90"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <SurfaceCard className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6 md:py-6">
        <CircularProgress
          value={progressPct}
          center={<span className="text-lg font-semibold">{progressPct} %</span>}
        />
        <div className="space-y-2">
          <p className="type-body-strong text-[var(--text-primary)]">Restante</p>
          <p className="type-display font-semibold text-[var(--text-primary)]">
            {formatAmountCLP(remaining)}
          </p>
          <div className="type-body flex flex-wrap items-center gap-2 text-[var(--text-secondary)]">
            <span>Gastado {formatAmountCLP(totalSpent)} de</span>
            <span className="type-body rounded-full bg-[var(--accent-soft)] px-3 py-1 font-medium text-[var(--accent)]">
              {formatAmountCLP(totalBudget)}
            </span>
          </div>
        </div>
      </SurfaceCard>

      <div className="border-b border-[var(--line)] pb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="type-body-strong font-semibold">Sin grupo</p>
            <p className="type-body mt-1 text-[var(--text-secondary)]">0 transacciones</p>
          </div>
          <div className="text-right">
            <p className="type-display font-semibold">$0</p>
            <p className="type-body mt-1 text-[var(--text-secondary)]">
              {formatAmountCLP(remaining)} restante
            </p>
          </div>
        </div>
      </div>

      {(categories ?? []).length === 0 ? (
        <div className="type-body rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-6 text-center text-[var(--text-secondary)]">
          No hay categorías todavía.
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {(categories ?? []).map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length] ?? BookOpen;
            const spent = spentByCategory.get(category.name) ?? 0;
            const catRemaining = category.budget - spent;
            const catProgress =
              category.budget > 0
                ? Math.min(Math.round((spent / category.budget) * 100), 100)
                : 0;

            return (
              <SurfaceCard key={category.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-13 w-13 place-items-center rounded-2xl"
                    style={{ backgroundColor: `${category.accent}33`, color: category.accent }}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="type-body-strong font-medium text-[var(--text-primary)]">
                          {category.name}
                        </p>
                        <p className="type-label text-[var(--text-secondary)]">0 transacciones</p>
                      </div>
                      <div className="text-right">
                        <p className="type-body-strong font-medium text-[var(--text-primary)]">
                          {formatAmountCLP(spent)} de {formatAmountCLP(category.budget)}
                        </p>
                        <p className="type-label text-[var(--text-secondary)]">
                          {formatAmountCLP(catRemaining)} restante
                        </p>
                      </div>
                    </div>
                    <ProgressBar value={catProgress} color={category.accent} />
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
