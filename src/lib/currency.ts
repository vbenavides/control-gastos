import type { CurrencyCode } from "@/lib/models";

export const DEFAULT_CURRENCY_CODE: CurrencyCode = "CLP";

export function parseAmountCLP(s: string): number {
  return parseInt(s.replace("$", "").replace(/\./g, ""), 10) || 0;
}

export function formatAmountCLP(n: number): string {
  return "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatSignedAmountCLP(n: number): string {
  const absolute = formatAmountCLP(Math.abs(n));
  return n < 0 ? `-${absolute}` : absolute;
}
