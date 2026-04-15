import type { Metadata } from "next";

import { DebitTransactionScreen } from "@/components/screens/debit-transaction-screen";

export const metadata: Metadata = {
  title: "Editar Gasto",
};

export default function DebitTransactionPage() {
  return <DebitTransactionScreen />;
}
