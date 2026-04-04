import type { Metadata } from "next";

import { AddAccountScreen } from "@/components/screens/add-account-screen";

export const metadata: Metadata = {
  title: "Agregar Cuenta",
};

export default function AddAccountPage() {
  return <AddAccountScreen />;
}
