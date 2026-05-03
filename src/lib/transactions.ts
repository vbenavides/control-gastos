import type { Transaction } from "@/lib/models";

/**
 * Returns true for transaction kinds that ADD money to the account balance.
 * Transfers are incoming when the category does NOT start with "→".
 */
export function isIncomeTransaction(tx: Transaction): boolean {
  if (tx.kind === "income" || tx.kind === "refund" || tx.kind === "cashback") return true;
  if (tx.kind === "transfer") return !tx.category.startsWith("→");
  return false;
}

/**
 * Net signed effect on account balance when a transaction is confirmed.
 * Pending transactions have zero effect (they do not adjust the balance yet).
 */
export function getTransactionEffect(tx: Transaction): number {
  if (tx.isPending) return 0;
  return isIncomeTransaction(tx) ? tx.amount : -tx.amount;
}

/**
 * Builds a Map from transaction.id → account balance AFTER that transaction.
 *
 * @param sortedDesc  Transactions sorted descending (newest first).
 * @param currentBalance  Current account balance (reflects ALL confirmed transactions).
 */
export function computeRunningBalances(
  sortedDesc: Transaction[],
  currentBalance: number,
): Map<string, number> {
  const map = new Map<string, number>();
  let bal = currentBalance;
  for (let i = 0; i < sortedDesc.length; i++) {
    map.set(sortedDesc[i]!.id, bal);
    bal -= getTransactionEffect(sortedDesc[i]!);
  }
  return map;
}
