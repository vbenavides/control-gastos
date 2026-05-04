import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardInstallmentDetailScreen } from "@/components/screens/credit-card-installment-detail-screen";

export const metadata: Metadata = {
  title: "Detalle de Compra a Meses",
};

export default function CreditCardInstallmentDetailPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardInstallmentDetailScreen />
    </Suspense>
  );
}
