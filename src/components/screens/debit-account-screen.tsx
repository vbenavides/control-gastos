"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  HeartPulse,
  Layers3,
  Pencil,
  PiggyBank,
  ShoppingCart,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AccountQuickActionsFab } from "@/components/account-quick-actions-fab";
import { DEFAULT_CURRENCY_CODE, formatAmountCLP } from "@/lib/currency";
import type { Transaction, TransactionIconKind } from "@/lib/models";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import {
  formatMoneyInput,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useTransactions } from "@/lib/hooks/use-transactions";

type TopNotice = {
  title: string;
  description: string;
};

function renderTransactionIcon(kind: TransactionIconKind) {
  switch (kind) {
    case "piggy-bank":
      return <PiggyBank size={15} strokeWidth={2.2} />;
    case "shopping-cart":
      return <ShoppingCart size={15} strokeWidth={2.2} />;
    case "layers":
      return <Layers3 size={15} strokeWidth={2.2} />;
    case "train":
      return <TrainFront size={15} strokeWidth={2.2} />;
    case "heart":
      return <HeartPulse size={15} strokeWidth={2.2} />;
    case "utensils":
      return <UtensilsCrossed size={15} strokeWidth={2.2} />;
  }
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function DebitAccountScreen() {
  const params = useParams<{ accountSlug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = typeof params.accountSlug === "string" ? params.accountSlug : "";
  const searchQuery = searchParams.toString();

  const { accounts, isLoading: accountsLoading, update: updateAccount } = useDebitAccounts();
  const { transactions, isLoading: txLoading } = useTransactions();

  const account = useMemo(
    () => (accounts ?? []).find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  const recentTransactions = useMemo(
    () =>
      (transactions ?? [])
        .filter((t) => t.accountId === accountId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    [transactions, accountId],
  );

  const [topNotice, setTopNotice] = useState<TopNotice | null>(null);
  const [bottomNotice, setBottomNotice] = useState<string | null>(null);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceInputValue, setBalanceInputValue] = useState("0");

  const openBalanceDialog = useCallback(() => {
    setBalanceInputValue(account ? String(account.balance) : "0");
    setShowBalanceDialog(true);
  }, [account]);

  const handleSaveBalance = useCallback(async () => {
    if (!account) return;
    const parsed = parseNumericInput(balanceInputValue);
    await updateAccount(account.id, { balance: parsed });
    setShowBalanceDialog(false);
    setTopNotice({
      title: `${account.name}: ${formatAmountCLP(parsed)}`,
      description: "Balance de cuenta actualizado",
    });
  }, [account, balanceInputValue, updateAccount]);

  // Leer query params de navegación (updated, deleted)
  useEffect(() => {
    if (!account || !searchQuery) return;

    const nextParams = new URLSearchParams(searchQuery);
    const shouldShowUpdated = nextParams.get("updated") === "1";
    const deletedLabel = nextParams.get("deleted");

    if (!shouldShowUpdated && !deletedLabel) return;

    const frame = window.setTimeout(() => {
      if (shouldShowUpdated) {
        setTopNotice({
          title: `${account.name}: ${formatAmountCLP(account.balance)}`,
          description: "Balance de cuenta actualizado",
        });
      }
      if (deletedLabel) {
        setBottomNotice(`Eliminado ${deletedLabel}`);
      }
    }, 0);

    router.replace(`/cuentas/debito/${account.id}`, { scroll: false });

    return () => window.clearTimeout(frame);
  }, [account, router, searchQuery]);

  useEffect(() => {
    if (!topNotice) return;
    const timer = window.setTimeout(() => setTopNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [topNotice]);

  useEffect(() => {
    if (!bottomNotice) return;
    const timer = window.setTimeout(() => setBottomNotice(null), 3400);
    return () => window.clearTimeout(timer);
  }, [bottomNotice]);

  useEffect(() => {
    if (!showBalanceDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowBalanceDialog(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBalanceDialog]);

  useEffect(() => {
    if (!account) {
      return;
    }

    router.prefetch(`/cuentas/debito/${account.id}/editar`);
    router.prefetch(`/cuentas/debito/${account.id}/transacciones`);

    for (const transaction of recentTransactions) {
      router.prefetch(`/cuentas/debito/${account.id}/transaccion/${transaction.id}`);
    }
  }, [account, recentTransactions, router]);

  // Estado: cargando
  if (accountsLoading) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col items-center justify-center px-4">
          <p className="type-body text-[var(--text-secondary)]">Cargando…</p>
        </div>
      </div>
    );
  }

  // Estado: no encontrada
  if (!account) {
    return (
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-8 pt-3 md:max-w-[40rem] md:px-6 lg:max-w-[680px] lg:px-8">
          <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
            <Link
              href="/cuentas?tab=debito"
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

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
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

      {bottomNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="type-body fixed inset-x-0 bottom-0 z-50 bg-[#f1efef] px-6 py-3 text-[#141414] shadow-[0_-12px_22px_rgba(0,0,0,0.18)] md:bottom-4 md:left-1/2 md:right-auto md:w-[min(50rem,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-[1.1rem] md:px-5 lg:w-[min(54rem,calc(100vw-4rem))]"
        >
          <div className="mx-auto w-full">{bottomNotice}</div>
        </div>
      ) : null}

      <div className="mx-auto flex h-dvh w-full max-w-[36rem] flex-col px-4 pb-0 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <header className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-white/[0.06] bg-[var(--app-bg)] pb-4 pt-1">
          <Link
            href="/cuentas?tab=debito"
            prefetch={true}
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="type-subsection-title text-center font-semibold text-[var(--text-primary)]">
            {account.name}
          </h1>

          <Link
            href={`/cuentas/debito/${account.id}/editar`}
            prefetch={true}
            aria-label="Editar cuenta"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <Pencil size={21} strokeWidth={2.2} />
          </Link>
        </header>

        <div className="scroll-safe-edge min-h-0 flex-1 overflow-y-auto pb-24">
          <section className="px-1 pt-8 text-center md:pt-10">
            <p className="type-body text-[var(--text-primary)]">Balance</p>
            <p className="type-display mt-1 font-medium text-[var(--text-primary)]">
              {formatAmountCLP(account.balance)}
            </p>

            <button
              type="button"
              onClick={openBalanceDialog}
              className="mx-auto mt-5 inline-flex min-h-[2.4rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[1rem] font-medium text-[var(--accent)]"
            >
              Actualizar Balance
            </button>
          </section>

          <section className="mt-20 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
            <h2 className="type-section-title font-medium text-[var(--text-primary)]">
              Transacciones recientes
            </h2>

            {txLoading ? (
              <div className="type-body mt-5 text-[var(--text-secondary)]">
                Cargando transacciones…
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="type-body mt-5 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
                Esta cuenta todavía no tiene transacciones.
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3 md:space-y-3.5">
                  {recentTransactions.map((transaction: Transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/cuentas/debito/${account.id}/transaccion/${transaction.id}`}
                      prefetch={true}
                      className="block overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:border-white/[0.11] hover:bg-[#1b2732]"
                    >
                      <div className="type-label flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 text-white/84 md:min-h-[2.2rem] md:px-4">
                        <span>{formatDateLabel(transaction.date)}</span>
                        <Check size={15} strokeWidth={2.3} className="shrink-0" />
                      </div>

                      <div className="flex min-h-[4.8rem] items-center gap-3 px-3 py-3 md:min-h-[5.15rem] md:px-4 md:py-3.5">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.78rem] md:h-10 md:w-10"
                          style={{
                            backgroundColor: transaction.iconBackground,
                            color: transaction.iconColor,
                          }}
                        >
                          {renderTransactionIcon(transaction.iconKind)}
                        </div>

                        <div className="min-w-0 flex-1 self-center">
                          <p className="type-body truncate text-[var(--text-primary)]">
                            {transaction.description}
                          </p>
                          <p className="type-label mt-1.5 text-white/82">{account.name}</p>
                        </div>

                        <div className="shrink-0 self-center text-right">
                          <p className="type-body text-[var(--text-primary)]">
                            {formatAmountCLP(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex justify-center px-1 pb-5 pt-7">
                  <Link
                    href={`/cuentas/debito/${account.id}/transacciones`}
                    prefetch={true}
                    className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full bg-[#0f2a39] px-8 text-[0.98rem] font-medium text-[var(--accent)] shadow-[0_10px_22px_rgba(2,10,18,0.24)] transition hover:bg-[#123247]"
                  >
                    Ver todas las transacciones
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <AccountQuickActionsFab hasBottomNotice={!!bottomNotice} />

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
                htmlFor="balance-input"
                className="type-label block text-center text-[var(--text-secondary)]"
              >
                Balance
              </label>
              <input
                id="balance-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={formatMoneyInput(balanceInputValue, account.currencyCode ?? DEFAULT_CURRENCY_CODE)}
                onChange={(event) =>
                  setBalanceInputValue(sanitizeNumericInput(stripMoneyFormat(event.target.value, account.currencyCode ?? DEFAULT_CURRENCY_CODE), "integer"))
                }
                onBlur={() =>
                  setBalanceInputValue((current) => normalizeNumericBlurValue(current, "integer"))
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
    </div>
  );
}
