import type { Metadata } from "next";

import { AddTransferScreen } from "@/components/screens/add-transfer-screen";

export const metadata: Metadata = {
  title: "Agregar Transferencia",
};

export default function AddTransferPage() {
  return <AddTransferScreen />;
}
