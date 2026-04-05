/**
 * mock-data.ts — configuración estática de la UI.
 *
 * Este archivo ya NO contiene datos de usuario (cuentas, transacciones, categorías).
 * Esos datos viven en localStorage a través de la capa de repositorios.
 *
 * Lo que queda aquí son constantes de UI que nunca se almacenan en la DB:
 *   - tabs, opciones de select, ítems de menú rápido, secciones de menú.
 */

import type { AccountType } from "@/lib/models";

// Re-exportar AccountType para mantener compatibilidad con los selects de formularios.
export type { AccountType };

/** Tabs de la pantalla de cuentas. */
export const accountTabs = ["Cuentas de débito", "Tarjetas de crédito"] as const;

/** Opciones del tipo de cuenta de débito. */
export const addAccountTypeOptions: AccountType[] = ["Cheques", "Ahorro", "Efectivo"];

// ─── Acciones rápidas del FAB "+" ────────────────────────────────────────────

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
    description:
      "Registra una compra o un pago que hiciste, como supermercado, gasolina o restaurantes.",
    kind: "expense",
  },
  {
    id: "payment",
    title: "Pago",
    description:
      "Registra un pago que necesites hacer, como suscripciones, renta o servicios.",
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
    description:
      "Registra movimientos entre cuentas, como transferencia de cuenta de cheques a ahorro.",
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

// ─── Secciones del menú hamburguesa ─────────────────────────────────────────

export const menuSections = {
  general: ["Categorías", "Transacciones Recurrentes", "Presupuesto", "Análisis"],
  tools: ["Importar", "Exportar"],
};

// ─── Datos estáticos del calendario ─────────────────────────────────────────
// (pendiente de conectar a datos reales)

// Pendiente de conectar a datos reales de cuentas
export const calendarHeader = {
  month: "Abr 2026",
  balanceDate: "30 abr",
  accounts: "$0",
  creditCards: "$0",
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
