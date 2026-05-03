"use client";

import {
  AlignJustify,
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  FileText,
  Filter,
  HeartPulse,
  Landmark,
  Layers3,
  PiggyBank,
  Receipt,
  ReceiptText,
  RotateCcw,
  Scale,
  ShoppingCart,
  TrainFront,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Segmented, SmallIconButton, SurfaceCard } from "@/components/ui-kit";
import { formatAmountCLP } from "@/lib/currency";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useTransactions } from "@/lib/hooks/use-transactions";
import type { Transaction, TransactionIconKind, TransactionKind } from "@/lib/models";
import {
  computeRunningBalances,
  getTransactionEffect,
  isIncomeTransaction,
} from "@/lib/transactions";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const;

const TX_KINDS: TransactionKind[] = [
  "income",
  "payment",
  "transfer",
  "cardPayment",
  "installments",
  "expense",
  "refund",
  "cashback",
];

const KIND_META: Record<TransactionKind, { label: string; icon: React.ReactNode }> = {
  income:       { label: "Ingreso",         icon: <ArrowDownToLine size={17} strokeWidth={2} /> },
  payment:      { label: "Pago",            icon: <FileText        size={17} strokeWidth={2} /> },
  transfer:     { label: "Transferencia",   icon: <ArrowLeftRight  size={17} strokeWidth={2} /> },
  cardPayment:  { label: "Pago de Tarjeta", icon: <CreditCard      size={17} strokeWidth={2} /> },
  installments: { label: "Compra a meses",  icon: <AlignJustify    size={17} strokeWidth={2} /> },
  expense:      { label: "Gasto",           icon: <Receipt         size={17} strokeWidth={2} /> },
  refund:       { label: "Reembolso",       icon: <RotateCcw       size={17} strokeWidth={2} /> },
  cashback:     { label: "Cashback",        icon: <Coins           size={17} strokeWidth={2} /> },
};

// ─── Types & helpers ──────────────────────────────────────────────────────────

type CalDay = {
  day: number;
  muted: boolean;
  dateKey: string | null;
};

function buildCalendarDays(year: number, month: number): CalDay[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const days: CalDay[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, muted: true, dateKey: null });
  }

  const mm = String(month + 1).padStart(2, "0");
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      muted: false,
      dateKey: `${year}-${mm}-${String(d).padStart(2, "0")}`,
    });
  }

  const remainder = days.length % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      days.push({ day: d, muted: true, dateKey: null });
    }
  }

  return days;
}

function parseDateParts(isoDate: string) {
  const year = parseInt(isoDate.slice(0, 4), 10);
  const month = parseInt(isoDate.slice(5, 7), 10) - 1;
  const day = parseInt(isoDate.slice(8, 10), 10);
  return { year, month, day };
}

