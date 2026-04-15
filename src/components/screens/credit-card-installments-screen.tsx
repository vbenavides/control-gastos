"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { useMemo } from "react";

import { useCreditCards } from "@/lib/hooks/use-credit-cards";

export function CreditCardInstallmentsScreen() {
  const params = useParams<{ cardId: string }>();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";

  const router = useRouter();
  const { cards, isLoading } = useCreditCards();

  const card = useMemo(
    () => (cards ?? []).find((c) => c.id === cardId) ?? null,
    [cards, cardId],
  );

  const backHref = `/cuentas/tarjeta/${cardId}`;
  const addHref = `/agregar/compra-a-meses?cardId=${cardId}`;

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
            Compras a Meses
          </h1>
          <div aria-hidden="true" />
        </header>
        <div className="type-body flex flex-1 items-center justify-center text-center text-[var(--text-secondary)]">
          No encontramos esta tarjeta.
        </div>
      </div>
    );
  }

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
            Compras a Meses
          </h1>

          <button
            type="button"
            aria-label="Agregar compra a meses"
            onClick={() => router.push(addHref)}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Plus size={24} strokeWidth={2} />
          </button>
        </header>

        {/* Empty state */}
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 pb-16 text-center">
          <p className="type-body max-w-[22rem] text-[var(--text-secondary)]">
            Registra tus compras a meses y da seguimiento a tus pagos
          </p>
          <button
            type="button"
            onClick={() => router.push(addHref)}
            className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full bg-[#0f2a39] px-6 text-[0.9rem] font-medium text-[var(--accent)] transition hover:bg-[#132f40]"
          >
            Agregar Compra a Meses
          </button>
        </div>
    </div>
  );
}
