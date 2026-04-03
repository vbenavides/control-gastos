import { Banknote, CreditCard } from "lucide-react";
import { accountGroups, accountTabs } from "@/lib/mock-data";

export function AccountsScreen() {
  return (
    <div className="mx-auto w-full max-w-[540px] pt-5 md:max-w-[920px] lg:max-w-[1080px]">
      <h1 className="text-[1.92rem] font-medium tracking-[-0.055em] text-[var(--text-primary)]">Cuentas</h1>

      <div className="mt-8 border-b border-white/6">
        <div className="grid grid-cols-2 items-end text-center">
          {accountTabs.map((tab, index) => {
            const isActive = index === 0;

            return (
              <div
                key={tab}
                className={`relative px-3 pb-3.5 text-[1rem] font-medium ${
                  isActive ? "text-[var(--accent)]" : "text-white/80"
                }`}
              >
                <span>{tab}</span>
                {isActive ? <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-[136px] bg-[var(--accent)]" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {accountGroups.map((group, index) => {
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

      <div className="mt-9 border-t border-white/12 pt-4">
        <div className="flex items-center justify-between text-[1rem] text-[var(--text-primary)]">
          <span className="font-medium">Balance Total</span>
          <span className="font-semibold">$33.210</span>
        </div>
      </div>

      <button
        type="button"
        className="mx-auto mt-8 flex min-h-[2.55rem] items-center justify-center rounded-full bg-[#0f2a39] px-9 text-[1rem] font-medium text-[var(--accent)]"
      >
        Agregar Cuenta
      </button>
    </div>
  );
}
