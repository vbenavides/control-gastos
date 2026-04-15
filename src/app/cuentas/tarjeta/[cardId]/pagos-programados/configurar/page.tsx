import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardPaymentScheduleConfigScreen } from "@/components/screens/credit-card-payment-schedule-config-screen";

export const metadata: Metadata = {
  title: "Generación de Pagos",
};

export default function CreditCardPaymentScheduleConfigPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardPaymentScheduleConfigScreen />
    </Suspense>
  );
}
