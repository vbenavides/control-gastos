"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

/** Single-letter headers, Monday-first (L M X J V S D) */
const DAYS_HEADER = ["L", "M", "X", "J", "V", "S", "D"] as const;

/** Short weekday names, Sunday = index 0 */
const WEEKDAYS_SHORT = [
  "dom",
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
] as const;

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const YEAR_MIN = 2000;
const YEAR_MAX = 2040;

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

/** "5 abr 2026" — used in field row */
function formatDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return "";
  const month = MONTHS_ES[p.m - 1] ?? "";
  return `${p.d} ${month.slice(0, 3).toLowerCase()} ${p.y}`;
}

/** "mié, 8 abr" — used inside the modal header */
function formatLargeDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return "";
  const date = new Date(p.y, p.m - 1, p.d);
  const weekday = WEEKDAYS_SHORT[date.getDay()] ?? "";
  const month = MONTHS_SHORT[p.m - 1] ?? "";
  return `${weekday}, ${p.d} ${month}`;
}

function currentTodayISO(): string {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

function getDaysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** Monday-first offset: 0 = Mon … 6 = Sun */
function firstWeekdayOf(y: number, m: number): number {
  return (new Date(y, m - 1, 1).getDay() + 6) % 7;
}

/** "2026-04-08" → "8/4/2026" */
function isoToTextInput(iso: string): string {
  const p = parseISO(iso);
  if (!p) return "";
  return `${p.d}/${p.m}/${p.y}`;
}

/** "8/4/2026" → "2026-04-08" or null if invalid */
function parseTextInput(text: string): string | null {
  const parts = text.trim().split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0] ?? "", 10);
  const m = parseInt(parts[1] ?? "", 10);
  const y = parseInt(parts[2] ?? "", 10);
  if (!d || !m || !y || y < 1900 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > getDaysInMonth(y, m)) return null;
  return toISO(y, m, d);
}

// ─── Calendar Modal ───────────────────────────────────────────────────────────

type CalendarView = "calendar" | "text-input";

type CalendarModalProps = {
  value: string;
  label: string;
  onAccept: (v: string) => void;
  onCancel: () => void;
};

