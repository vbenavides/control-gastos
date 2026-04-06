import type { Metadata } from "next";

import { AddPaymentScreen } from "@/components/screens/add-payment-screen";

export const metadata: Metadata = {
  title: "Agregar Pago",
};

export default function AddPaymentPage() {
  return <AddPaymentScreen />;
}
