import type { BudgetSettings, Category, CreditCard, DebitAccount, Transaction } from "@/lib/models";

// ─── Cuenta de débito ───────────────────────────────────────────────────────

export interface IDebitAccountRepository {
  getAll(): Promise<DebitAccount[]>;
  getById(id: string): Promise<DebitAccount | null>;
  create(data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount>;
  update(id: string, data: Partial<Omit<DebitAccount, "id" | "createdAt">>): Promise<DebitAccount>;
  delete(id: string): Promise<void>;
}

// ─── Tarjeta de crédito ─────────────────────────────────────────────────────

export interface ICreditCardRepository {
  getAll(): Promise<CreditCard[]>;
  getById(id: string): Promise<CreditCard | null>;
  create(data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard>;
  update(id: string, data: Partial<Omit<CreditCard, "id" | "createdAt">>): Promise<CreditCard>;
  delete(id: string): Promise<void>;
}

// ─── Transacciones ──────────────────────────────────────────────────────────

export interface ITransactionRepository {
  getAll(): Promise<Transaction[]>;
  getByAccountId(accountId: string): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(data: Omit<Transaction, "id">): Promise<Transaction>;
  update(id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  /** Elimina todas las transacciones de una cuenta (usar antes de borrar la cuenta). */
  deleteByAccountId(accountId: string): Promise<void>;
}

// ─── Categorías ─────────────────────────────────────────────────────────────

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(data: Omit<Category, "id">): Promise<Category>;
  update(id: string, data: Partial<Omit<Category, "id">>): Promise<Category>;
  delete(id: string): Promise<void>;
}

// ─── Configuración de presupuesto ────────────────────────────────────────────

export interface IBudgetSettingsRepository {
  get(): Promise<BudgetSettings | null>;
  upsert(data: BudgetSettings): Promise<BudgetSettings>;
}
