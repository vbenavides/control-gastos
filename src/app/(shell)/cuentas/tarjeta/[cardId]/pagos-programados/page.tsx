import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardScheduledPaymentsScreen } from "@/components/screens/credit-card-scheduled-payments-screen";

export const metadata: Metadata = {
  title: "Programación de Pagos",
};

export default function CreditCardScheduledPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardScheduledPaymentsScreen />
    </Suspense>
  );
}
