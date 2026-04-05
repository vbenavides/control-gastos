"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

import { accountTabs, creditCardAccounts, debitAccountGroups } from "@/lib/mock-data";

type AccountTab = (typeof accountTabs)[number];

const DEBIT_TAB = "Cuentas de débito" as const;
const CREDIT_TAB = "Tarjetas de crédito" as const;
const DEBIT_TAB_PATH = "/cuentas?tab=debito";
const CREDIT_TAB_PATH = "/cuentas?tab=credito";
const ADD_ACTION_BUTTON_CLASS =
  "type-body mx-auto mt-8 flex min-h-[2.55rem] items-center justify-center rounded-full bg-[#0f2a39] px-9 font-medium text-[var(--accent)]";

export function AccountsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "credito" ? CREDIT_TAB : DEBIT_TAB;
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isCreditTab = activeTab === CREDIT_TAB;

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

      {isCreditTab ? <CreditCardsPanel /> : <DebitAccountsPanel />}

      <div className="mt-9 border-t border-white/12 pt-4">
        <div className="type-body flex items-center justify-between text-[var(--text-primary)]">
          <span className="font-medium">Balance Total</span>
          <span className="font-semibold">{isCreditTab ? "$0" : "$33.210"}</span>
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

function DebitAccountsPanel() {
  const router = useRouter();

  return (
    <div className="mt-7 space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
      {debitAccountGroups.map((group, index) => {
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
              <p className="type-body font-semibold text-white">{group.total}</p>
            </div>

            <div className="bg-[#17212b]">
              {group.items.map((item, itemIndex) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => router.push(`/cuentas/debito/${item.slug}`)}
                  className={`flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-white/[0.03] ${
                    itemIndex > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <p className="type-body text-[var(--text-primary)]">{item.name}</p>
                  <p className="type-body font-medium text-[var(--text-primary)]">{item.balance}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreditCardsPanel() {
  return (
    <div className="mt-10 space-y-5">
      {creditCardAccounts.map((card) => (
        <section
          key={`${card.name}-${card.maskedNumber}`}
          className="overflow-hidden rounded-[0.95rem] border border-white/[0.07] bg-[#17212b] px-4 py-4 shadow-[0_14px_28px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard size={18} strokeWidth={2.1} className="text-white/92" />
                <p className="type-body font-medium text-white">{card.name}</p>
              </div>

              <p className="type-label tracking-[0.03em] text-white/72">{card.maskedNumber}</p>
            </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <p className="type-label text-white/72">Balance</p>
              <p className="type-display mt-0.5 font-medium text-[var(--text-primary)]">{card.balance}</p>
            </div>

            <div className="text-right">
              <p className="type-label text-white/72">{card.availableLabel}</p>
              <div className="ml-auto mt-1 h-1 w-[6.5rem] rounded-full bg-[#2d4e3b]" />
              <p className="type-body mt-1 font-medium text-[var(--text-primary)]">{card.availableAmount}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-3">
            <div className="type-label flex items-center gap-2 text-[var(--text-secondary)]">
              <CircleCheck size={15} strokeWidth={2.2} className="shrink-0 text-[#8de56c]" />
              <p>{card.status}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
