"use client";

import { useAppData } from "@/components/app-data-provider";
import type { Category } from "@/lib/models";

export type UseCategoriesResult = {
  categories: Category[] | null;
  isLoading: boolean;
  create: (data: Omit<Category, "id">) => Promise<Category>;
  update: (id: string, data: Partial<Omit<Category, "id">>) => Promise<Category>;
  remove: (id: string) => Promise<void>;
};

export function useCategories(): UseCategoriesResult {
  const { categories, isHydrated, createCategory, updateCategory, removeCategory } = useAppData();

  return {
    categories,
    isLoading: !isHydrated,
    create: createCategory,
    update: updateCategory,
    remove: removeCategory,
  };
}
