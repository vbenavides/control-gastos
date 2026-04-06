import type { Metadata } from "next";

import { AddExpenseScreen } from "@/components/screens/add-expense-screen";

export const metadata: Metadata = {
  title: "Agregar Gasto",
};

export default function AddExpensePage() {
  return <AddExpenseScreen />;
}
