import type { Category } from "@/lib/models";

/**
 * Categorías por defecto para un perfil nuevo.
 * Los IDs son deliberadamente vacíos — se asignan en DB al insertar.
 * Se exporta sin `id` para usarlas directamente en `create()`.
 */
export const SEED_CATEGORIES: Omit<Category, "id">[] = [
  // ── Gastos ─────────────────────────────────────────────────────────────────
  { name: "Alimentación",            type: "expense", budget: 200000, accent: "#f97316", iconKey: "utensils"       },
  { name: "Transporte",              type: "expense", budget:  80000, accent: "#3b82f6", iconKey: "car"            },
  { name: "Vivienda y Arriendo",     type: "expense", budget: 400000, accent: "#0891b2", iconKey: "house"          },
  { name: "Salud y Farmacia",        type: "expense", budget:  80000, accent: "#ef4444", iconKey: "heart-pulse"    },
  { name: "Educación",               type: "expense", budget:  60000, accent: "#22c55e", iconKey: "graduation-cap" },
  { name: "Entretenimiento",         type: "expense", budget:  60000, accent: "#eab308", iconKey: "gamepad"        },
  { name: "Ropa y Accesorios",       type: "expense", budget:  60000, accent: "#8b5cf6", iconKey: "shirt"          },
  { name: "Tecnología",              type: "expense", budget:  50000, accent: "#6366f1", iconKey: "tv"             },
  { name: "Restaurantes",            type: "expense", budget:  80000, accent: "#be123c", iconKey: "utensils"       },
  { name: "Supermercado",            type: "expense", budget: 150000, accent: "#92400e", iconKey: "shopping-cart"  },
  { name: "Mascotas",                type: "expense", budget:  30000, accent: "#991b1b", iconKey: "paw-print"      },
  { name: "Hijos y Familia",         type: "expense", budget:  80000, accent: "#16a34a", iconKey: "baby"           },
  { name: "Seguros",                 type: "expense", budget:  50000, accent: "#7c3aed", iconKey: "shield"         },
  { name: "Suscripciones",           type: "expense", budget:  30000, accent: "#15803d", iconKey: "music"          },
  { name: "Servicios Básicos",       type: "expense", budget:  60000, accent: "#2563eb", iconKey: "zap"            },
  { name: "Deporte y Gym",           type: "expense", budget:  40000, accent: "#ec4899", iconKey: "dumbbell"       },
  { name: "Viajes",                  type: "expense", budget: 100000, accent: "#0284c7", iconKey: "plane"          },
  { name: "Belleza y Cuidado",       type: "expense", budget:  30000, accent: "#c026d3", iconKey: "scissors"       },
  { name: "Hogar y Decoración",      type: "expense", budget:  40000, accent: "#78716c", iconKey: "wrench"         },
  { name: "Ahorro y Fondos",         type: "expense", budget: 200000, accent: "#10b981", iconKey: "piggy-bank"     },
  { name: "Deudas y Préstamos",      type: "expense", budget: 100000, accent: "#dc2626", iconKey: "credit-card"    },
  { name: "Regalos",                 type: "expense", budget:  20000, accent: "#f59e0b", iconKey: "gift"           },
  { name: "Comunicaciones",          type: "expense", budget:  30000, accent: "#06b6d4", iconKey: "wifi"           },
  { name: "Cafetería y Snacks",      type: "expense", budget:  25000, accent: "#a16207", iconKey: "coffee"         },
  { name: "Salidas Nocturnas",       type: "expense", budget:  40000, accent: "#7c2d12", iconKey: "wine"           },

  // ── Ingresos ───────────────────────────────────────────────────────────────
  { name: "Sueldo y Salario",         type: "income",  budget: 0, accent: "#4f46e5", iconKey: "wallet"       },
  { name: "Freelance e Independiente",type: "income",  budget: 0, accent: "#78716c", iconKey: "briefcase"    },
  { name: "Inversiones",              type: "income",  budget: 0, accent: "#7c3aed", iconKey: "trending-up"  },
  { name: "Arriendo de Propiedades",  type: "income",  budget: 0, accent: "#e11d48", iconKey: "house"        },
  { name: "Bonos y Comisiones",       type: "income",  budget: 0, accent: "#1e40af", iconKey: "badge-dollar" },
  { name: "Beneficios del Gobierno",  type: "income",  budget: 0, accent: "#15803d", iconKey: "landmark"     },
  { name: "Ventas",                   type: "income",  budget: 0, accent: "#0891b2", iconKey: "tag"          },
  { name: "Propinas",                 type: "income",  budget: 0, accent: "#16a34a", iconKey: "coins"        },
  { name: "Dividendos e Intereses",   type: "income",  budget: 0, accent: "#6d28d9", iconKey: "bar-chart"    },
  { name: "Reembolsos",               type: "income",  budget: 0, accent: "#065f46", iconKey: "receipt"      },
  { name: "Pensión y Jubilación",     type: "income",  budget: 0, accent: "#1d4ed8", iconKey: "users"        },
  { name: "Otros Ingresos",           type: "income",  budget: 0, accent: "#991b1b", iconKey: "layers"       },
];
