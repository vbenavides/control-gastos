import type { Metadata } from "next";

import { EditDebitAccountScreen } from "@/components/screens/edit-debit-account-screen";

export const metadata: Metadata = {
  title: "Editar Cuenta",
};

export default function EditDebitAccountPage() {
  return <EditDebitAccountScreen />;
}
