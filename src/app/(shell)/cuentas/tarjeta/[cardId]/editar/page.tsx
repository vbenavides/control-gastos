import type { Metadata } from "next";

import { EditCreditCardScreen } from "@/components/screens/edit-credit-card-screen";

export const metadata: Metadata = {
  title: "Editar Tarjeta",
};

export default function EditCreditCardPage() {
  return <EditCreditCardScreen />;
}
