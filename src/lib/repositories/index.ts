/**
 * Repositorios activos.
 *
 * Hoy usan localStorage. Para migrar a Supabase:
 *   1. Crear src/lib/repositories/supabase/*.ts implementando las mismas interfaces.
 *   2. Reemplazar los imports de abajo. Los hooks y screens no cambian nada.
 */

import type {
  ICategoryRepository,
  ICreditCardRepository,
  IDebitAccountRepository,
  ITransactionRepository,
} from "@/lib/repositories/interfaces";

import { LocalStorageCategoryRepository } from "@/lib/repositories/localStorage/category-repo";
import { LocalStorageCreditCardRepository } from "@/lib/repositories/localStorage/credit-card-repo";
import { LocalStorageDebitAccountRepository } from "@/lib/repositories/localStorage/debit-account-repo";
import { LocalStorageTransactionRepository } from "@/lib/repositories/localStorage/transaction-repo";

export type Repositories = {
  debitAccounts: IDebitAccountRepository;
  creditCards: ICreditCardRepository;
  transactions: ITransactionRepository;
  categories: ICategoryRepository;
};

// Singleton: una sola instancia por proceso de cliente.
let _repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!_repos) {
    _repos = {
      debitAccounts: new LocalStorageDebitAccountRepository(),
      creditCards: new LocalStorageCreditCardRepository(),
      transactions: new LocalStorageTransactionRepository(),
      categories: new LocalStorageCategoryRepository(),
    };
  }
  return _repos;
}
