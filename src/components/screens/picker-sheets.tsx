"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Search, Wallet, X } from "lucide-react";

import { useCategories } from "@/lib/hooks/use-categories";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { resolveIcon } from "@/lib/category-icons";
import type { CategoryType } from "@/lib/models";

// ─── Sheet animation hook ─────────────────────────────────────────────────────

function useSheetAnimation(onClose: () => void) {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setIsVisible(true));
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dismiss]);

  return { isVisible, dismiss };
}

// ─── Shared sheet shell ───────────────────────────────────────────────────────

function PickerSheetShell({
  title,
  isVisible,
  onDismiss,
  children,
}: {
  title: string;
  isVisible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        className={[
          "absolute inset-0 transition-[background-color] duration-200",
          isVisible ? "bg-black/60" : "bg-black/0",
        ].join(" ")}
        onClick={onDismiss}
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          "relative z-10 flex min-h-[68svh] max-h-[88svh] flex-col",
          "rounded-t-[1.4rem] bg-[#0d1423]",
          "shadow-[0_-24px_60px_rgba(0,0,0,0.7)]",
          "transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
          "sm:mx-auto sm:w-full sm:max-w-[640px] lg:max-w-[720px]",
        ].join(" ")}
        style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 py-5">
          <h3 className="text-[1.05rem] font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.12] text-white/60 transition hover:bg-white/[0.18] hover:text-white"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="h-px shrink-0 bg-white/[0.08]" />
        {children}
      </div>
    </div>
  );
}

function SheetFooter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="shrink-0 border-t border-white/[0.08] px-5 pb-7 pt-4">
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-2xl bg-[var(--accent)] py-[0.9rem] text-[0.95rem] font-semibold text-white shadow-[0_8px_24px_rgba(41,187,243,0.2)] transition hover:brightness-105"
      >
        {label}
      </button>
    </div>
  );
}

// ─── Category Picker Sheet ────────────────────────────────────────────────────

export type CategoryPickerSheetProps = {
  type: CategoryType;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function CategoryPickerSheet({
  type,
  selected,
  onSelect,
  onClose,
}: CategoryPickerSheetProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const { isVisible, dismiss } = useSheetAnimation(onClose);

  function handleSelect(id: string) {
    onSelect(id);
    dismiss();
  }

  function handleCreateNew() {
    // Mark that this picker should reopen when we return
    sessionStorage.setItem("__returnPicker", "category");
    router.push(`/gestion/categorias/nueva?type=${type}&from=picker`);
  }

  const filtered = (categories ?? [])
    .filter((c) => (c.type ?? "expense") === type)
    .filter(
      (c) =>
        !search.trim() ||
        c.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

  return (
    <PickerSheetShell title="Categoría" isVisible={isVisible} onDismiss={dismiss}>
      {/* Search bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-6 py-3">
        <input
          type="search"
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          className="flex-1 bg-transparent text-[0.94rem] text-white outline-none placeholder:text-white/35"
        />
        <Search size={17} className="shrink-0 text-white/35" />
      </div>

      {/* Category list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          <>
            <p className="px-6 pb-2 pt-4 text-[0.76rem] font-medium uppercase tracking-wider text-white/35">
              Sin grupo
            </p>
            {filtered.map((cat) => {
              const Icon = resolveIcon(cat.iconKey);
              const isSelected = selected === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className="flex w-full items-center gap-4 px-6 py-3 transition hover:bg-white/[0.04]"
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.55rem]"
                    style={{ backgroundColor: cat.accent }}
                  >
                    <Icon size={18} strokeWidth={1.8} color="#fff" />
                  </div>
                  <span
                    className={[
                      "text-[0.94rem]",
                      isSelected
                        ? "font-medium text-[var(--accent)]"
                        : "text-white",
                    ].join(" ")}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <p className="px-6 py-12 text-center text-[0.9rem] text-white/35">
            No se encontraron categorías
          </p>
        )}
      </div>

      <SheetFooter label="Nueva Categoría" onClick={handleCreateNew} />
    </PickerSheetShell>
  );
}

// ─── Account Picker Sheet ─────────────────────────────────────────────────────

export type AccountPickerSheetProps = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /**
   * Key stored in sessionStorage so the parent form knows which picker to
   * reopen when the user returns from the add-account flow.
   * Defaults to "account".
   */
  pickerKey?: string;
};

export function AccountPickerSheet({
  selected,
  onSelect,
  onClose,
  pickerKey = "account",
}: AccountPickerSheetProps) {
  const router = useRouter();
  const { accounts } = useDebitAccounts();
  const { isVisible, dismiss } = useSheetAnimation(onClose);

  function handleSelect(id: string) {
    onSelect(id);
    dismiss();
  }

  function handleAddAccount() {
    sessionStorage.setItem("__returnPicker", pickerKey);
    router.push("/cuentas/agregar?from=picker");
  }

  const list = accounts ?? [];

  return (
    <PickerSheetShell title="Cuentas" isVisible={isVisible} onDismiss={dismiss}>
      {/* Account list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length > 0 ? (
          list.map((account) => {
            const isSelected = selected === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSelect(account.id)}
                className="flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4 transition hover:bg-white/[0.04]"
              >
                <div className="text-left">
                  <p
                    className={[
                      "text-[0.95rem] font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-white",
                    ].join(" ")}
                  >
                    {account.name}
                  </p>
                  <p className="mt-0.5 text-[0.82rem] text-white/45">
                    ${account.balance.toLocaleString("es-CL")}
                  </p>
                </div>
                <Wallet size={20} className="shrink-0 text-white/30" />
              </button>
            );
          })
        ) : (
          <p className="px-6 py-12 text-center text-[0.9rem] text-white/35">
            No tienes cuentas creadas
          </p>
        )}
      </div>

      <SheetFooter label="Agregar Cuenta" onClick={handleAddAccount} />
    </PickerSheetShell>
  );
}

// ─── Credit Card Picker Sheet ─────────────────────────────────────────────────

export type CreditCardPickerSheetProps = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function CreditCardPickerSheet({
  selected,
  onSelect,
  onClose,
}: CreditCardPickerSheetProps) {
  const router = useRouter();
  const { cards } = useCreditCards();
  const { isVisible, dismiss } = useSheetAnimation(onClose);

  function handleSelect(id: string) {
    onSelect(id);
    dismiss();
  }

  function handleAddCard() {
    sessionStorage.setItem("__returnPicker", "credit-card");
    router.push("/cuentas/tarjeta/agregar?from=picker");
  }

  const list = cards ?? [];

  return (
    <PickerSheetShell title="Tarjetas de crédito" isVisible={isVisible} onDismiss={dismiss}>
      {/* Card list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length > 0 ? (
          list.map((card) => {
            const isSelected = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelect(card.id)}
                className="flex w-full items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-4 transition hover:bg-white/[0.04]"
              >
                <div className="text-left">
                  <p
                    className={[
                      "text-[0.95rem] font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-white",
                    ].join(" ")}
                  >
                    {card.name}
                  </p>
                  <p className="mt-0.5 text-[0.82rem] text-white/45">
                    ${card.balance.toLocaleString("es-CL")}
                  </p>
                </div>
                <CreditCard size={20} className="shrink-0 text-white/30" />
              </button>
            );
          })
        ) : (
          <p className="px-6 py-12 text-center text-[0.9rem] text-white/35">
            No tienes tarjetas creadas
          </p>
        )}
      </div>

      <SheetFooter label="Agregar Tarjeta" onClick={handleAddCard} />
    </PickerSheetShell>
  );
}
