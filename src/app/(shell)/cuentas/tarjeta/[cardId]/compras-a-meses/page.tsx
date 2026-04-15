import type { Metadata } from "next";

import { CreditCardInstallmentsScreen } from "@/components/screens/credit-card-installments-screen";

export const metadata: Metadata = {
  title: "Compras a Meses",
};

export default function CreditCardInstallmentsPage() {
  return <CreditCardInstallmentsScreen />;
}
