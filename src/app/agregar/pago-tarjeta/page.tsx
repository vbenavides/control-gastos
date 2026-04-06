import type { Metadata } from "next";

import { AddCardPaymentScreen } from "@/components/screens/add-card-payment-screen";

export const metadata: Metadata = {
  title: "Agregar Pago de Tarjeta",
};

export default function AddCardPaymentPage() {
  return <AddCardPaymentScreen />;
}
