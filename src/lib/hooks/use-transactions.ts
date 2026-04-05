"use client";

import { useAppData } from "@/components/app-data-provider";
import type { Transaction } from "@/lib/models";

export type UseTransactionsResult = {
  transactions: Transaction[] | null;
  isLoading: boolean;
  create: (data: Omit<Transaction, "id">) => Promise<Transaction>;
  update: (id: string, data: Partial<Omit<Transaction, "id">>) => Promise<Transaction>;
  remove: (id: string) => Promise<void>;
};

export function useTransactions(): UseTransactionsResult {
  const { transactions, isHydrated, createTransaction, updateTransaction, removeTransaction } = useAppData();

  return {
    transactions,
    isLoading: !isHydrated,
    create: createTransaction,
    update: updateTransaction,
    remove: removeTransaction,
  };
}
