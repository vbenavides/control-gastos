import type { Metadata } from "next";

import { AddIncomeScreen } from "@/components/screens/add-income-screen";

export const metadata: Metadata = {
  title: "Agregar Ingreso",
};

export default function AddIncomePage() {
  return <AddIncomeScreen />;
}
