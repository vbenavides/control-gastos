"use client";

import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import { useState } from "react";

import { accountTabs, creditCardAccounts, debitAccountGroups } from "@/lib/mock-data";

type AccountTab = (typeof accountTabs)[number];

const DEBIT_TAB = "Cuentas de débito" as const;
const CREDIT_TAB = "Tarjetas de crédito" as const;

export function AccountsScreen() {
  const [activeTab, setActiveTab] = useState<AccountTab>(DEBIT_TAB);

  const isCreditTab = activeTab === CREDIT_TAB;

  return (
    <div className="mx-auto w-full max-w-[540px] pt-5 md:max-w-[920px] lg:max-w-[1080px]">
      <h1 className="text-[1.92rem] font-medium tracking-[-0.055em] text-[var(--text-primary)]">Cuentas</h1>

      <div className="mt-8 border-b border-white/6">
        <div className="grid grid-cols-2 items-end text-center">
          {accountTabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 pb-3.5 text-[1rem] font-medium transition-colors ${
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
        <div className="flex items-center justify-between text-[1rem] text-[var(--text-primary)]">
          <span className="font-medium">Balance Total</span>
          <span className="font-semibold">{isCreditTab ? "$0" : "$33.210"}</span>
        </div>
      </div>

      <button
        type="button"
        className="mx-auto mt-8 flex min-h-[2.55rem] items-center justify-center rounded-full bg-[#0f2a39] px-9 text-[1rem] font-medium text-[var(--accent)]"
      >
        {isCreditTab ? "Agregar Tarjeta" : "Agregar Cuenta"}
      </button>
    </div>
  );
}

function DebitAccountsPanel() {
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
                <p className="text-[1rem] font-medium text-white">{group.title}</p>
              </div>
              <p className="text-[1rem] font-semibold text-white">{group.total}</p>
            </div>

            <div className="bg-[#17212b]">
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.name}
                  className={`flex items-center justify-between px-4 py-4 ${
                    itemIndex > 0 ? "border-t border-[var(--line)]" : ""
                  }`}
                >
                  <p className="text-[1rem] text-[var(--text-primary)]">{item.name}</p>
                  <p className="text-[1rem] font-medium text-[var(--text-primary)]">{item.balance}</p>
                </div>
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
              <p className="text-[0.98rem] font-medium text-white">{card.name}</p>
            </div>

            <p className="text-[0.86rem] tracking-[0.03em] text-white/72">{card.maskedNumber}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <p className="text-[0.9rem] text-white/72">Balance</p>
              <p className="mt-0.5 text-[1.76rem] font-medium leading-none text-[var(--text-primary)]">{card.balance}</p>
            </div>

            <div className="text-right">
              <p className="text-[0.9rem] text-white/72">{card.availableLabel}</p>
              <div className="ml-auto mt-1 h-1 w-[6.5rem] rounded-full bg-[#2d4e3b]" />
              <p className="mt-1 text-[1.05rem] font-medium leading-none text-[var(--text-primary)]">{card.availableAmount}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2 text-[0.88rem] text-[var(--text-secondary)]">
              <CircleCheck size={15} strokeWidth={2.2} className="shrink-0 text-[#8de56c]" />
              <p>{card.status}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
