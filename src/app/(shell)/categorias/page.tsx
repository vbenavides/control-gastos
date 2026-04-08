import type { Metadata } from "next";
import { CategoriesScreen } from "@/components/screens/categories-screen";

export const metadata: Metadata = {
  title: "Presupuesto",
};

export default function CategoriesPage() {
  return <CategoriesScreen />;
}
