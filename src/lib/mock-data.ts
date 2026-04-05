export const homeSummary = {
  actualBalance: "$33.210",
  projectedBalance: "$33.210",
  projectedExpense: "$0",
  remaining: "$33.210",
};

export const monthCards = [
  {
    title: "Gasto General",
    amount: "$0",
    description: "Sin entradas aún",
  },
  {
    title: "Gasto con Tarjetas",
    amount: "$0",
    description: "Sin entradas aún",
  },
  {
    title: "Ingreso recibido",
    amount: "$0",
    description: "No hay ingresos programados",
  },
  {
    title: "Flujo neto",
    amount: "$0",
    description: "Ingreso $0",
  },
];

export const categorySummary = {
  label: "Restante",
  amount: "$500.000",
  spentText: "Gastado $0 de",
  total: "$500.000",
  progress: 0,
};

export const categories = [
  {
    name: "Education",
    amount: "$0 de $5.000",
    remaining: "$5.000 restante",
    accent: "var(--success)",
    progress: 0,
  },
  {
    name: "Medical & Healthcare",
    amount: "$0 de $180.000",
    remaining: "$180.000 restante",
    accent: "var(--warning)",
    progress: 0,
  },
];

export const accountTabs = ["Cuentas de débito", "Tarjetas de crédito"] as const;

export const addAccountTypeOptions = ["Cheques", "Ahorro", "Efectivo"] as const;

export type DebitAccountGroup = {
  title: string;
  total: string;
  items: Array<{
    slug: string;
    name: string;
    balance: string;
  }>;
};

export const debitAccountGroups: DebitAccountGroup[] = [
  {
    title: "Cheques",
    total: "$33.210",
    items: [
      { slug: "falabella", name: "Falabella", balance: "$33.210" },
      { slug: "mercado-pago", name: "Mercado Pago", balance: "$0" },
    ],
  },
  {
    title: "Efectivo",
    total: "$0",
    items: [{ slug: "cash", name: "Cash", balance: "$0" }],
  },
];

export type DebitAccountTransaction = {
  slug: string;
  dateLabel: string;
  description: string;
  accountName: string;
  amount: string;
  runningBalance: string;
  category: string;
  transactionDate: string;
  paymentDate: string;
  note?: string;
  statusLabel: string;
  iconKind: "piggy-bank" | "shopping-cart" | "layers" | "train" | "heart" | "utensils";
  iconBackground: string;
  iconColor: string;
};

export type DebitAccountDetail = {
  slug: string;
  name: string;
  balance: string;
  recentTransactions: DebitAccountTransaction[];
};

export const debitAccountDetails: DebitAccountDetail[] = [
  {
    slug: "falabella",
    name: "Falabella",
    balance: "$33.210",
    recentTransactions: [
      {
        slug: "qweqweq",
        dateLabel: "13 feb 2026",
        description: "qweqweq",
        accountName: "Falabella",
        amount: "$50",
        runningBalance: "$33.210",
        category: "Otros",
        transactionDate: "13 feb 2026",
        paymentDate: "13 feb 2026",
        statusLabel: "PAGADO",
        iconKind: "piggy-bank",
        iconBackground: "#76263a",
        iconColor: "#ff8ea8",
      },
      {
        slug: "lider",
        dateLabel: "12 sept 2025",
        description: "lider",
        accountName: "Falabella",
        amount: "$55.630",
        runningBalance: "$33.260",
        category: "Groceries",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "shopping-cart",
        iconBackground: "#6b341d",
        iconColor: "#ffb08d",
      },
      {
        slug: "reparacion-pantalla-jf",
        dateLabel: "12 sept 2025",
        description: "reparación pantalla jf",
        accountName: "Falabella",
        amount: "$5.000",
        runningBalance: "$88.890",
        category: "Servicios",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "layers",
        iconBackground: "#53206f",
        iconColor: "#d490ff",
      },
      {
        slug: "brujita",
        dateLabel: "12 sept 2025",
        description: "brujita",
        accountName: "Falabella",
        amount: "$2.590",
        runningBalance: "$93.890",
        category: "Servicios",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "layers",
        iconBackground: "#53206f",
        iconColor: "#d490ff",
      },
      {
        slug: "recarga-wom",
        dateLabel: "12 sept 2025",
        description: "recarga wom",
        accountName: "Falabella",
        amount: "$2.000",
        runningBalance: "$96.480",
        category: "Servicios",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "layers",
        iconBackground: "#53206f",
        iconColor: "#d490ff",
      },
      {
        slug: "metro",
        dateLabel: "12 sept 2025",
        description: "metro",
        accountName: "Falabella",
        amount: "$10.000",
        runningBalance: "$98.480",
        category: "Transporte",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "train",
        iconBackground: "#273785",
        iconColor: "#9eb1ff",
      },
      {
        slug: "crema-de-pies",
        dateLabel: "12 sept 2025",
        description: "crema de pies",
        accountName: "Falabella",
        amount: "$7.600",
        runningBalance: "$108.480",
        category: "Salud",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "heart",
        iconBackground: "#70681f",
        iconColor: "#ebe26a",
      },
      {
        slug: "verdes",
        dateLabel: "12 sept 2025",
        description: "verdes",
        accountName: "Falabella",
        amount: "$5.500",
        runningBalance: "$116.080",
        category: "Groceries",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "shopping-cart",
        iconBackground: "#6b341d",
        iconColor: "#ffb08d",
      },
      {
        slug: "2-papelones",
        dateLabel: "12 sept 2025",
        description: "2 papelones",
        accountName: "Falabella",
        amount: "$12.500",
        runningBalance: "$121.580",
        category: "Restaurantes",
        transactionDate: "12 sept 2025",
        paymentDate: "12 sept 2025",
        statusLabel: "PAGADO",
        iconKind: "utensils",
        iconBackground: "#70306d",
        iconColor: "#ff92f4",
      },
    ],
  },
  {
    slug: "mercado-pago",
    name: "Mercado Pago",
    balance: "$0",
    recentTransactions: [],
  },
  {
    slug: "cash",
    name: "Cash",
    balance: "$0",
    recentTransactions: [],
  },
];

