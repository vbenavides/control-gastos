import { CalendarRange, Funnel, Search } from "lucide-react";
import { historyRange } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui-kit";

export function HistoryScreen() {
  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6 pt-6">
      <h1 className="type-page-title font-medium">Transacciones</h1>

      <div className="flex items-center gap-3">
        <button type="button" aria-label="Filtrar transacciones" className="text-white/90">
          <Funnel size={22} />
        </button>

        <button
          type="button"
          className="type-body flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] px-4 py-3 text-[var(--text-secondary)]"
        >
          <CalendarRange size={17} className="text-[var(--text-primary)]" />
          {historyRange}
        </button>
      </div>

      <p className="type-body-strong font-medium text-[var(--text-primary)]">0 transacciones</p>

      <EmptyState
        icon={<Search size={26} />}
        title="No se encontraron entradas"
        className="pt-28"
      />
    </div>
  );
}
