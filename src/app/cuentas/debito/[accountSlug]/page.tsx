import type { Metadata } from "next";
import { Suspense } from "react";

import { DebitAccountScreen } from "@/components/screens/debit-account-screen";

export const metadata: Metadata = {
  title: "Detalle de Cuenta",
};

export default function DebitAccountPage() {
  return (
    <Suspense fallback={null}>
      <DebitAccountScreen />
    </Suspense>
  );
}
