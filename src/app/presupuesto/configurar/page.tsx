import type { Metadata } from "next";

import { BudgetConfigScreen } from "@/components/screens/budget-config-screen";

export const metadata: Metadata = {
  title: "Presupuesto",
};

export default function PresupuestoConfigurarPage() {
  return <BudgetConfigScreen />;
}
