/**
 * Repositorios activos — Supabase.
 *
 * Reciben un SupabaseClient y un profileId.
 * Los repos de localStorage se mantienen en /localStorage/ para referencia.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  IBudgetSettingsRepository,
  ICategoryRepository,
  ICreditCardRepository,
  IDebitAccountRepository,
  IInstallmentPaymentRepository,
  ITransactionRepository,
} from "@/lib/repositories/interfaces";

import { SupabaseBudgetSettingsRepository } from "@/lib/repositories/supabase/budget-settings-repo";
import { SupabaseCategoryRepository } from "@/lib/repositories/supabase/category-repo";
import { SupabaseCreditCardRepository } from "@/lib/repositories/supabase/credit-card-repo";
import { SupabaseDebitAccountRepository } from "@/lib/repositories/supabase/debit-account-repo";
import { SupabaseInstallmentPaymentRepository } from "@/lib/repositories/supabase/installment-payment-repo";
import { SupabaseTransactionRepository } from "@/lib/repositories/supabase/transaction-repo";

export type Repositories = {
  debitAccounts: IDebitAccountRepository;
  creditCards: ICreditCardRepository;
  transactions: ITransactionRepository;
  installmentPayments: IInstallmentPaymentRepository;
  categories: ICategoryRepository;
  budgetSettings: IBudgetSettingsRepository;
};

export function getRepositories(supabase: SupabaseClient, profileId: string): Repositories {
  return {
    debitAccounts: new SupabaseDebitAccountRepository(supabase, profileId),
    creditCards: new SupabaseCreditCardRepository(supabase, profileId),
    transactions: new SupabaseTransactionRepository(supabase, profileId),
    installmentPayments: new SupabaseInstallmentPaymentRepository(supabase, profileId),
    categories: new SupabaseCategoryRepository(supabase, profileId),
    budgetSettings: new SupabaseBudgetSettingsRepository(supabase, profileId),
  };
}
