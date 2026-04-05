"use client";

import { useCallback, useEffect, useState } from "react";

import type { DebitAccount } from "@/lib/models";
import { getRepositories } from "@/lib/repositories";

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
  const [accounts, setAccounts] = useState<DebitAccount[] | null>(null);

  useEffect(() => {
    getRepositories()
      .debitAccounts.getAll()
      .then(setAccounts);
  }, []);

  const create = useCallback(
    async (data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount> => {
      const account = await getRepositories().debitAccounts.create(data);
      setAccounts((prev) => (prev ? [...prev, account] : [account]));
      return account;
    },
    [],
  );

  const update = useCallback(
    async (
      id: string,
      data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
    ): Promise<DebitAccount> => {
      const account = await getRepositories().debitAccounts.update(id, data);
      setAccounts((prev) => (prev ? prev.map((a) => (a.id === id ? account : a)) : [account]));
      return account;
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    const repos = getRepositories();
    await repos.transactions.deleteByAccountId(id);
    await repos.debitAccounts.delete(id);
    setAccounts((prev) => (prev ? prev.filter((a) => a.id !== id) : []));
  }, []);

  return { accounts, isLoading: accounts === null, create, update, remove };
}
