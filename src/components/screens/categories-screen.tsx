import { BookOpen, ChevronLeft, ChevronRight, HeartPulse } from "lucide-react";
import { categories, categorySummary } from "@/lib/mock-data";
import { CircularProgress, ProgressBar, SurfaceCard } from "@/components/ui-kit";

export function CategoriesScreen() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-5 pt-2 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[2rem] font-medium tracking-[-0.04em] md:text-[2.35rem]">Abr 2026</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white/90">
            <ChevronLeft size={24} />
          </button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white/90">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <SurfaceCard className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6 md:py-6">
        <CircularProgress value={12} center={<span className="text-lg font-semibold">0 %</span>} />
        <div className="space-y-2">
          <p className="text-xl text-[var(--text-primary)]">{categorySummary.label}</p>
          <p className="text-[2.2rem] font-semibold leading-none text-[var(--text-primary)]">
            {categorySummary.amount}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-lg text-[var(--text-secondary)]">
            <span>{categorySummary.spentText}</span>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-base font-medium text-[var(--accent)]">
              {categorySummary.total}
            </span>
          </div>
        </div>
      </SurfaceCard>

      <div className="border-b border-[var(--line)] pb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[1.7rem] font-semibold">Sin grupo</p>
            <p className="mt-1 text-lg text-[var(--text-secondary)]">0 transacciones</p>
          </div>
          <div className="text-right">
            <p className="text-[1.9rem] font-semibold">$0</p>
            <p className="mt-1 text-lg text-[var(--text-secondary)]">$185.000 restante</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {categories.map((category, index) => {
          const Icon = index === 0 ? BookOpen : HeartPulse;
          return (
            <SurfaceCard key={category.name} className="px-4 py-3">
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
                      <p className="text-[1.35rem] font-medium text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="text-[0.95rem] text-[var(--text-secondary)]">0 transacciones</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[1.35rem] font-medium text-[var(--text-primary)]">
                        {category.amount}
                      </p>
                      <p className="text-[0.95rem] text-[var(--text-secondary)]">{category.remaining}</p>
                    </div>
                  </div>
                  <ProgressBar value={category.progress} color={category.accent} />
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </div>
  );
}
