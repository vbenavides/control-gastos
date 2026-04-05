"use client";

import { useCallback, useEffect, useState } from "react";

import type { Transaction } from "@/lib/models";
import { getRepositories } from "@/lib/repositories";

export type UseTransactionsResult = {
  transactions: Transaction[] | null;
  isLoading: boolean;
  create: (data: Omit<Transaction, "id">) => Promise<Transaction>;
  update: (id: string, data: Partial<Omit<Transaction, "id">>) => Promise<Transaction>;
  remove: (id: string) => Promise<void>;
};

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    getRepositories()
      .transactions.getAll()
      .then(setTransactions);
  }, []);

  const create = useCallback(async (data: Omit<Transaction, "id">): Promise<Transaction> => {
    const transaction = await getRepositories().transactions.create(data);
    setTransactions((prev) => (prev ? [...prev, transaction] : [transaction]));
    return transaction;
  }, []);

  const update = useCallback(
    async (id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction> => {
      const transaction = await getRepositories().transactions.update(id, data);
      setTransactions((prev) =>
        prev ? prev.map((t) => (t.id === id ? transaction : t)) : [transaction],
      );
      return transaction;
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await getRepositories().transactions.delete(id);
    setTransactions((prev) => (prev ? prev.filter((t) => t.id !== id) : []));
  }, []);

  return { transactions, isLoading: transactions === null, create, update, remove };
}
