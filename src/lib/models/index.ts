// ─── Cuenta de débito ───────────────────────────────────────────────────────

export type AccountType = "Corriente" | "Ahorro" | "Efectivo" | "Débito";

export type CurrencyCode = "CLP" | "USD";

export type DebitAccount = {
  id: string;
  name: string;
  balance: number; // raw number, e.g. 33210
  type: AccountType;
  currencyCode: CurrencyCode; // hoy CLP, luego CLP/USD
  createdAt: string; // ISO date
};

// ─── Tarjeta de crédito ─────────────────────────────────────────────────────

export type CreditCard = {
  id: string;
  name: string;
  last4: string;
  balance: number; // deuda actual
  limit: number; // límite de crédito
  currencyCode: CurrencyCode; // hoy CLP, luego CLP/USD
  interestRate: number; // tasa anual %
  statementDay: number; // día de corte (1-31)
  paymentDay: number; // día de pago (1-31)
  gracePeriodDays: number;
  paymentReminderEnabled: boolean;
  createdAt: string; // ISO date
};

// ─── Transacción ────────────────────────────────────────────────────────────

export type TransactionKind =
  | "expense"
  | "payment"
  | "income"
  | "transfer"
  | "refund"
  | "installments"
  | "cardPayment"
  | "cashback";

export type TransactionIconKind =
  | "piggy-bank"
  | "shopping-cart"
  | "layers"
  | "train"
  | "heart"
  | "utensils";

export type Transaction = {
  id: string;
  accountId: string; // FK → DebitAccount.id
  amount: number; // raw number
  description: string;
  category: string; // nombre de categoría (futuro: FK → Category.id)
  date: string; // ISO date (fecha de transacción)
  paymentDate: string; // ISO date (fecha de pago)
  kind: TransactionKind;
  iconKind: TransactionIconKind;
  iconBackground: string; // hex color
  iconColor: string; // hex color
  note?: string;
  statusLabel: string;
};

// ─── Categoría ──────────────────────────────────────────────────────────────

export type CategoryType = "expense" | "income";

// ─── Configuración de presupuesto ────────────────────────────────────────────

export type BudgetSettings = {
  resetDay: number;           // día del mes (1-31)
  includeScheduledTx: boolean;
  monthlyBudgetEnabled: boolean;
  monthlyBudget: number;      // monto mensual total (CLP)
};

export type Category = {
  id: string;
  name: string;
  budget: number;  // presupuesto asignado (CLP)
  accent: string;  // hex color, e.g. "#22c55e"
  iconKey?: string; // key en CATEGORY_ICON_MAP, e.g. "graduation-cap"
  type?: CategoryType; // "expense" | "income" — opcional para compat. con datos previos
};
