"use client";

import { useAppData } from "@/components/app-data-provider";
import type { DebitAccount } from "@/lib/models";

export type UseDebitAccountsResult = {
  /** null mientras se cargan los datos del cliente. */
  accounts: DebitAccount[] | null;
  isLoading: boolean;
  create: (data: Omit<DebitAccount, "id" | "createdAt">) => Promise<DebitAccount>;
  update: (
    id: string,
    data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
  ) => Promise<DebitAccount>;
  /** Elimina la cuenta Y todas sus transacciones asociadas. */
  remove: (id: string) => Promise<void>;
};

export function useDebitAccounts(): UseDebitAccountsResult {
  const { accounts, isHydrated, createDebitAccount, updateDebitAccount, removeDebitAccount } = useAppData();

  return {
    accounts,
    isLoading: !isHydrated,
    create: createDebitAccount,
    update: updateDebitAccount,
    remove: removeDebitAccount,
  };
}
