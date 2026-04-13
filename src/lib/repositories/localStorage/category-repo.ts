import type { Category } from "@/lib/models";
import type { ICategoryRepository } from "@/lib/repositories/interfaces";
import { SEED_CATEGORIES } from "@/lib/category-seeds";

// v3: categorías en español latinoamericano, campo type incluido
const STORAGE_KEY = "cgapp_categories_v3";

function buildSeeded(): Category[] {
  return SEED_CATEGORIES.map((cat) => ({ ...cat, id: crypto.randomUUID() }));
}

function readAll(): Category[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeeded();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Category[];
  } catch {
    return [];
  }
}

function writeAll(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export class LocalStorageCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return readAll();
  }

  async getById(id: string): Promise<Category | null> {
    return readAll().find((c) => c.id === id) ?? null;
  }

  async create(data: Omit<Category, "id">): Promise<Category> {
    const categories = readAll();
    const category: Category = { ...data, id: crypto.randomUUID() };
    writeAll([...categories, category]);
    return category;
  }

  async update(id: string, data: Partial<Omit<Category, "id">>): Promise<Category> {
    const categories = readAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Category ${id} not found`);
    const updated: Category = { ...categories[index], ...data };
    categories[index] = updated;
    writeAll(categories);
    return updated;
  }

  async delete(id: string): Promise<void> {
    writeAll(readAll().filter((c) => c.id !== id));
  }

  async seedDefaults(): Promise<Category[]> {
    const seeded = buildSeeded();
    writeAll(seeded);
    return seeded;
  }
}
