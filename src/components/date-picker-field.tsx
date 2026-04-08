"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAYS_SHORT = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseISO(iso: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const parts = iso.split("-");
  const y = parseInt(parts[0] ?? "", 10);
  const m = parseInt(parts[1] ?? "", 10);
  const d = parseInt(parts[2] ?? "", 10);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "5 abr 2026" */
function formatDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return "";
  const month = MONTHS_ES[p.m - 1] ?? "";
  return `${p.d} ${month.slice(0, 3).toLowerCase()} ${p.y}`;
}

function currentTodayISO(): string {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

function getDaysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** 0 = Monday ... 6 = Sunday — Monday-first calendar */
function firstWeekdayOf(y: number, m: number): number {
  return (new Date(y, m - 1, 1).getDay() + 6) % 7;
}

// ─── Popup position ───────────────────────────────────────────────────────────

const POPUP_W = 304;
const POPUP_H = 328; // approximate, enough for 6-row months
const GAP = 8;

function computePosition(el: HTMLElement): CSSProperties {
  const rect = el.getBoundingClientRect();
  const VW = window.innerWidth;
  const VH = window.innerHeight;

  // Horizontal: align with left edge of trigger, clamp to viewport
  let left = rect.left;
  if (left + POPUP_W > VW - 8) left = VW - POPUP_W - 8;
  if (left < 8) left = 8;

  // Vertical: prefer below, fall back above
  const spaceBelow = VH - rect.bottom - GAP;
  const top =
    spaceBelow >= POPUP_H
      ? rect.bottom + GAP
      : Math.max(8, rect.top - POPUP_H - GAP);

  return { top, left, width: POPUP_W };
}

// ─── Component ────────────────────────────────────────────────────────────────

export type DatePickerFieldProps = {
  id: string;
  label: string;
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (v: string) => void;
  className?: string;
};

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  className = "",
}: DatePickerFieldProps) {
  const today = currentTodayISO();
  const parsed = parseISO(value);

  const [isOpen, setIsOpen] = useState(false);
  const [viewY, setViewY] = useState<number>(
    () => parsed?.y ?? new Date().getFullYear(),
  );
  const [viewM, setViewM] = useState<number>(
    () => parsed?.m ?? new Date().getMonth() + 1,
  );
  const [popupPos, setPopupPos] = useState<CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const recalcPosition = useCallback(() => {
    if (triggerRef.current) {
      setPopupPos(computePosition(triggerRef.current));
    }
  }, []);

  const open = useCallback(() => {
    // Sync calendar view to the currently selected date when opening
    const p = parseISO(value);
    if (p) {
      setViewY(p.y);
      setViewM(p.m);
    }
    recalcPosition();
    setIsOpen(true);
  }, [recalcPosition, value]);

  const close = useCallback(() => setIsOpen(false), []);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", recalcPosition, { capture: true, passive: true });
    window.addEventListener("resize", recalcPosition, { passive: true });
    return () => {
      window.removeEventListener("scroll", recalcPosition, { capture: true });
      window.removeEventListener("resize", recalcPosition);
    };
  }, [isOpen, recalcPosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popupRef.current?.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler, { capture: true });
    return () => document.removeEventListener("mousedown", handler, { capture: true });
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // ── Month navigation ──────────────────────────────────────────────────────

  const prevMonth = useCallback(() => {
    setViewM((m) => {
      if (m === 1) {
        setViewY((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewM((m) => {
      if (m === 12) {
        setViewY((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  // ── Calendar grid ─────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(viewY, viewM);
  const offset = firstWeekdayOf(viewY, viewM);

  const cells: (number | null)[] = Array.from<null>({ length: offset }).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = MONTHS_ES[viewM - 1] ?? "";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Field row (entire width is clickable) ────────────────────────── */}
      <div className={`border-b border-[var(--line)] py-3 ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          id={id}
          onClick={isOpen ? close : open}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="shrink-0 text-white/55">
            <CalendarDays size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[0.74rem] font-medium tracking-[0.01em] text-[var(--text-secondary)]">
              {label}
            </p>
            <p
              className={`type-body ${
                value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {value ? formatDisplay(value) : "Seleccionar fecha"}
            </p>
          </div>
        </button>
      </div>

      {/* ── Calendar popup — fixed so it escapes overflow:hidden parents ─── */}
      {isOpen ? (
        <div
          ref={popupRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          style={{ position: "fixed", zIndex: 9999, ...popupPos }}
          className="datepicker-popup rounded-[1.4rem] border border-white/10 bg-[var(--surface)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.58)]"
        >
          {/* Month / year header */}
          <div className="mb-3 flex items-center justify-between px-0.5">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Mes anterior"
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-90"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-[0.88rem] font-semibold tracking-tight text-[var(--text-primary)]">
              {monthName} {viewY}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Mes siguiente"
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-90"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1.5 grid grid-cols-7">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-[0.62rem] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) {
                return <div key={`e-${i}`} className="h-9 w-9" />;
              }

              const iso = toISO(viewY, viewM, day);
              const isSelected = iso === value;
              const isToday = iso === today;

              let dayClass =
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[0.82rem] font-medium transition-all duration-100 ";

              if (isSelected) {
                dayClass +=
                  "bg-[var(--accent)] text-white scale-105 shadow-[0_4px_16px_rgba(41,187,243,0.42)]";
              } else if (isToday) {
                dayClass +=
                  "text-[var(--accent)] ring-1 ring-inset ring-[rgba(41,187,243,0.45)] hover:bg-[rgba(41,187,243,0.09)]";
              } else {
                dayClass += "text-[var(--text-primary)] hover:bg-white/8";
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    close();
                  }}
                  className={dayClass}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
