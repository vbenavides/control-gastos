import type { Category } from "@/lib/models";
import type { ICategoryRepository } from "@/lib/repositories/interfaces";

// v3: categorías en español latinoamericano, campo type incluido
const STORAGE_KEY = "cgapp_categories_v3";

const SEED_CATEGORIES: Category[] = [
  // ── Gastos ───────────────────────────────────────────────────────────────
  { id: "cat-alim",    name: "Alimentación",           type: "expense", budget: 200000, accent: "#f97316", iconKey: "utensils"       },
  { id: "cat-trans",   name: "Transporte",              type: "expense", budget: 80000,  accent: "#3b82f6", iconKey: "car"            },
  { id: "cat-viviend", name: "Vivienda y Arriendo",     type: "expense", budget: 400000, accent: "#0891b2", iconKey: "house"          },
  { id: "cat-salud",   name: "Salud y Farmacia",        type: "expense", budget: 80000,  accent: "#ef4444", iconKey: "heart-pulse"    },
  { id: "cat-educ",    name: "Educación",               type: "expense", budget: 60000,  accent: "#22c55e", iconKey: "graduation-cap" },
  { id: "cat-entret",  name: "Entretenimiento",         type: "expense", budget: 60000,  accent: "#eab308", iconKey: "gamepad"        },
  { id: "cat-ropa",    name: "Ropa y Accesorios",       type: "expense", budget: 60000,  accent: "#8b5cf6", iconKey: "shirt"          },
  { id: "cat-tecno",   name: "Tecnología",              type: "expense", budget: 50000,  accent: "#6366f1", iconKey: "tv"             },
  { id: "cat-rest",    name: "Restaurantes",            type: "expense", budget: 80000,  accent: "#be123c", iconKey: "utensils"       },
  { id: "cat-super",   name: "Supermercado",            type: "expense", budget: 150000, accent: "#92400e", iconKey: "shopping-cart"  },
  { id: "cat-masco",   name: "Mascotas",                type: "expense", budget: 30000,  accent: "#991b1b", iconKey: "paw-print"      },
  { id: "cat-hijos",   name: "Hijos y Familia",         type: "expense", budget: 80000,  accent: "#16a34a", iconKey: "baby"           },
  { id: "cat-seguro",  name: "Seguros",                 type: "expense", budget: 50000,  accent: "#7c3aed", iconKey: "shield"         },
  { id: "cat-subs",    name: "Suscripciones",           type: "expense", budget: 30000,  accent: "#15803d", iconKey: "music"          },
  { id: "cat-serv",    name: "Servicios Básicos",       type: "expense", budget: 60000,  accent: "#2563eb", iconKey: "zap"            },
  { id: "cat-gym",     name: "Deporte y Gym",           type: "expense", budget: 40000,  accent: "#ec4899", iconKey: "dumbbell"       },
  { id: "cat-viaje",   name: "Viajes",                  type: "expense", budget: 100000, accent: "#0284c7", iconKey: "plane"          },
  { id: "cat-belle",   name: "Belleza y Cuidado",       type: "expense", budget: 30000,  accent: "#c026d3", iconKey: "scissors"       },
  { id: "cat-hogar",   name: "Hogar y Decoración",      type: "expense", budget: 40000,  accent: "#78716c", iconKey: "wrench"         },
  { id: "cat-ahorro",  name: "Ahorro y Fondos",         type: "expense", budget: 200000, accent: "#10b981", iconKey: "piggy-bank"     },
  { id: "cat-deuda",   name: "Deudas y Préstamos",      type: "expense", budget: 100000, accent: "#dc2626", iconKey: "credit-card"    },
  { id: "cat-regalo",  name: "Regalos",                 type: "expense", budget: 20000,  accent: "#f59e0b", iconKey: "gift"           },
  { id: "cat-comun",   name: "Comunicaciones",          type: "expense", budget: 30000,  accent: "#06b6d4", iconKey: "wifi"           },
  { id: "cat-cafe",    name: "Cafetería y Snacks",      type: "expense", budget: 25000,  accent: "#a16207", iconKey: "coffee"         },
  { id: "cat-noche",   name: "Salidas Nocturnas",       type: "expense", budget: 40000,  accent: "#7c2d12", iconKey: "wine"           },

  // ── Ingresos ─────────────────────────────────────────────────────────────
  { id: "cat-sueldo",  name: "Sueldo y Salario",        type: "income",  budget: 0,      accent: "#4f46e5", iconKey: "wallet"         },
  { id: "cat-free",    name: "Freelance e Independiente",type: "income", budget: 0,      accent: "#78716c", iconKey: "briefcase"      },
  { id: "cat-inv",     name: "Inversiones",             type: "income",  budget: 0,      accent: "#7c3aed", iconKey: "trending-up"    },
  { id: "cat-arrend",  name: "Arriendo de Propiedades", type: "income",  budget: 0,      accent: "#e11d48", iconKey: "house"          },
  { id: "cat-bono",    name: "Bonos y Comisiones",      type: "income",  budget: 0,      accent: "#1e40af", iconKey: "badge-dollar"   },
  { id: "cat-gob",     name: "Beneficios del Gobierno", type: "income",  budget: 0,      accent: "#15803d", iconKey: "landmark"       },
  { id: "cat-venta",   name: "Ventas",                  type: "income",  budget: 0,      accent: "#0891b2", iconKey: "tag"            },
  { id: "cat-propi",   name: "Propinas",                type: "income",  budget: 0,      accent: "#16a34a", iconKey: "coins"          },
  { id: "cat-divid",   name: "Dividendos e Intereses",  type: "income",  budget: 0,      accent: "#6d28d9", iconKey: "bar-chart"      },
  { id: "cat-reemb",   name: "Reembolsos",              type: "income",  budget: 0,      accent: "#065f46", iconKey: "receipt"        },
  { id: "cat-pensi",   name: "Pensión y Jubilación",    type: "income",  budget: 0,      accent: "#1d4ed8", iconKey: "users"          },
  { id: "cat-otros",   name: "Otros Ingresos",          type: "income",  budget: 0,      accent: "#991b1b", iconKey: "layers"         },
];

function readAll(): Category[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CATEGORIES));
    return SEED_CATEGORIES;
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
}