export type CreditCardAccount = {
  name: string;
  maskedNumber: string;
  balance: string;
  availableLabel: string;
  availableAmount: string;
  status: string;
};

export const creditCardAccounts: CreditCardAccount[] = [
  {
    name: "CRM",
    maskedNumber: "**** 2356",
    balance: "$0",
    availableLabel: "Disponible",
    availableAmount: "$15.000",
    status: "No tienes pagos pendientes para este periodo",
  },
];

export type QuickActionItem = {
  id: string;
  title: string;
  description: string;
  kind:
    | "expense"
    | "payment"
    | "income"
    | "transfer"
    | "refund"
    | "installments"
    | "cardPayment"
    | "cashback";
};

export const quickActionItems: QuickActionItem[] = [
  {
    id: "expense",
    title: "Gasto",
    description: "Registra una compra o un pago que hiciste, como supermercado, gasolina o restaurantes.",
    kind: "expense",
  },
  {
    id: "payment",
    title: "Pago",
    description: "Registra un pago que necesites hacer, como suscripciones, renta o servicios.",
    kind: "payment",
  },
  {
    id: "income",
    title: "Ingreso",
    description: "Registra tu salario, bonos, freelance u otro ingreso que recibas.",
    kind: "income",
  },
  {
    id: "transfer",
    title: "Transferencia",
    description: "Registra movimientos entre cuentas, como transferencia de cuenta de cheques a ahorro.",
    kind: "transfer",
  },
  {
    id: "refund",
    title: "Reembolso",
    description: "Registra un reembolso que recibiste, como al devolver un producto.",
    kind: "refund",
  },
  {
    id: "installments",
    title: "Compra a meses",
    description: "Registra una compra a meses con tarjeta de crédito.",
    kind: "installments",
  },
  {
    id: "card-payment",
    title: "Pago de Tarjeta",
    description: "Registra un pago realizado a tu tarjeta de crédito.",
    kind: "cardPayment",
  },
  {
    id: "cashback",
    title: "Devolución en Efectivo",
    description:
      "Registra recompensas de cashback que recibiste, como recompensas de tarjeta de crédito o beneficios de programas de fidelidad.",
    kind: "cashback",
  },
];

export const accountQuickActionItems = quickActionItems.filter(
  (item) => item.kind !== "installments" && item.kind !== "cardPayment",
);

export function getDebitAccountDetail(accountSlug: string) {
  return debitAccountDetails.find((account) => account.slug === accountSlug);
}

export function getDebitAccountTransaction(accountSlug: string, transactionSlug: string) {
  return getDebitAccountDetail(accountSlug)?.recentTransactions.find(
    (transaction) => transaction.slug === transactionSlug,
  );
}

export const historyRange = "3 mar 2026 - 2 abr 2026";

export const calendarHeader = {
  month: "Abr 2026",
  balanceDate: "30 abr",
  accounts: "$33.210",
  creditCards: "$200",
};

export const calendarDays = [
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 31, muted: true },
  { day: 1 },
  { day: 2, selected: true },
  { day: 3 },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10 },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 1, muted: true },
  { day: 2, muted: true },
  { day: 3, muted: true },
  { day: 4, muted: true },
  { day: 5, muted: true },
  { day: 6, muted: true },
  { day: 7, muted: true },
  { day: 8, muted: true },
  { day: 9, muted: true },
];

export const menuSections = {
  general: ["Categorías", "Transacciones Recurrentes", "Presupuesto", "Análisis"],
  tools: ["Importar", "Exportar"],
};
