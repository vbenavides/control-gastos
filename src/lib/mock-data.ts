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

export const accountGroups = [
  {
    title: "Cheques",
    total: "$33.210",
    items: [
      { name: "Falabella", balance: "$33.210" },
      { name: "Mercado Pago", balance: "$0" },
    ],
  },
  {
    title: "Efectivo",
    total: "$0",
    items: [{ name: "Cash", balance: "$0" }],
  },
];

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
