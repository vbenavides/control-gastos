import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardTransactionScreen } from "@/components/screens/credit-card-transaction-screen";

export const metadata: Metadata = {
  title: "Detalle de Transacción",
};

export default function CreditCardTransactionPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardTransactionScreen />
    </Suspense>
  );
}
