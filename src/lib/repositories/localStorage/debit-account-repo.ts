import type { DebitAccount } from "@/lib/models";
import type { IDebitAccountRepository } from "@/lib/repositories/interfaces";

const STORAGE_KEY = "cgapp_debit_accounts_v1";

function readAll(): DebitAccount[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DebitAccount[];
  } catch {
    return [];
  }
}

function writeAll(accounts: DebitAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export class LocalStorageDebitAccountRepository implements IDebitAccountRepository {
  async getAll(): Promise<DebitAccount[]> {
    return readAll();
  }

  async getById(id: string): Promise<DebitAccount | null> {
    return readAll().find((a) => a.id === id) ?? null;
  }

  async create(data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount> {
    const accounts = readAll();
    const account: DebitAccount = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeAll([...accounts, account]);
    return account;
  }

  async update(
    id: string,
    data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
  ): Promise<DebitAccount> {
    const accounts = readAll();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`DebitAccount ${id} not found`);
    const updated: DebitAccount = { ...accounts[index], ...data };
    accounts[index] = updated;
    writeAll(accounts);
    return updated;
  }

  async delete(id: string): Promise<void> {
    writeAll(readAll().filter((a) => a.id !== id));
  }
}
