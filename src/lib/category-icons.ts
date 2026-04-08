/**
 * category-icons.ts
 *
 * Registro centralizado de íconos y colores para las categorías.
 * Usado por: category-manager-screen, category-form-screen, icon-color-picker.
 */

import {
  Activity,
  Apple,
  Baby,
  BadgeDollarSign,
  BarChart2,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  Camera,
  Car,
  ChefHat,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Film,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  Headphones,
  Heart,
  HeartPulse,
  House,
  Landmark,
  Layers,
  Library,
  LineChart,
  Lightbulb,
  MapPin,
  Mic,
  Music,
  Package,
  PawPrint,
  Pencil,
  Percent,
  PieChart,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  Scissors,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Stethoscope,
  Tag,
  Ticket,
  TrainFront,
  TrendingDown,
  TrendingUp,
  Truck,
  Tv,
  Users,
  User,
  Utensils,
  Wallet,
  Wifi,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Icon map: iconKey → LucideIcon ──────────────────────────────────────────

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Dinero y Finanzas
  "wallet":           Wallet,
  "credit-card":      CreditCard,
  "receipt":          Receipt,
  "badge-dollar":     BadgeDollarSign,
  "coins":            Coins,
  "piggy-bank":       PiggyBank,
  "landmark":         Landmark,
  "trending-up":      TrendingUp,
  "trending-down":    TrendingDown,
  "bar-chart":        BarChart2,
  "pie-chart":        PieChart,
  "line-chart":       LineChart,
  "percent":          Percent,
  "layers":           Layers,
  "shield":           Shield,

  // Hogar y Vida
  "house":            House,
  "wrench":           Wrench,
  "lightbulb":        Lightbulb,
  "flame":            Flame,
  "tv":               Tv,
  "wifi":             Wifi,
  "zap":              Zap,

  // Comida y Bebida
  "utensils":         Utensils,
  "shopping-cart":    ShoppingCart,
  "coffee":           Coffee,
  "wine":             Wine,
  "beer":             Beer,
  "pizza":            Pizza,
  "chef-hat":         ChefHat,
  "apple":            Apple,

  // Transporte
  "car":              Car,
  "bus":              Bus,
  "train":            TrainFront,
  "plane":            Plane,
  "bike":             Bike,
  "fuel":             Fuel,
  "map-pin":          MapPin,
  "truck":            Truck,

  // Salud y Bienestar
  "heart-pulse":      HeartPulse,
  "stethoscope":      Stethoscope,
  "pill":             Pill,
  "baby":             Baby,
  "dumbbell":         Dumbbell,
  "activity":         Activity,
  "heart":            Heart,

  // Entretenimiento
  "music":            Music,
  "gamepad":          Gamepad2,
  "film":             Film,
  "camera":           Camera,
  "headphones":       Headphones,
  "ticket":           Ticket,
  "mic":              Mic,

  // Educación
  "graduation-cap":   GraduationCap,
  "book-open":        BookOpen,
  "pencil":           Pencil,
  "globe":            Globe,
  "library":          Library,

  // Personas y Familia
  "users":            Users,
  "user":             User,
  "star":             Star,
  "gift":             Gift,
  "paw-print":        PawPrint,

  // Trabajo y Negocios
  "briefcase":        Briefcase,
  "package":          Package,
  "tag":              Tag,
  "shopping-bag":     ShoppingBag,
  "scissors":         Scissors,
  "hammer":           Hammer,

  // Estilo
  "shirt":            Shirt,
};

// ─── Section data for the icon picker ────────────────────────────────────────

export type IconSection = {
  label: string;
  icons: string[];
};

export const ICON_SECTIONS: IconSection[] = [
  {
    label: "Dinero y Finanzas",
    icons: [
      "wallet", "credit-card", "receipt", "badge-dollar", "coins",
      "piggy-bank", "landmark", "trending-up", "trending-down", "bar-chart",
      "pie-chart", "line-chart", "percent", "layers", "shield",
    ],
  },
  {
    label: "Hogar y Vida",
    icons: ["house", "wrench", "lightbulb", "flame", "tv", "wifi", "zap"],
  },
  {
    label: "Comida y Bebida",
    icons: ["utensils", "shopping-cart", "coffee", "wine", "beer", "pizza", "chef-hat", "apple"],
  },
  {
    label: "Transporte",
    icons: ["car", "bus", "train", "plane", "bike", "fuel", "map-pin", "truck"],
  },
  {
    label: "Salud y Bienestar",
    icons: ["heart-pulse", "stethoscope", "pill", "baby", "dumbbell", "activity", "heart"],
  },
  {
    label: "Entretenimiento",
    icons: ["music", "gamepad", "film", "camera", "headphones", "ticket", "mic"],
  },
  {
    label: "Educación",
    icons: ["graduation-cap", "book-open", "pencil", "globe", "library"],
  },
  {
    label: "Personas y Familia",
    icons: ["users", "user", "star", "gift", "paw-print"],
  },
  {
    label: "Trabajo y Negocios",
    icons: ["briefcase", "package", "tag", "shopping-bag", "scissors", "hammer"],
  },
  {
    label: "Estilo y Moda",
    icons: ["shirt"],
  },
];

// ─── Color palette for the color picker ──────────────────────────────────────

export const CATEGORY_COLORS: string[] = [
  // Rojos → Naranjas → Amarillos
  "#ef4444", "#f97316", "#fb923c", "#f59e0b", "#eab308",
  // Amarillo-verdes → Verdes
  "#a3e635", "#84cc16", "#65a30d", "#22c55e", "#16a34a",
  // Verdes oscuros → Teal
  "#15803d", "#047857", "#059669", "#10b981", "#34d399",
  // Cyan → Azules
  "#06b6d4", "#0ea5e9", "#3b82f6", "#2563eb", "#4f46e5",
  // Índigos → Púrpuras
  "#4338ca", "#7c3aed", "#8b5cf6", "#a855f7", "#c026d3",
  // Rosas → Rojos
  "#db2777", "#e11d48", "#f43f5e", "#be123c", "#dc2626",
  // Blanco
  "#ffffff",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

export function resolveIcon(iconKey: string | undefined, fallbackIndex = 0): LucideIcon {
  if (iconKey) {
    const found = CATEGORY_ICON_MAP[iconKey];
    if (found) return found;
  }
  const values = Object.values(CATEGORY_ICON_MAP);
  return values[fallbackIndex % values.length] ?? Utensils;
}
