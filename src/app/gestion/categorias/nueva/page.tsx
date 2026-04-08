import type { Metadata } from "next";

import { CategoryFormScreen } from "@/components/screens/category-form-screen";

export const metadata: Metadata = {
  title: "Nueva Categoría",
};

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NuevaCategoriaPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const defaultType = type === "income" ? "income" : "expense";
  return <CategoryFormScreen mode="create" defaultType={defaultType} />;
}
