"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatAmountCLP } from "@/lib/currency";
import type { AccountType, CreditCard as CreditCardModel, DebitAccount } from "@/lib/models";
import { accountTabs } from "@/lib/mock-data";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";

type AccountTab = (typeof accountTabs)[number];

const DEBIT_TAB = "Cuentas de débito" as const;
const CREDIT_TAB = "Tarjetas de crédito" as const;
const DEBIT_TAB_PATH = "/cuentas?tab=debito";
const CREDIT_TAB_PATH = "/cuentas?tab=credito";
const ADD_ACTION_BUTTON_CLASS =
  "type-body mx-auto mt-8 flex min-h-[2.55rem] items-center justify-center rounded-full bg-[#0f2a39] px-9 font-medium text-[var(--accent)]";

type DebitGroup = {
  title: AccountType;
  total: number;
  items: DebitAccount[];
};

function groupAccountsByType(accounts: DebitAccount[]): DebitGroup[] {
  const order: AccountType[] = ["Cheques", "Ahorro", "Efectivo"];
  const map = new Map<AccountType, DebitAccount[]>();

  for (const account of accounts) {
    const group = map.get(account.type) ?? [];
    group.push(account);
    map.set(account.type, group);
  }

  return order
    .filter((type) => map.has(type))
    .map((type) => ({
      title: type,
      total: (map.get(type) ?? []).reduce((sum, a) => sum + a.balance, 0),
      items: map.get(type) ?? [],
    }));
}

export function AccountsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "credito" ? CREDIT_TAB : DEBIT_TAB;
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  const { accounts, isLoading: accountsLoading } = useDebitAccounts();
  const { cards, isLoading: cardsLoading } = useCreditCards();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    router.prefetch("/cuentas/agregar");
    router.prefetch("/cuentas/tarjeta/agregar");

    for (const account of accounts ?? []) {
      router.prefetch(`/cuentas/debito/${account.id}`);
    }
  }, [accounts, router]);

  const isCreditTab = activeTab === CREDIT_TAB;

  const debitGroups = useMemo(() => groupAccountsByType(accounts ?? []), [accounts]);
  const debitTotal = useMemo(
    () => (accounts ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );
  const creditTotal = useMemo(
    () => (cards ?? []).reduce((sum, c) => sum + c.balance, 0),
    [cards],
  );

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    router.replace(tab === CREDIT_TAB ? CREDIT_TAB_PATH : DEBIT_TAB_PATH, { scroll: false });
  };

  return (
    <div className="mx-auto w-full max-w-[540px] pt-5 md:max-w-[920px] lg:max-w-[1080px]">
      <h1 className="type-page-title font-medium text-[var(--text-primary)]">Cuentas</h1>

      <div className="mt-8 border-b border-white/6">
        <div className="grid grid-cols-2 items-end text-center">
          {accountTabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`type-body relative px-3 pb-3.5 font-medium transition-colors ${
                  isActive ? "text-[var(--accent)]" : "text-white/80"
                }`}
              >
                <span>{tab}</span>
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-[136px] bg-[var(--accent)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {isCreditTab ? (
        <CreditCardsPanel cards={cards ?? []} isLoading={cardsLoading} />
      ) : (
        <DebitAccountsPanel groups={debitGroups} isLoading={accountsLoading} />
      )}

      <div className="mt-9 border-t border-white/12 pt-4">
        <div className="type-body flex items-center justify-between text-[var(--text-primary)]">
          <span className="font-medium">Balance Total</span>
          <span className="font-semibold">
            {formatAmountCLP(isCreditTab ? creditTotal : debitTotal)}
          </span>
        </div>
      </div>

      {isCreditTab ? (
        <button
          type="button"
          onClick={() => router.push("/cuentas/tarjeta/agregar")}
          className={ADD_ACTION_BUTTON_CLASS}
        >
          Agregar Tarjeta
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.push("/cuentas/agregar")}
          className={ADD_ACTION_BUTTON_CLASS}
        >
          Agregar Cuenta
        </button>
      )}
    </div>
  );
}

function DebitAccountsPanel({
  groups,
  isLoading,
}: Readonly<{ groups: DebitGroup[]; isLoading: boolean }>) {
  const router = useRouter();

  if (isLoading) {
    return <div className="mt-7 type-body text-[var(--text-secondary)]">Cargando cuentas…</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="mt-10 type-body rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-6 text-center text-[var(--text-secondary)]">
        No tenés cuentas de débito todavía. ¡Agregá una!
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
      {groups.map((group, index) => {
        const Icon = index === 0 ? CreditCard : Banknote;

        return (
          <div
            key={group.title}
            className="overflow-hidden rounded-[0.95rem] border border-white/[0.07] bg-[#17212b]"
          >
            <div className="flex items-center justify-between gap-3 bg-[#04080c] px-4 py-[0.9rem]">
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2.1} className="text-white/90" />
                <p className="type-body font-medium text-white">{group.title}</p>
              </div>
              <p className="type-body font-semibold text-white">{formatAmountCLP(group.total)}</p>
            </div>

            <div className="bg-[#17212b]">
              {group.items.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/cuentas/debito/${item.id}`)}
                  className={`flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-white/[0.03] ${
                    itemIndex > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <p className="type-body text-[var(--text-primary)]">{item.name}</p>
                  <p className="type-body font-medium text-[var(--text-primary)]">
                    {formatAmountCLP(item.balance)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreditCardsPanel({
  cards,
  isLoading,
}: Readonly<{ cards: CreditCardModel[]; isLoading: boolean }>) {
  if (isLoading) {
    return <div className="mt-7 type-body text-[var(--text-secondary)]">Cargando tarjetas…</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="mt-10 type-body rounded-[1rem] border border-white/8 bg-[var(--surface)] px-4 py-6 text-center text-[var(--text-secondary)]">
        No tenés tarjetas de crédito todavía. ¡Agregá una!
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
      {cards.map((card) => (
        <section
          key={card.id}
          className="overflow-hidden rounded-[0.95rem] border border-white/[0.07] bg-[#17212b] px-4 py-4 shadow-[0_14px_28px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CreditCard size={18} strokeWidth={2.1} className="text-white/92" />
              <p className="type-body font-medium text-white">{card.name}</p>
            </div>

            <p className="type-label tracking-[0.03em] text-white/72">**** {card.last4}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <p className="type-label text-white/72">Balance</p>
              <p className="type-display mt-0.5 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(card.balance)}
              </p>
            </div>

            <div className="text-right">
              <p className="type-label text-white/72">Disponible</p>
              <div className="ml-auto mt-1 h-1 w-[6.5rem] rounded-full bg-[#2d4e3b]" />
              <p className="type-body mt-1 font-medium text-[var(--text-primary)]">
                {formatAmountCLP(card.limit - card.balance)}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-3">
            <div className="type-label flex items-center gap-2 text-[var(--text-secondary)]">
              <CircleCheck size={15} strokeWidth={2.2} className="shrink-0 text-[#8de56c]" />
              <p>No tienes pagos pendientes para este periodo</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
