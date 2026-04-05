"use client";

import { useCallback, useEffect, useState } from "react";

import type { CreditCard } from "@/lib/models";
import { getRepositories } from "@/lib/repositories";

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
  const [cards, setCards] = useState<CreditCard[] | null>(null);

  useEffect(() => {
    getRepositories()
      .creditCards.getAll()
      .then(setCards);
  }, []);

  const create = useCallback(
    async (data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard> => {
      const card = await getRepositories().creditCards.create(data);
      setCards((prev) => (prev ? [...prev, card] : [card]));
      return card;
    },
    [],
  );

  const update = useCallback(
    async (
      id: string,
      data: Partial<Omit<CreditCard, "id" | "createdAt">>,
    ): Promise<CreditCard> => {
      const card = await getRepositories().creditCards.update(id, data);
      setCards((prev) => (prev ? prev.map((c) => (c.id === id ? card : c)) : [card]));
      return card;
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await getRepositories().creditCards.delete(id);
    setCards((prev) => (prev ? prev.filter((c) => c.id !== id) : []));
  }, []);

  return { cards, isLoading: cards === null, create, update, remove };
}
