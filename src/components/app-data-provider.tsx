"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  BudgetSettings,
  Category,
  CreditCard,
  DebitAccount,
  InstallmentPayment,
  Transaction,
} from "@/lib/models";
import { useProfile } from "@/lib/profile/profile-context";
import { getRepositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/client";

type AppDataContextValue = {
  accounts: DebitAccount[] | null;
  cards: CreditCard[] | null;
  transactions: Transaction[] | null;
  installmentPayments: InstallmentPayment[] | null;
  categories: Category[] | null;
  budgetSettings: BudgetSettings | null;
  isHydrated: boolean;
  createDebitAccount: (data: Omit<DebitAccount, "id" | "createdAt">) => Promise<DebitAccount>;
  updateDebitAccount: (
    id: string,
    data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
  ) => Promise<DebitAccount>;
  /** Suma `delta` al balance de forma atómica (delta negativo para restar). Actualiza el estado local. */
  adjustDebitAccountBalance: (id: string, delta: number) => Promise<void>;
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
  createInstallmentPayment: (
    data: Omit<InstallmentPayment, "id" | "createdAt">,
  ) => Promise<InstallmentPayment>;
  updateInstallmentPayment: (
    id: string,
    data: Partial<Omit<InstallmentPayment, "id" | "createdAt">>,
  ) => Promise<InstallmentPayment>;
  removeInstallmentPayment: (id: string) => Promise<void>;
  refreshInstallmentPayments: () => Promise<void>;
  createCategory: (data: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
  saveBudgetSettings: (data: BudgetSettings) => Promise<BudgetSettings>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = useMemo(() => createClient(), []);
  const { activeProfile } = useProfile();

  const [accounts, setAccounts] = useState<DebitAccount[] | null>(null);
  const [cards, setCards] = useState<CreditCard[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [installmentPayments, setInstallmentPayments] = useState<InstallmentPayment[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Re-fetch all data when the active profile changes
  useEffect(() => {
    let isActive = true;

    void (async () => {
      if (!activeProfile) {
        setIsHydrated(false);
        return;
      }

      setIsHydrated(false);

      const repos = getRepositories(supabase, activeProfile.id);

      const [
        nextAccounts,
        nextCards,
        nextTransactions,
        nextInstallmentPayments,
        rawCategories,
        nextBudget,
      ] =
        await Promise.all([
          repos.debitAccounts.getAll(),
          repos.creditCards.getAll(),
          repos.transactions.getAll(),
          repos.installmentPayments.getAll(),
          repos.categories.getAll(),
          repos.budgetSettings.get(),
        ]);

      // Seed categorías por defecto si el perfil no tiene ninguna todavía
      const nextCategories =
        rawCategories.length === 0
          ? await repos.categories.seedDefaults()
          : rawCategories;

      if (!isActive) return;
      setAccounts(nextAccounts);
      setCards(nextCards);
      setTransactions(nextTransactions);
      setInstallmentPayments(nextInstallmentPayments);
      setCategories(nextCategories);
      setBudgetSettings(nextBudget);
      setIsHydrated(true);
    })();

    return () => {
      isActive = false;
    };
  }, [supabase, activeProfile]);

  // Repos instance derived from active profile — memoized so callbacks stay stable
  const repos = useMemo(
    () => (activeProfile ? getRepositories(supabase, activeProfile.id) : null),
    [supabase, activeProfile],
  );

  const createDebitAccount = useCallback(
    async (data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount> => {
      if (!repos) throw new Error("No active profile");
      const account = await repos.debitAccounts.create(data);
      setAccounts((prev) => (prev ? [...prev, account] : [account]));
      return account;
    },
    [repos],
  );

  const updateDebitAccount = useCallback(
    async (
      id: string,
      data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
    ): Promise<DebitAccount> => {
      if (!repos) throw new Error("No active profile");
      const account = await repos.debitAccounts.update(id, data);
      setAccounts((prev) =>
        prev ? prev.map((item) => (item.id === id ? account : item)) : [account],
      );
      return account;
    },
    [repos],
  );

  const adjustDebitAccountBalance = useCallback(
    async (id: string, delta: number): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.debitAccounts.adjustBalance(id, delta);
      setAccounts((prev) =>
        prev
          ? prev.map((item) =>
              item.id === id ? { ...item, balance: item.balance + delta } : item,
            )
          : prev,
      );
    },
    [repos],
  );

  const removeDebitAccount = useCallback(
    async (id: string): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.transactions.deleteByAccountId(id);
      await repos.debitAccounts.delete(id);
      setAccounts((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
      setTransactions((prev) => (prev ? prev.filter((item) => item.accountId !== id) : []));
    },
    [repos],
  );

  const createCreditCard = useCallback(
    async (data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard> => {
      if (!repos) throw new Error("No active profile");
      const card = await repos.creditCards.create(data);
      setCards((prev) => (prev ? [...prev, card] : [card]));
      return card;
    },
    [repos],
  );

  const updateCreditCard = useCallback(
    async (
      id: string,
      data: Partial<Omit<CreditCard, "id" | "createdAt">>,
    ): Promise<CreditCard> => {
      if (!repos) throw new Error("No active profile");
      const card = await repos.creditCards.update(id, data);
      setCards((prev) => (prev ? prev.map((item) => (item.id === id ? card : item)) : [card]));
      return card;
    },
    [repos],
  );

  const removeCreditCard = useCallback(
    async (id: string): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.creditCards.delete(id);
      setCards((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    },
    [repos],
  );

  const createTransaction = useCallback(
    async (data: Omit<Transaction, "id">): Promise<Transaction> => {
      if (!repos) throw new Error("No active profile");
      const transaction = await repos.transactions.create(data);
      setTransactions((prev) => (prev ? [...prev, transaction] : [transaction]));
      return transaction;
    },
    [repos],
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction> => {
      if (!repos) throw new Error("No active profile");
      const transaction = await repos.transactions.update(id, data);
      setTransactions((prev) =>
        prev ? prev.map((item) => (item.id === id ? transaction : item)) : [transaction],
      );
      return transaction;
    },
    [repos],
  );

  const removeTransaction = useCallback(
    async (id: string): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.transactions.delete(id);
      setTransactions((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    },
    [repos],
  );

  const createInstallmentPayment = useCallback(
    async (
      data: Omit<InstallmentPayment, "id" | "createdAt">,
    ): Promise<InstallmentPayment> => {
      if (!repos) throw new Error("No active profile");
      const installmentPayment = await repos.installmentPayments.create(data);
      setInstallmentPayments((prev) =>
        prev ? [...prev, installmentPayment] : [installmentPayment],
      );
      return installmentPayment;
    },
    [repos],
  );

  const updateInstallmentPayment = useCallback(
    async (
      id: string,
      data: Partial<Omit<InstallmentPayment, "id" | "createdAt">>,
    ): Promise<InstallmentPayment> => {
      if (!repos) throw new Error("No active profile");
      const installmentPayment = await repos.installmentPayments.update(id, data);
      setInstallmentPayments((prev) =>
        prev
          ? prev.map((item) => (item.id === id ? installmentPayment : item))
          : [installmentPayment],
      );
      return installmentPayment;
    },
    [repos],
  );

  const removeInstallmentPayment = useCallback(
    async (id: string): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.installmentPayments.delete(id);
      setInstallmentPayments((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    },
    [repos],
  );

  const refreshInstallmentPayments = useCallback(async () => {
    if (!repos) return;
    const next = await repos.installmentPayments.getAll();
    setInstallmentPayments(next);
  }, [repos]);

  const createCategory = useCallback(
    async (data: Omit<Category, "id">): Promise<Category> => {
      if (!repos) throw new Error("No active profile");
      const category = await repos.categories.create(data);
      setCategories((prev) => (prev ? [...prev, category] : [category]));
      return category;
    },
    [repos],
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Omit<Category, "id">>): Promise<Category> => {
      if (!repos) throw new Error("No active profile");
      const category = await repos.categories.update(id, data);
      setCategories((prev) =>
        prev ? prev.map((item) => (item.id === id ? category : item)) : [category],
      );
      return category;
    },
    [repos],
  );

  const removeCategory = useCallback(
    async (id: string): Promise<void> => {
      if (!repos) throw new Error("No active profile");
      await repos.categories.delete(id);
      setCategories((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    },
    [repos],
  );

  const saveBudgetSettings = useCallback(
    async (data: BudgetSettings): Promise<BudgetSettings> => {
      if (!repos) throw new Error("No active profile");
      const saved = await repos.budgetSettings.upsert(data);
      setBudgetSettings(saved);
      return saved;
    },
    [repos],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      accounts,
      cards,
      transactions,
      installmentPayments,
      categories,
      budgetSettings,
      isHydrated,
      createDebitAccount,
      updateDebitAccount,
      adjustDebitAccountBalance,
      removeDebitAccount,
      createCreditCard,
      updateCreditCard,
      removeCreditCard,
      createTransaction,
      updateTransaction,
      removeTransaction,
      createInstallmentPayment,
      updateInstallmentPayment,
      removeInstallmentPayment,
      refreshInstallmentPayments,
      createCategory,
      updateCategory,
      removeCategory,
      saveBudgetSettings,
    }),
    [
      accounts,
      cards,
      transactions,
      installmentPayments,
      categories,
      budgetSettings,
      isHydrated,
      createDebitAccount,
      updateDebitAccount,
      adjustDebitAccountBalance,
      removeDebitAccount,
      createCreditCard,
      updateCreditCard,
      removeCreditCard,
      createTransaction,
      updateTransaction,
      removeTransaction,
      createInstallmentPayment,
      updateInstallmentPayment,
      removeInstallmentPayment,
      refreshInstallmentPayments,
      createCategory,
      updateCategory,
      removeCategory,
      saveBudgetSettings,
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
