import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardDetailScreen } from "@/components/screens/credit-card-detail-screen";

export const metadata: Metadata = {
  title: "Detalle de Tarjeta",
};

export default function CreditCardDetailPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardDetailScreen />
    </Suspense>
  );
}
