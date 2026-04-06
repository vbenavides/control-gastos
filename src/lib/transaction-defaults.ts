/**
 * Metadatos fijos por tipo de transacción.
 * Define icono, colores y etiqueta de estado para cada kind.
 */

import type { TransactionIconKind, TransactionKind } from "@/lib/models";

type KindMeta = {
  iconKind: TransactionIconKind;
  iconBackground: string;
  iconColor: string;
  statusLabel: string;
};

export const KIND_META: Record<TransactionKind, KindMeta> = {
  expense: {
    iconKind: "shopping-cart",
    iconBackground: "#0e1f0e",
    iconColor: "#77d65d",
    statusLabel: "Pagado",
  },
  payment: {
    iconKind: "layers",
    iconBackground: "#1f0e0e",
    iconColor: "#f55a3d",
    statusLabel: "Programado",
  },
  income: {
    iconKind: "piggy-bank",
    iconBackground: "#0e1a27",
    iconColor: "#29bbf3",
    statusLabel: "Recibido",
  },
  transfer: {
    iconKind: "layers",
    iconBackground: "#150e27",
    iconColor: "#a38bf5",
    statusLabel: "Transferido",
  },
  refund: {
    iconKind: "piggy-bank",
    iconBackground: "#1f1b0e",
    iconColor: "#e5db58",
    statusLabel: "Recibido",
  },
  installments: {
    iconKind: "shopping-cart",
    iconBackground: "#0e1f1a",
    iconColor: "#5de8c7",
    statusLabel: "Activa",
  },
  cardPayment: {
    iconKind: "layers",
    iconBackground: "#0e1527",
    iconColor: "#29bbf3",
    statusLabel: "Pagado",
  },
  cashback: {
    iconKind: "piggy-bank",
    iconBackground: "#0e1f0e",
    iconColor: "#77d65d",
    statusLabel: "Recibido",
  },
};