function CalendarModal({ value, label, onAccept, onCancel }: CalendarModalProps) {
  const today = currentTodayISO();
  const initialISO = value || today;
  const initialParsed = parseISO(initialISO) ?? parseISO(today)!;

  const [view, setView] = useState<CalendarView>("calendar");
  const [pendingISO, setPendingISO] = useState(initialISO);
  const [viewY, setViewY] = useState(initialParsed.y);
  const [viewM, setViewM] = useState(initialParsed.m);
  const [textInput, setTextInput] = useState(() => isoToTextInput(initialISO));
  const [textError, setTextError] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Pre-select text when entering text mode
  useEffect(() => {
    if (view === "text-input") {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [view]);

  // Scroll to selected year when picker opens
  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const idx = viewY - YEAR_MIN;
      const itemH = 40; // py-2.5 ≈ 20px top+bottom + ~20px text = 40px
      const listH = yearListRef.current.clientHeight;
      yearListRef.current.scrollTop = Math.max(0, idx * itemH - listH / 2);
    }
  }, [showYearPicker, viewY]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDayClick = (day: number) => {
    const iso = toISO(viewY, viewM, day);
    setPendingISO(iso);
    setTextInput(isoToTextInput(iso));
  };

  const handleYearSelect = (y: number) => {
    setViewY(y);
    setShowYearPicker(false);
  };

  const handleAccept = () => {
    if (view === "text-input") {
      const parsed = parseTextInput(textInput);
      if (!parsed) {
        setTextError(true);
        return;
      }
      onAccept(parsed);
    } else {
      onAccept(pendingISO);
    }
  };

  const handleTextChange = (val: string) => {
    setTextInput(val);
    setTextError(false);
    // Live-preview: update large display & calendar view if date is valid
    const parsed = parseTextInput(val);
    if (parsed) {
      setPendingISO(parsed);
      const p = parseISO(parsed);
      if (p) {
        setViewY(p.y);
        setViewM(p.m);
      }
    }
  };

  const handleSwitchToText = () => {
    setShowYearPicker(false);
    setView("text-input");
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(viewY, viewM);
  const offset = firstWeekdayOf(viewY, viewM);

  const cells: (number | null)[] = Array.from<null>({ length: offset }).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthNameLow = (MONTHS_ES[viewM - 1] ?? "").toLowerCase();

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) arr.push(y);
    return arr;
  }, []);

  const largeDate = formatLargeDisplay(pendingISO);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* Backdrop */
    <div
      className="calendar-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="calendar-modal w-full max-w-[360px] overflow-hidden rounded-[1.5rem] bg-[var(--surface)] shadow-[0_28px_80px_rgba(0,0,0,0.72)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="px-5 pt-5">
          <p className="text-center text-[0.78rem] font-medium tracking-wide text-[var(--text-secondary)]">
            Seleccionar fecha
          </p>

          {/* Large date + toggle icon */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[1.85rem] font-light leading-none tracking-tight text-[var(--text-primary)]">
              {largeDate}
            </span>

            {view === "calendar" ? (
              <button
                type="button"
                onClick={handleSwitchToText}
                aria-label="Introducir fecha manualmente"
                className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-95"
              >
                <Pencil size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView("calendar")}
                aria-label="Volver al calendario"
                className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-95"
              >
                <CalendarDays size={17} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mt-4 h-px bg-white/[0.12]" />
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="px-4 py-3">
          {view === "calendar" ? (
            <>
              {/* Month / year row */}
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowYearPicker((v) => !v)}
                  aria-label="Seleccionar año"
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.9rem] font-semibold text-[var(--text-primary)] transition hover:bg-white/6"
                >
                  {monthNameLow} de {viewY}
                  <ChevronDown
                    size={14}
                    className={`ml-0.5 text-[var(--text-secondary)] transition-transform duration-200 ${
                      showYearPicker ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {!showYearPicker ? (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={prevMonth}
                      aria-label="Mes anterior"
                      className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-90"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      aria-label="Mes siguiente"
                      className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-white/8 hover:text-white active:scale-90"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : null}
              </div>

              {showYearPicker ? (
                /* Year picker — grilla 3 columnas, reemplaza el grid de días */
                <div
                  ref={yearListRef}
                  className="calendar-year-picker max-h-52 overflow-y-auto"
                >
                  <div className="grid grid-cols-3">
                    {years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => handleYearSelect(y)}
                        className={`flex items-center justify-center py-3 text-[0.92rem] transition active:scale-95 ${
                          y === viewY
                            ? "font-semibold"
                            : "font-normal text-[var(--text-primary)] hover:text-white"
                        }`}
                      >
                        {y === viewY ? (
                          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[#071019]">
                            {y}
                          </span>
                        ) : (
                          y
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Weekday headers */}
                  <div className="mb-1 grid grid-cols-7">
                    {DAYS_HEADER.map((d) => (
                      <div
                        key={d}
                        className="text-center text-[0.72rem] font-semibold text-[var(--text-secondary)]"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7">
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} className="h-9" />;

                      const iso = toISO(viewY, viewM, day);
                      const isSelected = iso === pendingISO;
                      const isToday = iso === today;

                      let cls =
                        "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[0.86rem] font-medium transition-all duration-100 ";

                      if (isSelected) {
                        cls +=
                          "bg-[var(--accent)] text-[#071019] font-semibold shadow-[0_4px_14px_rgba(41,187,243,0.38)]";
                      } else if (isToday) {
                        cls +=
                          "text-[var(--accent)] ring-1 ring-inset ring-[rgba(41,187,243,0.45)] hover:bg-[rgba(41,187,243,0.09)]";
                      } else {
                        cls += "text-[var(--text-primary)] hover:bg-white/8";
                      }

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayClick(day)}
                          className={cls}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Text input mode */
            <div className="py-2">
              <p className="mb-2 text-[0.78rem] font-semibold text-[var(--accent)]">
                Introduce una fecha
              </p>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="d/m/aaaa"
                className={`w-full border-b-2 bg-transparent pb-1.5 text-[1.1rem] font-medium text-[var(--text-primary)] outline-none transition-colors placeholder:text-white/30 ${
                  textError ? "border-red-400" : "border-[var(--accent)]"
                }`}
              />
              {textError ? (
                <p className="mt-1.5 text-[0.72rem] text-red-400">
                  Fecha inválida. Usá el formato d/m/aaaa
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-1 px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-[0.85rem] font-medium text-[var(--text-secondary)] transition hover:bg-white/6 active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-full bg-[rgba(41,187,243,0.13)] px-5 py-2.5 text-[0.85rem] font-semibold text-[var(--accent)] transition hover:bg-[rgba(41,187,243,0.22)] active:scale-95"
          >
            ACEPTAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DatePickerField ──────────────────────────────────────────────────────────
// Full-width field row that opens the full-screen calendar modal.

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
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleAccept = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <>
      {/* Field row */}
      <div className={`border-b border-[var(--line)] py-3 ${className}`}>
        <button
          type="button"
          id={id}
          onClick={open}
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

      {/* Full-screen modal */}
      {isOpen ? (
        <CalendarModal
          value={value}
          label={label}
          onAccept={handleAccept}
          onCancel={close}
        />
      ) : null}
    </>
  );
}

// ─── InlineDatePicker ─────────────────────────────────────────────────────────
// Compact inline trigger (icon + date text) that opens the same full-screen modal.

export type InlineDatePickerProps = {
  id: string;
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (v: string) => void;
};

export function InlineDatePicker({ id, value, onChange }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleAccept = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={open}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 text-left transition hover:opacity-80"
      >
        <CalendarDays
          size={15}
          className="shrink-0 text-[var(--text-secondary)]"
        />
        <span
          className={`text-[0.9rem] font-medium ${
            value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          }`}
        >
          {value ? formatDisplay(value) : "Seleccionar"}
        </span>
      </button>

      {isOpen ? (
        <CalendarModal
          value={value}
          label="Seleccionar fecha"
          onAccept={handleAccept}
          onCancel={close}
        />
      ) : null}
    </>
  );
}
