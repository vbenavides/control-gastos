"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category } from "@/lib/models";
import { getRepositories } from "@/lib/repositories";

export type UseCategoriesResult = {
  categories: Category[] | null;
  isLoading: boolean;
  create: (data: Omit<Category, "id">) => Promise<Category>;
  update: (id: string, data: Partial<Omit<Category, "id">>) => Promise<Category>;
  remove: (id: string) => Promise<void>;
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    getRepositories()
      .categories.getAll()
      .then(setCategories);
  }, []);

  const create = useCallback(async (data: Omit<Category, "id">): Promise<Category> => {
    const category = await getRepositories().categories.create(data);
    setCategories((prev) => (prev ? [...prev, category] : [category]));
    return category;
  }, []);

  const update = useCallback(
    async (id: string, data: Partial<Omit<Category, "id">>): Promise<Category> => {
      const category = await getRepositories().categories.update(id, data);
      setCategories((prev) =>
        prev ? prev.map((c) => (c.id === id ? category : c)) : [category],
      );
      return category;
    },
    [],
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await getRepositories().categories.delete(id);
    setCategories((prev) => (prev ? prev.filter((c) => c.id !== id) : []));
  }, []);

  return { categories, isLoading: categories === null, create, update, remove };
}
