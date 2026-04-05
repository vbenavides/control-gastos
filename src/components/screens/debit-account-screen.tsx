"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, HeartPulse, Layers3, Pencil, PiggyBank, ShoppingCart, TrainFront, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AccountQuickActionsFab } from "@/components/account-quick-actions-fab";
import type { DebitAccountTransaction } from "@/lib/mock-data";
import { getDebitAccountDetail } from "@/lib/mock-data";

type TopNotice = {
  title: string;
  description: string;
};

function renderTransactionIcon(kind: DebitAccountTransaction["iconKind"]) {
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

export function DebitAccountScreen() {
  const params = useParams<{ accountSlug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountSlug = typeof params.accountSlug === "string" ? params.accountSlug : "";
  const searchQuery = searchParams.toString();

  const account = useMemo(() => getDebitAccountDetail(accountSlug), [accountSlug]);
  const [topNotice, setTopNotice] = useState<TopNotice | null>(null);
  const [bottomNotice, setBottomNotice] = useState<string | null>(null);

  const showUpdatedNotice = useCallback(() => {
    setTopNotice({
      title: `${account?.name ?? "Cuenta"}: ${account?.balance ?? "$0"}`,
      description: "Balance de cuenta actualizado",
    });
  }, [account]);

  useEffect(() => {
    if (!account) {
      return;
    }

    if (!searchQuery) {
      return;
    }

    const nextParams = new URLSearchParams(searchQuery);
    const shouldShowUpdated = nextParams.get("updated") === "1";
    const deletedLabel = nextParams.get("deleted");

    if (!shouldShowUpdated && !deletedLabel) {
      return;
    }

    const frame = window.setTimeout(() => {
      if (shouldShowUpdated) {
        setTopNotice({
          title: `${account.name}: ${account.balance}`,
          description: "Balance de cuenta actualizado",
        });
      }

      if (deletedLabel) {
        setBottomNotice(`Eliminado ${deletedLabel}`);
      }
    }, 0);

    router.replace(`/cuentas/debito/${account.slug}`, { scroll: false });

    return () => {
      window.clearTimeout(frame);
    };
  }, [account, router, searchQuery]);

  useEffect(() => {
    if (!topNotice) {
      return;
    }

    const timer = window.setTimeout(() => setTopNotice(null), 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [topNotice]);

  useEffect(() => {
    if (!bottomNotice) {
      return;
    }

    const timer = window.setTimeout(() => setBottomNotice(null), 3400);

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

      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-24 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href="/cuentas?tab=debito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="type-subsection-title text-center font-semibold text-[var(--text-primary)]">
            {account.name}
          </h1>

          <button type="button" aria-label="Editar cuenta" className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]">
            <Pencil size={21} strokeWidth={2.2} />
          </button>
        </header>

        <section className="px-1 pt-8 text-center md:pt-10">
          <p className="type-body text-[var(--text-primary)]">Balance</p>
          <p className="type-display mt-1 font-medium text-[var(--text-primary)]">
            {account.balance}
          </p>

          <button
            type="button"
            onClick={showUpdatedNotice}
            className="mx-auto mt-5 inline-flex min-h-[2.4rem] items-center justify-center rounded-full bg-[#0f2a39] px-5 text-[1rem] font-medium text-[var(--accent)]"
          >
            Actualizar Balance
          </button>
        </section>

        <section className="mt-20 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
          <h2 className="type-section-title font-medium text-[var(--text-primary)]">
            Transacciones recientes
          </h2>

          {account.recentTransactions.length === 0 ? (
            <div className="type-body mt-5 rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-5 text-[var(--text-secondary)]">
              Esta cuenta todavía no tiene transacciones mockeadas.
            </div>
          ) : (
            <div className="mt-4 space-y-3 md:space-y-3.5">
              {account.recentTransactions.map((transaction) => {
                return (
                  <Link
                    key={transaction.slug}
                    href={`/cuentas/debito/${account.slug}/transaccion/${transaction.slug}`}
                    className="block overflow-hidden rounded-[0.9rem] border border-white/[0.06] bg-[#17212b] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition hover:border-white/[0.11] hover:bg-[#1b2732]"
                  >
                    <div className="type-label flex min-h-[2rem] items-center justify-between border-b border-white/[0.06] bg-white/[0.065] px-3 text-white/84 md:min-h-[2.2rem] md:px-4">
                      <span>{transaction.dateLabel}</span>
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
                        <p className="type-label mt-1.5 text-white/82">
                          {transaction.accountName}
                        </p>
                      </div>

                      <div className="shrink-0 self-center text-right">
                        <p className="type-body text-[var(--text-primary)]">
                          {transaction.amount}
                        </p>
                        <p className="type-label mt-1.5 text-white/76">
                          {transaction.runningBalance}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AccountQuickActionsFab />
    </div>
  );
}
