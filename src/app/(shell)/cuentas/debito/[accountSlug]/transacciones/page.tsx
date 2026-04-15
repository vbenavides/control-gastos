import type { Metadata } from "next";

import { AllTransactionsScreen } from "@/components/screens/all-transactions-screen";

export const metadata: Metadata = {
  title: "Transacciones",
};

export default function AllTransactionsPage() {
  return <AllTransactionsScreen />;
}