function formatCalendarDateTime(date: string, createdAt?: string): string {
  const { year, month, day } = parseDateParts(date);
  const monthName = MONTH_NAMES[month]?.toLowerCase() ?? "";
  const dateStr = `${day} ${monthName} ${year}`;

  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${dateStr} a las ${hh}:${mm}`;
    }
  }
  return dateStr;
}

// ─── Sheet animation hook (same pattern as picker-sheets.tsx) ─────────────────

function useSheetAnimation(onClose: () => void) {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setIsVisible(true));
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss]);

  return { isVisible, dismiss };
}

// ─── Shared sheet shell ───────────────────────────────────────────────────────

function CalendarSheetShell({
  title,
  isVisible,
  onDismiss,
  children,
}: {
  title: string;
  isVisible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        className={[
          "absolute inset-0 transition-[background-color] duration-200",
          isVisible ? "bg-black/55" : "bg-black/0",
        ].join(" ")}
        onClick={onDismiss}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          "relative z-10 flex h-[90svh] flex-col",
          "rounded-t-[1.4rem] bg-[var(--app-bg-elevated)]",
          "border-t border-x border-[var(--line)]",
          "shadow-[0_-20px_60px_rgba(0,0,0,0.55)]",
          "transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
          "sm:mx-auto sm:w-full sm:max-w-[640px] lg:max-w-[720px]",
        ].join(" ")}
        style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-[3px] w-10 rounded-full bg-white/20" />
        </div>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-2">
          <h3 className="type-subsection-title font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="h-px shrink-0 bg-[var(--line)]" />
        {children}
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "relative inline-flex h-7 w-[2.875rem] shrink-0 cursor-pointer rounded-full",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        checked ? "bg-[var(--accent)]" : "bg-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "mt-1 ml-1 inline-block h-5 w-5 rounded-full bg-white shadow-md",
          "transition-transform duration-200",
          checked ? "translate-x-[1.125rem]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

// ─── Transaction icon ─────────────────────────────────────────────────────────

function TxIcon({ kind }: { kind: TransactionIconKind }) {
  switch (kind) {
    case "piggy-bank":    return <PiggyBank       size={15} strokeWidth={2.2} />;
    case "shopping-cart": return <ShoppingCart    size={15} strokeWidth={2.2} />;
    case "layers":        return <Layers3         size={15} strokeWidth={2.2} />;
    case "train":         return <TrainFront      size={15} strokeWidth={2.2} />;
    case "heart":         return <HeartPulse      size={15} strokeWidth={2.2} />;
    case "utensils":      return <UtensilsCrossed size={15} strokeWidth={2.2} />;
  }
}

// ─── Summary Sheet ────────────────────────────────────────────────────────────

type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  restante: number;
  incomeByCategory: { cat: string; amt: number }[];
  expenseByCategory: { cat: string; amt: number }[];
};

function SummarySheet({
  monthName,
  summary,
  onClose,
}: {
  monthName: string;
  summary: MonthlySummary;
  onClose: () => void;
}) {
  const { isVisible, dismiss } = useSheetAnimation(onClose);

  return (
    <CalendarSheetShell
      title={`Resumen de ${monthName}`}
      isVisible={isVisible}
      onDismiss={dismiss}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Ingreso */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-white/[0.07] text-white/70">
                <ArrowDownToLine size={16} strokeWidth={2} />
              </div>
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Ingreso
              </span>
            </div>
            <span className="type-body font-semibold text-[var(--success)]">
              +{formatAmountCLP(summary.totalIncome)}
            </span>
          </div>
          {summary.incomeByCategory.map(({ cat, amt }) => (
            <div
              key={cat}
              className="flex items-center justify-between py-1.5 pl-11"
            >
              <span className="type-label text-[var(--text-secondary)]">{cat}</span>
              <span className="type-label text-[var(--text-primary)]">
                {formatAmountCLP(amt)}
              </span>
            </div>
          ))}
          {summary.incomeByCategory.length === 0 && (
            <p className="type-label pl-11 text-[var(--text-tertiary)]">
              Sin ingresos registrados
            </p>
          )}
        </div>

        {/* Gastos */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-white/[0.07] text-white/70">
                <Receipt size={16} strokeWidth={2} />
              </div>
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Gastos
              </span>
            </div>
            <span className="type-body font-semibold text-[#f87171]">
              -{formatAmountCLP(summary.totalExpense)}
            </span>
          </div>
          {summary.expenseByCategory.map(({ cat, amt }) => (
            <div
              key={cat}
              className="flex items-center justify-between py-1.5 pl-11"
            >
              <span className="type-label text-[var(--text-secondary)]">{cat}</span>
              <span className="type-label text-[var(--text-primary)]">
                {formatAmountCLP(amt)}
              </span>
            </div>
          ))}
          {summary.expenseByCategory.length === 0 && (
            <p className="type-label pl-11 text-[var(--text-tertiary)]">
              Sin gastos registrados
            </p>
          )}
        </div>

        {/* Restante */}
        <div className="border-t border-[var(--line)] pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-white/[0.07] text-white/70">
                <Scale size={16} strokeWidth={2} />
              </div>
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Restante
              </span>
            </div>
            <span
              className={`type-body font-semibold ${
                summary.restante >= 0
                  ? "text-[var(--text-primary)]"
                  : "text-[#f87171]"
              }`}
            >
              {formatAmountCLP(summary.restante)}
            </span>
          </div>
        </div>
      </div>
    </CalendarSheetShell>
  );
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

type FilterSheetProps = {
  accounts: { id: string; name: string; type: string }[];
  cards: { id: string; name: string }[];
  // account toggles
  debitGroupOn: boolean;
  creditGroupOn: boolean;
  acctToggles: Record<string, boolean>;
  cardTogglesState: Record<string, boolean>;
  isAcctOn: (id: string) => boolean;
  isCardOn: (id: string) => boolean;
  toggleDebitGroup: () => void;
  toggleCreditGroup: () => void;
  toggleAcct: (id: string) => void;
  toggleCard: (id: string) => void;
  // tx kind toggles
  txAllOn: boolean;
  isKindOn: (k: TransactionKind) => boolean;
  toggleTxAll: () => void;
  toggleKind: (k: TransactionKind) => void;
  onClose: () => void;
};

function FilterSheet({
  accounts,
  cards,
  debitGroupOn,
  creditGroupOn,
  isAcctOn,
  isCardOn,
  toggleDebitGroup,
  toggleCreditGroup,
  toggleAcct,
  toggleCard,
  txAllOn,
  isKindOn,
  toggleTxAll,
  toggleKind,
  onClose,
}: FilterSheetProps) {
  const { isVisible, dismiss } = useSheetAnimation(onClose);
  const [tab, setTab] = useState(0);

  return (
    <CalendarSheetShell title="Filtros" isVisible={isVisible} onDismiss={dismiss}>
      {/* Tabs */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <Segmented
          items={["Cuentas", "Transacciones"]}
          activeIndex={tab}
          onChange={setTab}
        />
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {/* ── Cuentas tab ── */}
        {tab === 0 && (
          <div className="px-6 pt-2">
            {/* Cuentas de débito group */}
            <div className="flex items-center justify-between py-4 border-b border-[var(--line)]">
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Cuentas de débito
              </span>
              <Toggle checked={debitGroupOn} onChange={toggleDebitGroup} />
            </div>
            <div>
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-3.5 border-b border-[var(--line)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-secondary)]">
                      {a.type === "Ahorro" ? (
                        <PiggyBank size={15} strokeWidth={2} />
                      ) : (
                        <Landmark size={15} strokeWidth={2} />
                      )}
                    </div>
                    <span className="type-label text-[var(--text-secondary)]">
                      {a.name}
                    </span>
                  </div>
                  <Toggle checked={isAcctOn(a.id)} onChange={() => toggleAcct(a.id)} />
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="py-4 type-helper text-[var(--text-tertiary)]">
                  Sin cuentas registradas
                </p>
              )}
            </div>

            {/* Tarjetas de crédito group */}
            <div className="flex items-center justify-between py-4 mt-2 border-b border-[var(--line)]">
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Tarjetas de crédito
              </span>
              <Toggle checked={creditGroupOn} onChange={toggleCreditGroup} />
            </div>
            <div>
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3.5 border-b border-[var(--line)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-secondary)]">
                      <CreditCard size={15} strokeWidth={2} />
                    </div>
                    <span className="type-label text-[var(--text-secondary)]">
                      {c.name}
                    </span>
                  </div>
                  <Toggle checked={isCardOn(c.id)} onChange={() => toggleCard(c.id)} />
                </div>
              ))}
              {cards.length === 0 && (
                <p className="py-4 type-helper text-[var(--text-tertiary)]">
                  Sin tarjetas registradas
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Transacciones tab ── */}
        {tab === 1 && (
          <div className="px-6 pt-2">
            {/* Todos */}
            <div className="flex items-center justify-between py-4 border-b border-[var(--line)]">
              <span className="type-body font-semibold text-[var(--text-primary)]">
                Todos
              </span>
              <Toggle checked={txAllOn} onChange={toggleTxAll} />
            </div>
            {/* Individual kinds */}
            {TX_KINDS.map((kind) => {
              const meta = KIND_META[kind];
              return (
                <div
                  key={kind}
                  className="flex items-center justify-between py-3.5 border-b border-[var(--line)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-secondary)]">
                      {meta.icon}
                    </div>
                    <span className="type-label text-[var(--text-secondary)]">
                      {meta.label}
                    </span>
                  </div>
                  <Toggle checked={isKindOn(kind)} onChange={() => toggleKind(kind)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CalendarSheetShell>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CalendarScreen() {
  const router = useRouter();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<"next" | "prev" | null>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [accountView, setAccountView] = useState<"debit" | "credit">("debit");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [balanceExpanded, setBalanceExpanded] = useState(false);
  const [txExpanded, setTxExpanded] = useState(true); // expanded by default
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Filter: account toggles ──────────────────────────────────────────────────
  const [debitGroupOn, setDebitGroupOn] = useState(true);
  const [creditGroupOn, setCreditGroupOn] = useState(true);
  const [acctToggles, setAcctToggles] = useState<Record<string, boolean>>({});
  const [cardTogglesState, setCardTogglesState] = useState<Record<string, boolean>>({});

  // ── Filter: transaction kind toggles ─────────────────────────────────────────
  const [txAllOn, setTxAllOn] = useState(true);
  const [txKindToggles, setTxKindToggles] = useState<Record<string, boolean>>({});

  const { accounts } = useDebitAccounts();
  const { cards } = useCreditCards();
  const { transactions } = useTransactions();

  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const todayDay = now.getDate();

  const calDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // ── Totals ───────────────────────────────────────────────────────────────────

  const accountsTotal = useMemo(
    () => (accounts ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );

  const creditTotal = useMemo(
    () => (cards ?? []).reduce((sum, c) => sum + c.balance, 0),
    [cards],
  );

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    (accounts ?? []).forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  // ── Month transactions ───────────────────────────────────────────────────────

  const monthTxs = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      if (t.isPending) return false;
      const { year, month } = parseDateParts(t.date);
      return year === viewYear && month === viewMonth;
    });
  }, [transactions, viewYear, viewMonth]);

  // ── Apply account + kind filters ────────────────────────────────────────────

  const filteredMonthTxs = useMemo(() => {
    return monthTxs.filter((t) => {
      if (acctToggles[t.accountId] === false) return false;
      if (txKindToggles[t.kind] === false) return false;
      return true;
    });
  }, [monthTxs, acctToggles, txKindToggles]);

  // Balance base solo de cuentas habilitadas (para que el modo Balance
  // refleje visualmente cuando se oculta una cuenta)
  const filteredAccountsTotal = useMemo(
    () =>
      (accounts ?? [])
        .filter((a) => acctToggles[a.id] !== false)
        .reduce((sum, a) => sum + a.balance, 0),
    [accounts, acctToggles],
  );

  // ── Daily data ───────────────────────────────────────────────────────────────

  const dailyBalances = useMemo(() => {
    const map = new Map<string, number>();
    const mm = String(viewMonth + 1).padStart(2, "0");
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthEffect = filteredMonthTxs.reduce((s, t) => s + getTransactionEffect(t), 0);
    let bal = filteredAccountsTotal - monthEffect;
    const dayEffects = new Map<string, number>();
    filteredMonthTxs.forEach((t) => {
      const { day } = parseDateParts(t.date);
      const key = `${viewYear}-${mm}-${String(day).padStart(2, "0")}`;
      dayEffects.set(key, (dayEffects.get(key) ?? 0) + getTransactionEffect(t));
    });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${mm}-${String(d).padStart(2, "0")}`;
      bal += dayEffects.get(key) ?? 0;
      map.set(key, bal);
    }
    return map;
  }, [filteredMonthTxs, filteredAccountsTotal, viewYear, viewMonth]);

  const dailyCashFlow = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    const mm = String(viewMonth + 1).padStart(2, "0");
    filteredMonthTxs.forEach((t) => {
      const { day } = parseDateParts(t.date);
      const key = `${viewYear}-${mm}-${String(day).padStart(2, "0")}`;
      const curr = map.get(key) ?? { income: 0, expense: 0 };
      if (isIncomeTransaction(t)) curr.income += t.amount;
      else curr.expense += t.amount;
      map.set(key, curr);
    });
    return map;
  }, [filteredMonthTxs, viewYear, viewMonth]);

  const allMonthTxsSorted = useMemo(
    () =>
      [...filteredMonthTxs].sort((a, b) => {
        if (b.date < a.date) return -1;
        if (b.date > a.date) return 1;
        const ca = a.createdAt ?? "";
        const cb = b.createdAt ?? "";
        return cb > ca ? 1 : cb < ca ? -1 : 0;
      }),
    [filteredMonthTxs],
  );

  const runningBalances = useMemo(() => {
    if (!allMonthTxsSorted.length) return new Map<string, number>();
    return computeRunningBalances(allMonthTxsSorted, filteredAccountsTotal);
  }, [allMonthTxsSorted, filteredAccountsTotal]);

  const txsByDate = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    allMonthTxsSorted.forEach((t) => {
      const key = t.date.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });
    return [...groups.entries()].map(([dateKey, txs]) => ({
      dateKey,
      txs: [...txs].reverse(),
    }));
  }, [allMonthTxsSorted]);

  // ── Filter by selected day ───────────────────────────────────────────────────

  const displayedTxsByDate = useMemo(() => {
    if (!selectedDay) return txsByDate;
    return txsByDate.filter(({ dateKey }) => dateKey === selectedDay);
  }, [txsByDate, selectedDay]);

  // ── Monthly summary ──────────────────────────────────────────────────────────

  const monthlySummary = useMemo(() => {
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;
    filteredMonthTxs.forEach((t) => {
      if (isIncomeTransaction(t)) {
        totalIncome += t.amount;
        incomeByCategory.set(t.category, (incomeByCategory.get(t.category) ?? 0) + t.amount);
      } else {
        totalExpense += t.amount;
        expenseByCategory.set(t.category, (expenseByCategory.get(t.category) ?? 0) + t.amount);
      }
    });
    return {
      totalIncome,
      totalExpense,
      restante: totalIncome - totalExpense,
      incomeByCategory: [...incomeByCategory.entries()].map(([cat, amt]) => ({ cat, amt })),
      expenseByCategory: [...expenseByCategory.entries()].map(([cat, amt]) => ({ cat, amt })),
    };
  }, [filteredMonthTxs]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goToPrev = () => {
    setAnimDir("prev");
    setAnimKey((k) => k + 1);
    setSelectedDay(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const goToNext = () => {
    setAnimDir("next");
    setAnimKey((k) => k + 1);
    setSelectedDay(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
  const balanceDateLabel = `${lastDay} ${MONTH_NAMES[viewMonth].toLowerCase()}`;
  const paidCount = selectedDay
    ? (displayedTxsByDate[0]?.txs.length ?? 0)
    : allMonthTxsSorted.length;

  // ── Filter helpers ───────────────────────────────────────────────────────────

  const isAcctOn = (id: string) => acctToggles[id] !== false;
  const isCardOn = (id: string) => cardTogglesState[id] !== false;
  const isKindOn = (k: TransactionKind) => txKindToggles[k] !== false;

  const toggleAcct = (id: string) =>
    setAcctToggles((prev) => ({ ...prev, [id]: !isAcctOn(id) }));
  const toggleCard = (id: string) =>
    setCardTogglesState((prev) => ({ ...prev, [id]: !isCardOn(id) }));

  const toggleDebitGroup = () => {
    const next = !debitGroupOn;
    setDebitGroupOn(next);
    const map: Record<string, boolean> = {};
    (accounts ?? []).forEach((a) => (map[a.id] = next));
    setAcctToggles((prev) => ({ ...prev, ...map }));
  };
  const toggleCreditGroup = () => {
    const next = !creditGroupOn;
    setCreditGroupOn(next);
    const map: Record<string, boolean> = {};
    (cards ?? []).forEach((c) => (map[c.id] = next));
    setCardTogglesState((prev) => ({ ...prev, ...map }));
  };
  const toggleKind = (k: TransactionKind) => {
    const next = !isKindOn(k);
    setTxKindToggles((prev) => ({ ...prev, [k]: next }));
    const allOn = TX_KINDS.every((kind) =>
      kind === k ? next : txKindToggles[kind] !== false,
    );
    setTxAllOn(allOn);
  };
  const toggleTxAll = () => {
    const next = !txAllOn;
    setTxAllOn(next);
    const map: Record<string, boolean> = {};
    TX_KINDS.forEach((k) => (map[k] = next));
    setTxKindToggles(map);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 -mx-4 bg-[var(--app-bg)] px-4 pb-3 pt-2 sm:-mx-5 sm:px-5 lg:-mx-2 lg:px-2">
          <div className="flex items-center justify-between">
            <h1 className="text-[2rem] font-medium tracking-[-0.04em] md:text-[2.35rem]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h1>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={goToPrev}
                className="grid h-10 w-10 place-items-center rounded-full text-white/90 transition hover:bg-white/6"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Ver resumen del mes"
                onClick={() => setSummaryOpen(true)}
                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                  summaryOpen
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-white/90 hover:bg-white/6"
                }`}
              >
                <Scale size={20} strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={goToNext}
                className="grid h-10 w-10 place-items-center rounded-full text-white/90 transition hover:bg-white/6"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4 pt-1 md:space-y-5">
          {/* Calendar card */}
          <SurfaceCard className="px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center gap-2">
              <Segmented
                items={["Balance", "Flujo de efectivo"]}
                activeIndex={activeTab}
                onChange={setActiveTab}
                className="flex-1"
              />
              <SmallIconButton
                aria-label="Cuentas de débito"
                active={accountView === "debit"}
                onClick={() => setAccountView("debit")}
              >
                <Landmark size={18} />
              </SmallIconButton>
              <SmallIconButton
                aria-label="Tarjetas de crédito"
                active={accountView === "credit"}
                onClick={() => setAccountView("credit")}
              >
                <CreditCard size={18} />
              </SmallIconButton>
              <SmallIconButton
                aria-label="Filtrar"
                active={filterOpen}
                onClick={() => setFilterOpen(true)}
              >
                <Filter size={18} />
              </SmallIconButton>
            </div>

            {/* Calendar grid */}
            <div
              key={animKey}
              className={`mt-5 grid grid-cols-7 text-center ${
                animDir === "next"
                  ? "cal-grid-next"
                  : animDir === "prev"
                    ? "cal-grid-prev"
                    : ""
              }`}
            >
              {WEEKDAY_LABELS.map((label, i) => (
                <span
                  key={`wl-${i}`}
                  className="pb-3 text-sm text-[var(--text-tertiary)]"
                >
                  {label}
                </span>
              ))}

              {calDays.map((entry, i) => {
                const isSelected = !entry.muted && entry.dateKey === selectedDay;
                const isToday = !entry.muted && isCurrentMonth && entry.day === todayDay;

                let cellContent: React.ReactNode = null;
                if (!entry.muted && entry.dateKey && accountView === "debit") {
                  if (activeTab === 0) {
                    const bal = dailyBalances.get(entry.dateKey);
                    if (bal !== undefined) {
                      cellContent = (
                        <p
                          className={`truncate px-0.5 text-[0.64rem] leading-tight ${
                            isSelected ? "text-white/80" : "text-white/50"
                          }`}
                        >
                          {formatAmountCLP(bal)}
                        </p>
                      );
                    }
                  } else {
                    const cf = dailyCashFlow.get(entry.dateKey);
                    if (cf) {
                      cellContent = (
                        <div className="space-y-0.5">
                          {cf.income > 0 && (
                            <p className="truncate px-0.5 text-[0.6rem] leading-tight text-[var(--success)]">
                              +{formatAmountCLP(cf.income)}
                            </p>
                          )}
                          {cf.expense > 0 && (
                            <p className="truncate px-0.5 text-[0.6rem] leading-tight text-[#f87171]">
                              -{formatAmountCLP(cf.expense)}
                            </p>
                          )}
                        </div>
                      );
                    }
                  }
                }

                return (
                  <button
                    key={`cd-${i}`}
                    type="button"
                    aria-label={entry.muted ? undefined : `Día ${entry.day}`}
                    disabled={entry.muted}
                    onClick={() => {
                      if (!entry.muted && entry.dateKey) {
                        if (entry.dateKey === selectedDay) {
                          setSelectedDay(null);
                        } else {
                          setSelectedDay(entry.dateKey);
                          setTxExpanded(true);
                        }
                      }
                    }}
                    className={`flex h-[3.9rem] flex-col items-center py-1 transition ${
                      !entry.muted ? "cursor-pointer hover:opacity-75" : "cursor-default"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base md:h-9 md:w-9 ${
                        isSelected
                          ? "bg-[var(--accent)] text-white"
                          : isToday
                            ? "border border-white/70 text-white"
                            : entry.muted
                              ? "text-white/18"
                              : "text-[var(--text-primary)]"
                      }`}
                    >
                      {entry.day}
                    </div>
                    <div className="mt-0.5 h-[1.35rem] w-full overflow-hidden">
                      {cellContent}
                    </div>
                  </button>
                );
              })}
            </div>
          </SurfaceCard>

          {/* Balance summary card */}
          <SurfaceCard className="overflow-hidden px-5 py-4 md:px-6 md:py-5">
            <button
              type="button"
              aria-expanded={balanceExpanded}
              aria-label={balanceExpanded ? "Colapsar detalle" : "Ver detalle de cuentas"}
              onClick={() => setBalanceExpanded((v) => !v)}
              className="w-full"
            >
              <div className="grid grid-cols-[1fr_1fr_1.1fr_auto] items-center gap-x-2 text-center">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Balance al</p>
                  <p className="mt-0.5 text-xl font-semibold leading-tight md:text-2xl">
                    {balanceDateLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Cuentas</p>
                  <p className="mt-0.5 text-xl font-semibold leading-tight md:text-2xl">
                    {formatAmountCLP(accountsTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Tarjetas de crédito</p>
                  <p className="mt-0.5 text-xl font-semibold leading-tight md:text-2xl">
                    {formatAmountCLP(creditTotal)}
                  </p>
                </div>
                <div
                  className={`shrink-0 transition-transform duration-200 ${balanceExpanded ? "rotate-180" : ""}`}
                >
                  <ChevronDown size={20} className="text-[var(--text-secondary)]" />
                </div>
              </div>
            </button>

            {balanceExpanded && (
              <div className="cal-expand-enter mt-4 space-y-4 border-t border-[var(--line)] pt-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                      <Landmark size={15} />
                      <span className="type-label font-semibold">Cuentas de débito</span>
                    </div>
                    <span className="type-label font-semibold">
                      {formatAmountCLP(accountsTotal)}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2 pl-6">
                    {(accounts ?? []).map((a) => (
                      <div key={a.id} className="flex items-center justify-between">
                        <span className="type-label text-[var(--text-secondary)]">{a.name}</span>
                        <span className="type-label text-[var(--text-primary)]">
                          {formatAmountCLP(a.balance)}
                        </span>
                      </div>
                    ))}
                    {(accounts ?? []).length === 0 && (
                      <p className="type-helper text-[var(--text-tertiary)]">Sin cuentas</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                      <ReceiptText size={15} />
                      <span className="type-label font-semibold">Tarjetas de crédito</span>
                    </div>
                    <span className="type-label font-semibold">
                      {formatAmountCLP(creditTotal)}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2 pl-6">
                    {(cards ?? []).map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <span className="type-label text-[var(--text-secondary)]">{c.name}</span>
                        <span className="type-label text-[var(--text-primary)]">
                          {formatAmountCLP(c.balance)}
                        </span>
                      </div>
                    ))}
                    {(cards ?? []).length === 0 && (
                      <p className="type-helper text-[var(--text-tertiary)]">Sin tarjetas</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SurfaceCard>

          {/* Transactions section */}
          <div className="pb-24 md:pb-10">
            <button
              type="button"
              aria-expanded={txExpanded}
              onClick={() => setTxExpanded((v) => !v)}
              className="flex w-full items-center justify-between py-2"
            >
              <span className="type-body font-medium text-[var(--text-primary)]">
                {selectedDay ? (
                  <>
                    Pagado:{" "}
                    <span className="text-[var(--accent)]">{paidCount}</span>
                    <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                      — día seleccionado
                    </span>
                  </>
                ) : (
                  <>Pagado: {paidCount}</>
                )}
              </span>
              <ChevronDown
                size={20}
                className={`text-[var(--text-secondary)] transition-transform duration-200 ${
                  txExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {txExpanded && (
              <div className="cal-expand-enter space-y-3 pt-1">
                {displayedTxsByDate.length === 0 ? (
                  <p className="type-label py-8 text-center text-[var(--text-tertiary)]">
                    {selectedDay ? "Sin transacciones ese día" : "Sin transacciones este mes"}
                  </p>
                ) : (
                  displayedTxsByDate.map(({ txs }) =>
                    txs.map((t) => {
                      const runningBal = runningBalances.get(t.id);
                      const isIncome = isIncomeTransaction(t);
                      const accName = accountMap.get(t.accountId) ?? "";
                      const dateLabel = formatCalendarDateTime(t.date, t.createdAt);

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            router.push(
                              `/cuentas/debito/${t.accountId}/transaccion/${t.id}`,
                            )
                          }
                          className="w-full overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:brightness-110 active:scale-[0.99] text-left"
                        >
                          <div className="flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 md:min-h-[2.2rem] md:px-4">
                            <span className="type-label text-white/84">{dateLabel}</span>
                            <Check size={15} strokeWidth={2.3} className="shrink-0 text-white/84" />
                          </div>
                          <div className="flex min-h-[4.8rem] items-center gap-3 px-3 py-3 md:min-h-[5.15rem] md:px-4 md:py-3.5">
                            <div
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem] md:h-10 md:w-10"
                              style={{ backgroundColor: t.iconBackground, color: t.iconColor }}
                            >
                              <TxIcon kind={t.iconKind} />
                            </div>
                            <div className="min-w-0 flex-1 self-center">
                              <p className="type-body truncate text-[var(--text-primary)]">
                                {t.description}
                              </p>
                              {accName ? (
                                <p className="type-label mt-1.5 text-white/82">{accName}</p>
                              ) : null}
                            </div>
                            <div className="shrink-0 self-center text-right">
                              <p
                                className={`type-body ${
                                  isIncome ? "text-[#7dd3fc]" : "text-[var(--text-primary)]"
                                }`}
                              >
                                {formatAmountCLP(t.amount)}
                              </p>
                              {runningBal !== undefined && (
                                <p className="mt-0.5 text-[0.72rem] text-white">
                                  {formatAmountCLP(runningBal)}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }),
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary sheet ── */}
      {summaryOpen && (
        <SummarySheet
          monthName={MONTH_NAMES[viewMonth].toLowerCase()}
          summary={monthlySummary}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {/* ── Filter sheet ── */}
      {filterOpen && (
        <FilterSheet
          accounts={(accounts ?? []).map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
          }))}
          cards={(cards ?? []).map((c) => ({ id: c.id, name: c.name }))}
          debitGroupOn={debitGroupOn}
          creditGroupOn={creditGroupOn}
          acctToggles={acctToggles}
          cardTogglesState={cardTogglesState}
          isAcctOn={isAcctOn}
          isCardOn={isCardOn}
          toggleDebitGroup={toggleDebitGroup}
          toggleCreditGroup={toggleCreditGroup}
          toggleAcct={toggleAcct}
          toggleCard={toggleCard}
          txAllOn={txAllOn}
          isKindOn={isKindOn}
          toggleTxAll={toggleTxAll}
          toggleKind={toggleKind}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </>
  );
}
