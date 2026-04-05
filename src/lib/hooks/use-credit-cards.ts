"use client";

import { useAppData } from "@/components/app-data-provider";
import type { CreditCard } from "@/lib/models";

export type UseCreditCardsResult = {
  cards: CreditCard[] | null;
  isLoading: boolean;
  create: (data: Omit<CreditCard, "id" | "createdAt">) => Promise<CreditCard>;
  update: (
    id: string,
    data: Partial<Omit<CreditCard, "id" | "createdAt">>,
  ) => Promise<CreditCard>;
  remove: (id: string) => Promise<void>;
};

export function useCreditCards(): UseCreditCardsResult {
  const { cards, isHydrated, createCreditCard, updateCreditCard, removeCreditCard } = useAppData();

  return {
    cards,
    isLoading: !isHydrated,
    create: createCreditCard,
    update: updateCreditCard,
    remove: removeCreditCard,
  };
}
