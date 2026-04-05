export function parseAmountCLP(s: string): number {
  return parseInt(s.replace("$", "").replace(/\./g, ""), 10) || 0;
}

export function formatAmountCLP(n: number): string {
  return "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
