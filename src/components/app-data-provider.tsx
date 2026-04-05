"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Category, CreditCard, DebitAccount, Transaction } from "@/lib/models";
import { getRepositories } from "@/lib/repositories";

type AppDataContextValue = {
  accounts: DebitAccount[] | null;
  cards: CreditCard[] | null;
  transactions: Transaction[] | null;
  categories: Category[] | null;
  isHydrated: boolean;
  createDebitAccount: (data: Omit<DebitAccount, "id" | "createdAt">) => Promise<DebitAccount>;
  updateDebitAccount: (
    id: string,
    data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
  ) => Promise<DebitAccount>;
  removeDebitAccount: (id: string) => Promise<void>;
  createCreditCard: (data: Omit<CreditCard, "id" | "createdAt">) => Promise<CreditCard>;
  updateCreditCard: (
    id: string,
    data: Partial<Omit<CreditCard, "id" | "createdAt">>,
  ) => Promise<CreditCard>;
  removeCreditCard: (id: string) => Promise<void>;
  createTransaction: (data: Omit<Transaction, "id">) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, "id">>) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<void>;
  createCategory: (data: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [accounts, setAccounts] = useState<DebitAccount[] | null>(null);
  const [cards, setCards] = useState<CreditCard[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getRepositories().debitAccounts.getAll(),
      getRepositories().creditCards.getAll(),
      getRepositories().transactions.getAll(),
      getRepositories().categories.getAll(),
    ]).then(([nextAccounts, nextCards, nextTransactions, nextCategories]) => {
      if (!isActive) {
        return;
      }

      setAccounts(nextAccounts);
      setCards(nextCards);
      setTransactions(nextTransactions);
      setCategories(nextCategories);
      setIsHydrated(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const createDebitAccount = useCallback(
    async (data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount> => {
      const account = await getRepositories().debitAccounts.create(data);
      setAccounts((prev) => (prev ? [...prev, account] : [account]));
      return account;
    },
    [],
  );

  const updateDebitAccount = useCallback(
    async (
      id: string,
      data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
    ): Promise<DebitAccount> => {
      const account = await getRepositories().debitAccounts.update(id, data);
      setAccounts((prev) => (prev ? prev.map((item) => (item.id === id ? account : item)) : [account]));
      return account;
    },
    [],
  );

  const removeDebitAccount = useCallback(async (id: string): Promise<void> => {
    const repositories = getRepositories();
    await repositories.transactions.deleteByAccountId(id);
    await repositories.debitAccounts.delete(id);

    setAccounts((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    setTransactions((prev) => (prev ? prev.filter((item) => item.accountId !== id) : []));
  }, []);

  const createCreditCard = useCallback(
    async (data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard> => {
      const card = await getRepositories().creditCards.create(data);
      setCards((prev) => (prev ? [...prev, card] : [card]));
      return card;
    },
    [],
  );

  const updateCreditCard = useCallback(
    async (
      id: string,
      data: Partial<Omit<CreditCard, "id" | "createdAt">>,
    ): Promise<CreditCard> => {
      const card = await getRepositories().creditCards.update(id, data);
      setCards((prev) => (prev ? prev.map((item) => (item.id === id ? card : item)) : [card]));
      return card;
    },
    [],
  );

  const removeCreditCard = useCallback(async (id: string): Promise<void> => {
    await getRepositories().creditCards.delete(id);
    setCards((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
  }, []);

  const createTransaction = useCallback(async (data: Omit<Transaction, "id">): Promise<Transaction> => {
    const transaction = await getRepositories().transactions.create(data);
    setTransactions((prev) => (prev ? [...prev, transaction] : [transaction]));
    return transaction;
  }, []);

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction> => {
      const transaction = await getRepositories().transactions.update(id, data);
      setTransactions((prev) =>
        prev ? prev.map((item) => (item.id === id ? transaction : item)) : [transaction],
      );
      return transaction;
    },
    [],
  );

  const removeTransaction = useCallback(async (id: string): Promise<void> => {
    await getRepositories().transactions.delete(id);
    setTransactions((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
  }, []);

  const createCategory = useCallback(async (data: Omit<Category, "id">): Promise<Category> => {
    const category = await getRepositories().categories.create(data);
    setCategories((prev) => (prev ? [...prev, category] : [category]));
    return category;
  }, []);

  const updateCategory = useCallback(
    async (id: string, data: Partial<Omit<Category, "id">>): Promise<Category> => {
      const category = await getRepositories().categories.update(id, data);
      setCategories((prev) =>
        prev ? prev.map((item) => (item.id === id ? category : item)) : [category],
      );
      return category;
    },
    [],
  );

  const removeCategory = useCallback(async (id: string): Promise<void> => {
    await getRepositories().categories.delete(id);
    setCategories((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      accounts,
      cards,
      transactions,
      categories,
      isHydrated,
      createDebitAccount,
      updateDebitAccount,
      removeDebitAccount,
      createCreditCard,
      updateCreditCard,
      removeCreditCard,
      createTransaction,
      updateTransaction,
      removeTransaction,
      createCategory,
      updateCategory,
      removeCategory,
    }),
    [
      accounts,
      cards,
      transactions,
      categories,
      isHydrated,
      createDebitAccount,
      updateDebitAccount,
      removeDebitAccount,
      createCreditCard,
      updateCreditCard,
      removeCreditCard,
      createTransaction,
      updateTransaction,
      removeTransaction,
      createCategory,
      updateCategory,
      removeCategory,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}
