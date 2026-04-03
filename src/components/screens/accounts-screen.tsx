import { CreditCard, Wallet } from "lucide-react";
import { accountGroups, accountTabs } from "@/lib/mock-data";
import { Segmented, SurfaceCard } from "@/components/ui-kit";

export function AccountsScreen() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-7 pt-7">
      <h1 className="text-[2rem] font-medium tracking-[-0.04em] md:text-[2.35rem]">Cuentas</h1>

      <div>
        <Segmented items={accountTabs} className="bg-transparent p-0" activeIndex={0} />
        <div className="mt-2 h-[2px] bg-white/6">
          <div className="h-full w-1/3 rounded-full bg-[var(--accent)]" />
        </div>
      </div>

      <div className="space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {accountGroups.map((group, index) => {
          const Icon = index === 0 ? CreditCard : Wallet;
          return (
            <SurfaceCard key={group.title} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-black/50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-white/90" />
                  <p className="text-xl font-medium">{group.title}</p>
                </div>
                <p className="text-xl font-semibold">{group.total}</p>
              </div>

              <div>
                {group.items.map((item, itemIndex) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-4 py-5 text-lg ${
                      itemIndex > 0 ? "border-t border-[var(--line)]" : ""
                    }`}
                  >
                    <p className="text-[var(--text-primary)]">{item.name}</p>
                    <p className="font-medium text-[var(--text-primary)]">{item.balance}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      <div className="border-t border-[var(--line)] pt-4">
        <div className="flex items-center justify-between text-xl font-medium">
          <span>Balance Total</span>
          <span>$33.210</span>
        </div>
      </div>

      <button
        type="button"
        className="mx-auto flex rounded-full bg-[var(--accent-soft)] px-8 py-3 text-lg font-medium text-[var(--accent)]"
      >
        Agregar Cuenta
      </button>
    </div>
  );
}
