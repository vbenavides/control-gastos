import type { Metadata } from "next";

import { CategoryManagerScreen } from "@/components/screens/category-manager-screen";

export const metadata: Metadata = {
  title: "Categorías",
};

export default function GestionCategoriasPage() {
  return <CategoryManagerScreen />;
}
