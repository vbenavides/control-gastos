"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Send, Settings2 } from "lucide-react";
import { useMemo } from "react";

import { useCreditCards } from "@/lib/hooks/use-credit-cards";

const MODE_LABELS: Record<string, { title: string; description: string }> = {
  manual: {
    title: "Manual",
    description: "Programa tus pagos de tarjeta manualmente cada mes",
  },
  automatic: {
    title: "Automático",
    description: "Los pagos de tarjeta se programan automáticamente cada mes",
  },
};

export function CreditCardScheduledPaymentsScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const router = useRouter();
  const { cards, isLoading } = useCreditCards();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const backHref = `/cuentas/tarjeta/${cardId}`;
  const configHref = `/cuentas/tarjeta/${cardId}/pagos-programados/configurar`;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
      </div>
    );
  }

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
          <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
            Programación de Pagos
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
          No encontramos esta tarjeta.
        </div>
      </div>
    );
  }

  const mode = card.paymentScheduleMode ?? "manual";
  const modeInfo = MODE_LABELS[mode] ?? MODE_LABELS["manual"];

  return (
    <div className="mx-auto w-full max-w-[36rem] px-4 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">

        {/* Header */}
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-1 pb-2">
          <Link
            href={backHref}
            prefetch={true}
            aria-label="Volver al detalle de tarjeta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="type-subsection-title text-center font-bold text-[var(--text-primary)]">
            Programación de Pagos
          </h1>

          <button
            type="button"
            aria-label="Agregar pago programado"
            onClick={() => router.push(`/agregar/pago-tarjeta?cardId=${card.id}`)}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Plus size={24} strokeWidth={2} />
          </button>
        </header>

        {/* Body */}
        <div className="mt-6 flex flex-col gap-6">

          {/* Card de modo actual — clickeable → configurar */}
          <Link
            href={configHref}
            prefetch={true}
            className="flex items-center justify-between gap-4 rounded-[0.85rem] border border-white/[0.07] bg-[#17212b] px-4 py-4 transition hover:border-white/[0.12] hover:bg-[#1b2732]"
          >
            <div className="min-w-0">
              <p className="type-body font-semibold text-[var(--text-primary)]">
                {modeInfo.title}
              </p>
              <p className="type-label mt-0.5 text-[var(--text-secondary)]">
                {modeInfo.description}
              </p>
            </div>
            <Settings2
              size={22}
              strokeWidth={1.8}
              className="shrink-0 text-[var(--text-secondary)]"
            />
          </Link>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1e3040]">
              <Send size={26} strokeWidth={1.7} className="text-[var(--accent)]" />
            </div>
            <p className="type-body mt-4 text-[var(--text-secondary)]">
              No hay pagos programados
            </p>
          </div>

        </div>
    </div>
  );
}
