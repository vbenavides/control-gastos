"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, SquarePen, Wallet } from "lucide-react";
import { useState } from "react";

import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import type { AccountType } from "@/lib/models";
import {
  formatMoneyInput,
  getNumericInputWidth,
  normalizeNumericBlurValue,
  parseNumericInput,
  sanitizeNumericInput,
  stripMoneyFormat,
} from "@/lib/numeric-input";
import { useDebitAccounts } from "@/lib/hooks/use-debit-accounts";
import { AccountTypePickerSheet } from "@/components/screens/picker-sheets";

export function AddAccountScreen() {
  const router = useRouter();
  const { create, isLoading: isDataLoading } = useDebitAccounts();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Corriente");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const currencyCode = DEFAULT_CURRENCY_CODE;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const balance = parseNumericInput(amount);
    const name = description.trim() || "Sin nombre";

    setSaveError(null);
    setIsSaving(true);
    try {
      await create({
        name,
        balance,
        type: accountType,
        currencyCode,
      });
      // If we came from a picker sheet inside a transaction form, go back
      // to that form (the form's useEffect will reopen the picker).
      const hasReturnPicker =
        typeof window !== "undefined" &&
        !!sessionStorage.getItem("__returnPicker");
      if (hasReturnPicker) {
        router.back();
      } else {
        router.push("/cuentas?tab=debito");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la cuenta.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-dvh w-full max-w-[36rem] flex-col px-4 pb-4 pt-3 md:max-w-[40rem] md:px-6 md:pb-6 md:pt-4 lg:max-w-[680px] lg:px-8">
          <header className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center bg-[var(--app-bg)] pt-3 pb-2">
            <button
              type="button"
              onClick={() => {
                const hasReturnPicker =
                  typeof window !== "undefined" &&
                  !!sessionStorage.getItem("__returnPicker");
                if (hasReturnPicker) {
                  router.back();
                } else {
                  router.push("/cuentas?tab=debito");
                }
              }}
              aria-label="Volver a cuentas"
              className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              <ArrowLeft size={22} />
            </button>

            <h1 className="type-subsection-title text-center font-medium text-[var(--text-primary)]">
              Agregar Cuenta
            </h1>

            <div aria-hidden="true" />
          </header>

          <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
            <section className="px-1 pt-8 text-center">
              <p className="type-label text-[var(--text-primary)]">Cantidad a ingresar</p>

              <div className="type-display mt-2.5 flex items-baseline justify-center gap-[1px] font-medium text-[var(--text-primary)]">
                <span aria-hidden="true">$</span>
                <label htmlFor="amount" className="sr-only">
                  Cantidad a ingresar
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  value={formatMoneyInput(amount, currencyCode)}
                  onChange={(event) => setAmount(sanitizeNumericInput(stripMoneyFormat(event.target.value, currencyCode), "integer"))}
                  onBlur={() => setAmount((current) => normalizeNumericBlurValue(current, "integer"))}
                  style={{ width: getNumericInputWidth(formatMoneyInput(amount, currencyCode)) }}
                  className="min-w-[3ch] max-w-full border-0 bg-transparent p-0 text-center font-medium text-[var(--text-primary)] outline-none"
                />
              </div>
            </section>

            <section className="mt-10 space-y-0">
              <div className="border-b border-[var(--line-strong)] pb-2.5">
                <label
                  htmlFor="description"
                  className="type-label mb-1 block text-[var(--text-primary)]"
                >
                  Descripción
                </label>

                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <SquarePen size={16} className="shrink-0 text-white/92" />
                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="type-body min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[var(--text-secondary)]"
                    placeholder="Nombre de la cuenta"
                  />
                </div>
              </div>

              <div className="border-b border-[var(--line-strong)] pb-2.5 pt-2.5">
                <p className="type-label mb-1 text-[var(--text-primary)]">Tipo</p>

                <button
                  type="button"
                  onClick={() => setShowTypePicker(true)}
                  className="flex w-full items-center gap-3 text-[var(--text-primary)] transition hover:opacity-75"
                >
                  <Wallet size={16} className="shrink-0 text-white/92" />
                  <span className="type-body flex-1 text-left font-medium">{accountType}</span>
                  <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
                </button>
              </div>
            </section>

            <div className="mt-auto pt-8">
              {saveError ? (
                <p
                  role="alert"
                  className="type-helper mb-3 rounded-[0.6rem] bg-red-500/10 px-3 py-2 text-center text-red-400"
                >
                  {saveError}
                </p>
              ) : null}
              <div className="border-t border-white/6 px-2 pb-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || isDataLoading}
                  className="type-body flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)] disabled:opacity-60"
                >
                  {isSaving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showTypePicker ? (
        <AccountTypePickerSheet
          selected={accountType}
          onSelect={setAccountType}
          onClose={() => setShowTypePicker(false)}
        />
      ) : null}
    </>
  );
}
