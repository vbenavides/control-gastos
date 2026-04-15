"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

import { useCreditCards } from "@/lib/hooks/use-credit-cards";

// ─── Helper ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

/**
 * Calcula la próxima fecha de corte a partir del día configurado.
 * Si ese día ya pasó este mes, devuelve el mismo día del mes siguiente.
 */
function nextStatementDate(statementDay: number): string {
  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();

  let targetMonth = month;
  let targetYear = year;

  if (today >= statementDay) {
    // Ya pasó el corte de este mes → siguiente mes
    targetMonth = month + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear = year + 1;
    }
  }

  return `${statementDay} ${MONTHS_SHORT[targetMonth]} ${targetYear}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CreditCardStatementScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const { cards, isLoading } = useCreditCards();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const backHref = `/cuentas/tarjeta/${cardId}`;

  // ── Cargando ──
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col items-center justify-center px-4">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  // ── No encontrada ──
  if (!card) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=credito"
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
              Estado de Cuenta
            </h1>
            <div aria-hidden="true" />
          </header>
          <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
            No encontramos esta tarjeta.
          </div>
        </div>
      </div>
    );
  }

  const nextDate = nextStatementDate(card.statementDay);

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">

        {/* Header */}
        <header className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-start pt-1">
          <Link
            href={backHref}
            prefetch={true}
            aria-label="Volver al detalle de tarjeta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <div className="text-center">
            <h1 className="type-subsection-title font-bold text-[var(--text-primary)]">
              Estado de Cuenta
            </h1>
            <p className="type-label mt-1 text-[var(--text-primary)]">
              {card.name}
            </p>
          </div>

          <div aria-hidden="true" />
        </header>

        {/* Body */}
        <div className="px-1 pt-10">
          <p className="type-body text-[var(--text-primary)]">
            Tu próximo estado de cuenta estará disponible el {nextDate}
          </p>
        </div>

      </div>
    </div>
  );
}
