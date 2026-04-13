"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Building2, CreditCard, DollarSign, Search, Wallet, X } from "lucide-react";

import { useCategories } from "@/lib/hooks/use-categories";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { resolveIcon } from "@/lib/category-icons";
import type { AccountType, CategoryType } from "@/lib/models";

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
          isVisible ? "bg-black/55" : "bg-black/0",
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
          "rounded-t-[1.4rem] bg-[var(--app-bg-elevated)]",
          "border-t border-x border-[var(--line)]",
          "shadow-[0_-20px_60px_rgba(0,0,0,0.55)]",
          "transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
          "sm:mx-auto sm:w-full sm:max-w-[640px] lg:max-w-[720px]",
        ].join(" ")}
        style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-[3px] w-10 rounded-full bg-white/20" />
        </div>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-2">
          <h3 className="type-subsection-title font-semibold text-[var(--text-primary)]">{title}</h3>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
        <div className="h-px shrink-0 bg-[var(--line)]" />
        {children}
      </div>
    </div>
  );
}

function SheetFooter({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="shrink-0 border-t border-[var(--line)] px-5 pb-7 pt-4">
      <button
        type="button"
        onClick={onClick}
        className="type-body w-full rounded-[0.9rem] bg-[var(--accent)] py-[0.85rem] font-semibold text-white shadow-[0_8px_24px_rgba(41,187,243,0.18)] transition hover:brightness-105"
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
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--line)] px-6 py-3">
        <input
          type="search"
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          className="type-body flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <Search size={17} className="shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* Category list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          <>
            <p className="px-6 pb-2 pt-4 text-[0.76rem] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
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
                  className="flex w-full items-center gap-4 px-6 py-3 transition hover:bg-[var(--surface)]"
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.55rem]"
                    style={{ backgroundColor: cat.accent }}
                  >
                    <Icon size={18} strokeWidth={1.8} color="#fff" />
                  </div>
                  <span
                    className={[
                      "type-body",
                      isSelected
                        ? "font-medium text-[var(--accent)]"
                        : "text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <p className="type-body px-6 py-12 text-center text-[var(--text-tertiary)]">
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
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 transition hover:bg-[var(--surface)]"
              >
                <div className="text-left">
                  <p
                    className={[
                      "type-body font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {account.name}
                  </p>
                  <p className="type-label mt-0.5 text-[var(--text-secondary)]">
                    ${account.balance.toLocaleString("es-CL")}
                  </p>
                </div>
                <Wallet size={20} className="shrink-0 text-[var(--text-tertiary)]" />
              </button>
            );
          })
        ) : (
          <p className="type-body px-6 py-12 text-center text-[var(--text-tertiary)]">
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
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4 transition hover:bg-[var(--surface)]"
              >
                <div className="text-left">
                  <p
                    className={[
                      "type-body font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    {card.name}
                  </p>
                  <p className="type-label mt-0.5 text-[var(--text-secondary)]">
                    ${card.balance.toLocaleString("es-CL")}
                  </p>
                </div>
                <CreditCard size={20} className="shrink-0 text-[var(--text-tertiary)]" />
              </button>
            );
          })
        ) : (
          <p className="type-body px-6 py-12 text-center text-[var(--text-tertiary)]">
            No tienes tarjetas creadas
          </p>
        )}
      </div>

      <SheetFooter label="Agregar Tarjeta" onClick={handleAddCard} />
    </PickerSheetShell>
  );
}

// ─── Account Type Picker Sheet ────────────────────────────────────────────────

const ACCOUNT_TYPE_META: Record<AccountType, { icon: React.ElementType; description: string }> = {
  Corriente: { icon: Building2, description: "Cuenta bancaria de uso diario" },
  Ahorro: { icon: DollarSign, description: "Cuenta de ahorros con intereses" },
  Efectivo: { icon: Banknote, description: "Dinero en efectivo disponible" },
  Débito: { icon: CreditCard, description: "Tarjeta de débito prepagada" },
};

export type AccountTypePickerSheetProps = {
  selected: AccountType;
  onSelect: (type: AccountType) => void;
  onClose: () => void;
};

export function AccountTypePickerSheet({
  selected,
  onSelect,
  onClose,
}: AccountTypePickerSheetProps) {
  const { isVisible, dismiss } = useSheetAnimation(onClose);

  function handleSelect(type: AccountType) {
    onSelect(type);
    dismiss();
  }

  const types = Object.keys(ACCOUNT_TYPE_META) as AccountType[];

  return (
    <PickerSheetShell title="Tipo de cuenta" isVisible={isVisible} onDismiss={dismiss}>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {types.map((type) => {
          const { icon: Icon, description } = ACCOUNT_TYPE_META[type];
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              className={[
                "flex w-full items-center gap-4 px-6 py-4 transition",
                isSelected ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]",
              ].join(" ")}
            >
              <div
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-[0.7rem]",
                  isSelected
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "bg-[var(--surface-strong)] text-[var(--text-secondary)]",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={1.9} />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={[
                    "type-body font-medium",
                    isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {type}
                </p>
                <p className="type-label mt-0.5 text-[var(--text-tertiary)]">{description}</p>
              </div>
              {isSelected ? (
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
              ) : (
                <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--line-strong)]" />
              )}
            </button>
          );
        })}
      </div>
    </PickerSheetShell>
  );
}
