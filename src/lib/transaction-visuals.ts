import {
  HeartPulse,
  Layers3,
  PiggyBank,
  ShoppingCart,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { resolveIcon } from "@/lib/category-icons";
import type { Category, Transaction, TransactionIconKind } from "@/lib/models";

function fallbackTransactionIcon(kind: TransactionIconKind): LucideIcon {
  switch (kind) {
    case "piggy-bank":
      return PiggyBank;
    case "shopping-cart":
      return ShoppingCart;
    case "layers":
      return Layers3;
    case "train":
      return TrainFront;
    case "heart":
      return HeartPulse;
    case "utensils":
      return UtensilsCrossed;
  }
}

export function getTransactionVisualMeta(
  transaction: Pick<Transaction, "category" | "iconKind" | "iconBackground" | "iconColor">,
  categories: Category[] | null | undefined,
): { Icon: LucideIcon; backgroundColor: string; color: string } {
  const category = (categories ?? []).find((c) => c.name === transaction.category);

  if (category?.iconKey && category.accent) {
    return {
      Icon: resolveIcon(category.iconKey),
      backgroundColor: `${category.accent}28`,
      color: category.accent,
    };
  }

  return {
    Icon: fallbackTransactionIcon(transaction.iconKind),
    backgroundColor: transaction.iconBackground,
    color: transaction.iconColor,
  };
}
