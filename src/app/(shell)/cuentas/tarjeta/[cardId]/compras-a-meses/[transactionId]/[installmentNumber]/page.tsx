import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardInstallmentPaymentScreen } from "@/components/screens/credit-card-installment-payment-screen";

export const metadata: Metadata = {
  title: "Pago de Cuota",
};

export default function CreditCardInstallmentPaymentPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardInstallmentPaymentScreen />
    </Suspense>
  );
}
