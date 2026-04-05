"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, SquarePen, Trash2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import type { DebitAccountType } from "@/lib/mock-data";
import { addAccountTypeOptions, getDebitAccountDetail } from "@/lib/mock-data";

type ActiveDialog = "delete" | null;

export function EditDebitAccountScreen() {
  const params = useParams<{ accountSlug: string }>();
  const accountSlug = typeof params.accountSlug === "string" ? params.accountSlug : "";
  const account = useMemo(() => getDebitAccountDetail(accountSlug), [accountSlug]);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [bottomNotice, setBottomNotice] = useState<string | null>(null);
  const [description, setDescription] = useState(() => account?.name ?? "");
  const [accountType, setAccountType] = useState<DebitAccountType>(() => account?.type ?? "Cheques");

  useEffect(() => {
    if (!bottomNotice) {
      return;
    }

    const timer = window.setTimeout(() => setBottomNotice(null), 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bottomNotice]);

  if (!account) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-8 pt-3 md:max-w-[560px] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=debito"
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">Cuenta no encontrada</h1>
            <div aria-hidden="true" />
          </header>

          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta cuenta mockeada todavía.
          </div>
        </div>
      </div>
    );
  }

  const accountHref = `/cuentas/debito/${account.slug}`;

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      {bottomNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="type-body fixed inset-x-0 bottom-[5.5rem] z-50 bg-[#f1efef] px-6 py-3 text-[#141414] shadow-[0_-12px_22px_rgba(0,0,0,0.18)] md:bottom-24 md:left-1/2 md:right-auto md:w-[min(32rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.1rem] md:px-5"
        >
          <div className="mx-auto w-full">{bottomNotice}</div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-28 pt-3 md:max-w-[560px] md:px-6 lg:max-w-[680px] lg:px-8">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href={accountHref}
            aria-label="Volver a cuenta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="type-subsection-title text-center font-semibold text-[var(--text-primary)]">
            Editar Cuenta
          </h1>

          <button
            type="button"
            aria-label="Eliminar cuenta"
            onClick={() => setActiveDialog("delete")}
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Trash2 size={22} strokeWidth={2.2} />
          </button>
        </header>

        <section className="px-1 pt-8 text-center md:pt-10">
          <p className="type-label text-[var(--text-primary)]">Balance</p>
          <p className="type-display mt-2 font-medium text-[var(--text-primary)]">{account.balance}</p>
        </section>

        <section className="mt-11 space-y-0">
          <div className="border-b border-[var(--line-strong)] pb-3">
            <label htmlFor="edit-account-description" className="type-label mb-2 block text-[var(--text-primary)]">
              Descripción
            </label>

            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <SquarePen size={16} className="shrink-0 text-white/92" />
              <input
                id="edit-account-description"
                name="description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="type-body min-h-9 min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
              />
            </div>
          </div>

          <div className="border-b border-[var(--line-strong)] pb-3 pt-3">
            <label htmlFor="edit-account-type" className="type-label mb-2 block text-[var(--text-primary)]">
              Tipo
            </label>

            <div className="relative flex items-center gap-3 text-[var(--text-primary)]">
              <Wallet size={16} className="shrink-0 text-white/92" />
              <select
                id="edit-account-type"
                name="accountType"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value as DebitAccountType)}
                className="type-body min-h-10 w-full appearance-none border-0 bg-transparent py-0 pr-7 font-medium outline-none"
              >
                {addAccountTypeOptions.map((option) => (
                  <option key={option} value={option} className="bg-[var(--app-bg)] text-[var(--text-primary)]">
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/80" />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[#111a23] px-6 pb-5 pt-5 shadow-[0_-10px_28px_rgba(0,0,0,0.28)] md:bottom-4 md:left-1/2 md:right-auto md:w-[min(34rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.2rem] md:border md:px-5 lg:w-[min(38rem,calc(100vw-4rem))]">
        <div className="mx-auto w-full">
          <button
            type="button"
            onClick={() => setBottomNotice("La persistencia de la edición todavía no está implementada.")}
            className="type-body flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)]"
          >
            Guardar
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={activeDialog === "delete"}
        title="Eliminar cuenta"
        description="Esto eliminará permanentemente la cuenta y todas sus transacciones asociadas, transacciones recurrentes y compras a meses. Esta acción no se puede deshacer."
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={() => {
          setActiveDialog(null);
          setBottomNotice("La eliminación de cuentas todavía no está implementada en esta fase mock.");
        }}
      />
    </div>
  );
}
