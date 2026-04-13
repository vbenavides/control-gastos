"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, SquarePen, Trash2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import type { AccountType } from "@/lib/models";
import { addAccountTypeOptions } from "@/lib/mock-data";
import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";

type ActiveDialog = "delete" | null;

export function EditDebitAccountScreen() {
  const params = useParams<{ accountSlug: string }>();
  const router = useRouter();
  const accountId = typeof params.accountSlug === "string" ? params.accountSlug : "";

  const { accounts, isLoading, update, remove } = useDebitAccounts();
  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [bottomNotice, setBottomNotice] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState("0");
  const [accountType, setAccountType] = useState<AccountType>("Corriente");
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar campos cuando el account carga
  useEffect(() => {
    if (account) {
      setDescription(account.name);
      setBalance(String(account.balance));
      setAccountType(account.type);
    }
  }, [account]);

  useEffect(() => {
    if (!bottomNotice) return;
    const timer = window.setTimeout(() => setBottomNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [bottomNotice]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
          <div className="type-body flex flex-1 items-center justify-center text-[var(--text-secondary)]">
            Cargando…
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=debito"
              prefetch={true}
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
              Cuenta no encontrada
            </h1>
            <div aria-hidden="true" />
          </header>

          <div className="type-body flex flex-1 items-center justify-center px-4 text-center text-[var(--text-secondary)]">
            No encontramos esta cuenta.
          </div>
        </div>
      </div>
    );
  }

  const accountHref = `/cuentas/debito/${account.id}`;
  const accountCurrencyCode = account.currencyCode ?? DEFAULT_CURRENCY_CODE;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await update(account.id, {
        name: description.trim() || account.name,
        balance: parseNumericInput(balance),
        type: accountType,
      });
      router.push(`${accountHref}?updated=1`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setActiveDialog(null);
    await remove(account.id);
    router.push(`/cuentas?tab=debito&deleted=${encodeURIComponent(account.name)}`);
  };

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

      <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-28 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
        <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-2">
          <Link
            href={accountHref}
            prefetch={true}
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

          <div className="type-display mt-2.5 flex items-baseline justify-center gap-[1px] font-medium text-[var(--text-primary)]">
            <span aria-hidden="true">$</span>
            <label htmlFor="edit-account-balance" className="sr-only">
              Balance de la cuenta
            </label>
            <input
              id="edit-account-balance"
              name="balance"
              type="text"
              inputMode="numeric"
              value={formatMoneyInput(balance, accountCurrencyCode)}
              onChange={(event) => setBalance(sanitizeNumericInput(stripMoneyFormat(event.target.value, accountCurrencyCode), "integer"))}
              onBlur={() => setBalance((current) => normalizeNumericBlurValue(current, "integer"))}
              style={{ width: getNumericInputWidth(formatMoneyInput(balance, accountCurrencyCode)) }}
              className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
            />
          </div>


        </section>

        <section className="mt-11 space-y-0">
          <div className="border-b border-[var(--line-strong)] pb-3">
            <label
              htmlFor="edit-account-description"
              className="type-label mb-2 block text-[var(--text-primary)]"
            >
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
            <label
              htmlFor="edit-account-type"
              className="type-label mb-2 block text-[var(--text-primary)]"
            >
              Tipo
            </label>

            <div className="relative flex items-center gap-3 text-[var(--text-primary)]">
              <Wallet size={16} className="shrink-0 text-white/92" />
              <select
                id="edit-account-type"
                name="accountType"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value as AccountType)}
                className="type-body min-h-10 w-full appearance-none border-0 bg-transparent py-0 pr-7 font-medium outline-none"
              >
                {addAccountTypeOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className="bg-[var(--app-bg)] text-[var(--text-primary)]"
                  >
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/80"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[#111a23] px-6 pb-5 pt-5 shadow-[0_-10px_28px_rgba(0,0,0,0.28)] md:bottom-4 md:left-1/2 md:right-auto md:w-[min(34rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.2rem] md:border md:px-5 lg:w-[min(38rem,calc(100vw-4rem))]">
        <div className="mx-auto w-full">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="type-body flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] disabled:opacity-60"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={activeDialog === "delete"}
        title="Eliminar cuenta"
        description="Esto eliminará permanentemente la cuenta y todas sus transacciones asociadas. Esta acción no se puede deshacer."
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmClassName="text-[#ff5a3d]"
        onCancel={() => setActiveDialog(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
