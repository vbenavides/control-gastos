import { ChevronDown, ChevronLeft, ChevronRight, Filter, Landmark, ReceiptText } from "lucide-react";
import { calendarDays, calendarHeader } from "@/lib/mock-data";
import { EmptyState, Segmented, SmallIconButton, SurfaceCard } from "@/components/ui-kit";

const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];

export function CalendarScreen() {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 md:space-y-6">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[2rem] font-medium tracking-[-0.04em] md:text-[2.35rem]">{calendarHeader.month}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white/90">
            <ChevronLeft size={24} />
          </button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white/90">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <SurfaceCard className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex items-center gap-2">
          <Segmented items={["Balance", "Flujo de efectivo"]} className="flex-1" />
          <SmallIconButton>
            <Landmark size={18} />
          </SmallIconButton>
          <SmallIconButton>
            <Filter size={18} />
          </SmallIconButton>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-y-4 text-center">
          {weekdayLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="text-sm text-[var(--text-tertiary)]">
              {label}
            </span>
          ))}

          {calendarDays.map((entry, index) => (
            <div key={`${entry.day}-${index}`} className="space-y-1 py-1">
              <div
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-base ${
                  entry.selected
                    ? "border border-white/70 text-white"
                    : entry.muted
                      ? "text-white/18"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {entry.day}
              </div>
              <p className={`text-[0.72rem] ${entry.muted ? "text-white/18" : "text-white/28"}`}>
                33.210
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="px-5 py-4 md:px-6 md:py-5">
        <div className="grid grid-cols-[1fr_1fr_1.1fr_auto] items-center gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Balance al</p>
            <p className="mt-1 text-2xl font-semibold">{calendarHeader.balanceDate}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Cuentas</p>
            <p className="mt-1 text-2xl font-semibold">{calendarHeader.accounts}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Tarjetas de crédito</p>
            <p className="mt-1 text-2xl font-semibold">{calendarHeader.creditCards}</p>
          </div>
          <ChevronDown className="text-[var(--text-secondary)]" />
        </div>
      </SurfaceCard>

      <EmptyState icon={<ReceiptText size={26} />} title="Sin entradas aún" />
    </div>
  );
}
