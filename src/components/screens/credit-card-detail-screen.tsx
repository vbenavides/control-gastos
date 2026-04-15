"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CircleCheck,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_CURRENCY_CODE, formatAmountCLP } from "@/lib/currency";
import {
  formatMoneyInput,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function formatDayMonth(day: number): string {
  const now = new Date();
  const month = MONTHS_SHORT[now.getMonth()];
  return `${day} ${month}`;
}

function formatStatementDate(day: number): string {
  const now = new Date();
  // El estado de cuenta es del mes anterior al corte
  const statementMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return `${day} ${MONTHS_SHORT[statementMonth]}`;
}

function formatPaymentDate(day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = MONTHS_SHORT[now.getMonth()];
  return `${day} ${month} ${year}`;
}

function usagePct(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((balance / limit) * 100));
}

function usageLabel(pct: number): string {
  if (pct === 0) return "Bueno";
  if (pct < 30) return "Excelente";
  if (pct < 60) return "Bueno";
  if (pct < 80) return "Regular";
  return "Alto";
}

// ─── Componente principal ─────────────────────────────────────────────────────

type TopNotice = {
  title: string;
  description: string;
};

export function CreditCardDetailScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const { cards, isLoading, update: updateCard } = useCreditCards();

  const router = useRouter();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const [topNotice, setTopNotice] = useState<TopNotice | null>(null);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInputValue, setBalanceInputValue] = useState("0");

  const cardCurrencyCode = card?.currencyCode ?? DEFAULT_CURRENCY_CODE;

  const openBalanceDialog = useCallback(() => {
    setBalanceInputValue(card ? String(card.balance) : "0");
    setShowBalanceDialog(true);
  }, [card]);

  const handleSaveBalance = useCallback(async () => {
    if (!card) return;
    const parsed = parseNumericInput(balanceInputValue);
    await updateCard(card.id, { balance: parsed });
    setShowBalanceDialog(false);
    setTopNotice({
      title: `${card.name}: ${formatAmountCLP(parsed)}`,
      description: "Balance actualizado",
    });
  }, [card, balanceInputValue, updateCard]);

  useEffect(() => {
    if (!topNotice) return;
    const timer = window.setTimeout(() => setTopNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [topNotice]);

  useEffect(() => {
    if (!showBalanceDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowBalanceDialog(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBalanceDialog]);

  // ── Estado: cargando ──
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

  // ── Estado: no encontrada ──
  if (!card) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-1">
          <Link
            href="/cuentas?tab=credito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
            Tarjeta no encontrada
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
          No encontramos esta tarjeta.
        </div>
      </div>
    );
  }

  const available = card.limit - card.balance;
  const pct = usagePct(card.balance, card.limit);
  const sameDay = card.statementDay === card.paymentDay;

  return (
    <>
      {topNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 bg-[#ffc64b] px-4 py-3 text-[#12171d] shadow-[0_12px_24px_rgba(0,0,0,0.18)] md:left-1/2 md:right-auto md:top-4 md:w-[min(50rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.1rem] md:px-5 lg:w-[min(54rem,calc(100vw-4rem))]"
        >
          <div className="mx-auto w-full">
            <p className="type-body-strong font-medium text-[#12171d]">{topNotice.title}</p>
            <p className="type-body mt-1 text-[#12171d]">{topNotice.description}</p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[36rem] px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">

        {/* ── Header fijo ── */}
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-white/[0.06] bg-[var(--app-bg)] pb-4 pt-1">
          <Link
            href="/cuentas?tab=credito"
            prefetch={true}
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <div className="text-center">
            <h1 className="type-subsection-title font-semibold leading-tight text-[var(--text-primary)]">
              {card.name}
            </h1>
            <p className="type-label mt-0.5 text-[var(--text-secondary)]">
              ... {card.last4}
            </p>
          </div>

          <Link
            href={`/cuentas/tarjeta/${card.id}/editar`}
            prefetch={false}
            aria-label="Editar tarjeta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Pencil size={21} strokeWidth={2.2} />
          </Link>
        </header>

        <div className="pb-24">

          {/* Balance */}
          <section className="px-1 pt-8 text-center md:pt-10">
            <p className="type-label text-[var(--text-primary)]">Balance</p>
            <p className="type-display mt-1 font-medium text-[var(--text-primary)]">
              {formatAmountCLP(card.balance)}
            </p>

            <button
              type="button"
              onClick={openBalanceDialog}
              className="mx-auto mt-5 inline-flex min-h-[2.4rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[0.9rem] font-medium text-[var(--accent)]"
            >
              Actualizar Balance
            </button>
          </section>

          {/* Disponible + Fecha de corte */}
          <section className="mt-8 flex items-stretch">
            <div className="flex-1 text-center">
              <p className="type-helper text-[var(--text-secondary)]">Disponible</p>
              <p className="type-label mt-1 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(available)}
              </p>
            </div>

            <div className="w-px self-stretch bg-white/[0.12]" />

            <div className="flex-1 text-center">
              <p className="type-helper text-[var(--text-secondary)]">Fecha de corte</p>
              <p className="type-label mt-1 font-medium text-[var(--text-primary)]">
                {formatDayMonth(card.statementDay)}
              </p>
            </div>
          </section>

          {/* Warning: mismo día de corte y pago */}
          {sameDay ? (
            <div className="mt-6 flex gap-3 rounded-[0.85rem] border border-[#f5c842]/20 bg-[#f5c842]/[0.08] px-4 py-3.5">
              <AlertTriangle
                size={16}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-[#f5c842]"
              />
              <p className="type-helper text-[var(--text-primary)]">
                La fecha de corte y de pago son el mismo día. Por favor, ingresa las fechas correctas para tu tarjeta.
              </p>
            </div>
          ) : null}

          {/* Estado de cuenta */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">
                Estado de cuenta al {formatStatementDate(card.statementDay)}
              </h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/estado-de-cuenta`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver todo
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b]">
              {/* Fila: Balance Anterior */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Balance Anterior</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(0)}</p>
              </div>
              {/* Fila: Pagos */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Pagos</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(0)}</p>
              </div>
              {/* Fila: Compras */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label text-[var(--text-secondary)]">Compras</p>
                <p className="type-label text-[var(--text-primary)]">{formatAmountCLP(0)}</p>
              </div>

              {/* Separador grueso */}
              <div className="border-t border-white/[0.1]" />

              {/* Fila: Nuevo Balance */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Nuevo Balance</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(card.balance)}</p>
              </div>
              {/* Fila: Pago para no generar intereses */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Pago para no generar intereses</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatAmountCLP(card.balance)}</p>
              </div>
              {/* Fila: Fecha de Pago */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="type-label font-semibold text-[var(--text-primary)]">Fecha de Pago</p>
                <p className="type-label font-semibold text-[var(--text-primary)]">{formatPaymentDate(card.paymentDay)}</p>
              </div>
            </div>
          </section>

          {/* Pagos */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">Pagos</h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/pagos-programados`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver Programación
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <CircleCheck size={16} strokeWidth={2.1} className="shrink-0 text-[#8de56c]" />
              <p className="type-label text-[var(--text-secondary)]">
                No tienes pagos pendientes para este periodo
              </p>
            </div>

            <div className="mt-3 flex min-h-[4.5rem] items-center justify-center rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-5">
              <p className="type-label text-center text-[var(--text-secondary)]">
                No hay pagos programados en este periodo
              </p>
            </div>
          </section>

          {/* Pagos a Meses */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="type-body font-medium text-[var(--text-primary)]">Pagos a Meses</h2>
              <button
                type="button"
                onClick={() => router.push(`/cuentas/tarjeta/${card.id}/compras-a-meses`)}
                className="type-helper rounded-full bg-[#0f2a39] px-3.5 py-1.5 font-medium text-[var(--accent)]"
              >
                Ver todo
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-6 text-center">
              <p className="type-label text-[var(--text-secondary)]">
                Registra tus compras a meses y da seguimiento a tus pagos
              </p>
              <button
                type="button"
                onClick={() => router.push(`/agregar/compra-a-meses?cardId=${card.id}`)}
                className="mx-auto mt-4 inline-flex min-h-[2.2rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[0.9rem] font-medium text-[var(--accent)]"
              >
                Agregar Compra a Meses
              </button>
            </div>
          </section>

          {/* Uso de Crédito */}
          <section className="mt-8">
            <h2 className="type-body font-medium text-[var(--text-primary)]">
              Uso de Crédito
            </h2>

            <div className="mt-3 overflow-hidden rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 pb-4 pt-4">
              <p className="type-body-strong font-medium text-[var(--text-primary)]">{pct}%</p>

              {/* Barra de progreso */}
              <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.1]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="type-label text-[var(--text-secondary)]">{usageLabel(pct)}</p>
                <p className="type-label text-[var(--text-secondary)]">
                  Crédito Disponible{" "}
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(available)}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Transacciones recientes */}
          <section className="mt-8">
            <h2 className="type-body font-medium text-[var(--text-primary)]">
              Transacciones recientes
            </h2>

            <div className="mt-4 flex flex-col items-center justify-center rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-12">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1e3040]">
                <ClipboardList size={28} strokeWidth={1.7} className="text-[var(--text-secondary)]" />
              </div>
              <p className="type-label mt-4 text-[var(--text-secondary)]">Sin entradas aún</p>
            </div>
          </section>

        </div>
      </div>

      {showBalanceDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setShowBalanceDialog(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Actualizar balance"
            className="relative w-full max-w-[22rem] rounded-[1.8rem] bg-[#121d27] px-6 py-6 shadow-[0_18px_42px_rgba(0,0,0,0.38)]"
          >
            <h2 className="type-subsection-title font-medium text-[var(--text-primary)]">
              Balance
            </h2>

            <div className="mt-5">
              <label
                htmlFor="card-balance-input"
                className="type-label block text-center text-[var(--text-secondary)]"
              >
                Balance
              </label>
              <input
                id="card-balance-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={formatMoneyInput(balanceInputValue, cardCurrencyCode)}
                onChange={(event) =>
                  setBalanceInputValue(
                    sanitizeNumericInput(
                      stripMoneyFormat(event.target.value, cardCurrencyCode),
                      "integer",
                    ),
                  )
                }
                onBlur={() =>
                  setBalanceInputValue((current) =>
                    normalizeNumericBlurValue(current, "integer"),
                  )
                }
                className="type-body mt-3 w-full rounded-[0.75rem] border border-white/12 bg-white/[0.04] px-4 py-3 text-center text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:bg-white/[0.06]"
              />
            </div>

            <div className="mt-6 flex items-center gap-6">
              <button
                type="button"
                onClick={handleSaveBalance}
                className="type-body font-medium text-[var(--accent)]"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowBalanceDialog(false)}
                className="type-body font-medium text-[var(--text-primary)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
