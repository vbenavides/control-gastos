import type { Metadata } from "next";
import { Suspense } from "react";

import { AddCardPaymentScreen } from "@/components/screens/add-card-payment-screen";

export const metadata: Metadata = {
  title: "Agregar Pago de Tarjeta",
};

export default function AddCardPaymentPage() {
  return (
    <Suspense fallback={null}>
      <AddCardPaymentScreen />
    </Suspense>
  );
}
