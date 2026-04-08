import type { Metadata } from "next";

import { CategoryFormScreen } from "@/components/screens/category-form-screen";

export const metadata: Metadata = {
  title: "Editar Categoría",
};

type Props = {
  params: Promise<{ categoryId: string }>;
};

export default async function EditarCategoriaPage({ params }: Props) {
  const { categoryId } = await params;
  return <CategoryFormScreen mode="edit" categoryId={categoryId} />;
}
