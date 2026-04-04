import type { Metadata } from "next";

import { AddCreditCardScreen } from "@/components/screens/add-credit-card-screen";

export const metadata: Metadata = {
  title: "Agregar tarjeta de crédito",
};

export default function AddCreditCardPage() {
  return <AddCreditCardScreen />;
}
