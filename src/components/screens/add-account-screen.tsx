"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, SquarePen, Wallet } from "lucide-react";
import { useState } from "react";

import { addAccountTypeOptions } from "@/lib/mock-data";

export function AddAccountScreen() {
  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState<(typeof addAccountTypeOptions)[number]>("Cheques");

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-4 pt-3 md:max-w-[560px] md:px-6 md:pb-6 md:pt-4 lg:max-w-[680px] lg:px-8">
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center pt-1">
          <Link
            href="/cuentas?tab=debito"
            aria-label="Volver a cuentas"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--text-primary)]"
          >
            <ArrowLeft size={22} />
          </Link>

          <h1 className="text-center text-[1.46rem] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
            Agregar Cuenta
          </h1>

          <div aria-hidden="true" />
        </header>

        <form className="flex flex-1 flex-col" onSubmit={(event) => event.preventDefault()}>
          <section className="px-1 pt-8 text-center">
            <p className="text-[0.84rem] text-[var(--text-primary)]">Cantidad a ingresar</p>

            <div className="mt-2.5 flex items-baseline justify-center gap-[1px] font-medium leading-none tracking-[-0.02em] text-[var(--text-primary)]">
              <span aria-hidden="true" className="text-[2.18rem] leading-none sm:text-[2.28rem]">
                $
              </span>
              <label htmlFor="amount" className="sr-only">
                Cantidad a ingresar
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setAmount(nextValue === "" ? "" : nextValue);
                }}
                onBlur={() => {
                  if (amount.trim() === "") {
                    setAmount("0");
                  }
                }}
                className="w-[2.3ch] border-0 bg-transparent p-0 text-center text-[2.18rem] font-medium leading-none tracking-[-0.02em] text-[var(--text-primary)] outline-none [appearance:textfield] sm:text-[2.28rem] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-describedby="add-account-helper"
              />
            </div>
          </section>

          <section className="mt-10 space-y-0">
            <div className="border-b border-[var(--line-strong)] pb-2.5">
              <label htmlFor="description" className="mb-1 block text-[0.86rem] text-[var(--text-primary)]">
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
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[1rem] leading-none outline-none placeholder:text-[var(--text-secondary)]"
                  placeholder="Nombre de la cuenta"
                />
              </div>
            </div>

            <div className="border-b border-[var(--line-strong)] pb-2.5 pt-2.5">
              <label htmlFor="account-type" className="mb-1 block text-[0.86rem] text-[var(--text-primary)]">
                Tipo
              </label>

              <div className="relative flex items-center gap-3 text-[var(--text-primary)]">
                <Wallet size={16} className="shrink-0 text-white/92" />
                <select
                  id="account-type"
                  name="accountType"
                  value={accountType}
                  onChange={(event) =>
                    setAccountType(event.target.value as (typeof addAccountTypeOptions)[number])
                  }
                  className="min-h-10 w-full appearance-none border-0 bg-transparent py-0 pr-7 text-[1rem] font-medium outline-none"
                >
                  {addAccountTypeOptions.map((option) => (
                    <option key={option} value={option} className="bg-[var(--app-bg)] text-[var(--text-primary)]">
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/80" />
              </div>
            </div>
          </section>

          <div className="mt-auto pt-8">
            <div className="border-t border-white/6 px-2 pb-3 pt-4">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-6 text-[1rem] font-medium text-white shadow-[0_14px_28px_rgba(41,187,243,0.18)]"
              >
                Guardar
              </button>
            </div>
          </div>

          <p id="add-account-helper" className="sr-only">
            Pantalla visual lista. La persistencia del formulario todavía no está implementada.
          </p>
        </form>
      </div>
    </div>
  );
}
