import type { Metadata } from "next";
import { CategoryDetailScreen } from "@/components/screens/category-detail-screen";

export const metadata: Metadata = {
  title: "Categoría",
};

export default function CategoryDetailPage() {
  return <CategoryDetailScreen />;
}
