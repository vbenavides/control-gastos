import { Suspense } from "react";
import type { Metadata } from "next";

import { AddInstallmentsScreen } from "@/components/screens/add-installments-screen";

export const metadata: Metadata = {
  title: "Agregar Compra a Meses",
};

export default function AddInstallmentsPage() {
  return (
    <Suspense>
      <AddInstallmentsScreen />
    </Suspense>
  );
}
