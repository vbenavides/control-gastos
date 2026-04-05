import type { Transaction } from "@/lib/models";
import type { ITransactionRepository } from "@/lib/repositories/interfaces";

const STORAGE_KEY = "cgapp_transactions_v1";

function readAll(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

function writeAll(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export class LocalStorageTransactionRepository implements ITransactionRepository {
  async getAll(): Promise<Transaction[]> {
    return readAll();
  }

  async getByAccountId(accountId: string): Promise<Transaction[]> {
    return readAll().filter((t) => t.accountId === accountId);
  }

  async getById(id: string): Promise<Transaction | null> {
    return readAll().find((t) => t.id === id) ?? null;
  }

  async create(data: Omit<Transaction, "id">): Promise<Transaction> {
    const transactions = readAll();
    const transaction: Transaction = {
      ...data,
      id: crypto.randomUUID(),
    };
    writeAll([...transactions, transaction]);
    return transaction;
  }

  async update(id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction> {
    const transactions = readAll();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transaction ${id} not found`);
    const updated: Transaction = { ...transactions[index], ...data };
    transactions[index] = updated;
    writeAll(transactions);
    return updated;
  }

  async delete(id: string): Promise<void> {
    writeAll(readAll().filter((t) => t.id !== id));
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    writeAll(readAll().filter((t) => t.accountId !== accountId));
  }
}
