import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditCardStatementScreen } from "@/components/screens/credit-card-statement-screen";

export const metadata: Metadata = {
  title: "Estado de Cuenta",
};

export default function CreditCardStatementPage() {
  return (
    <Suspense fallback={null}>
      <CreditCardStatementScreen />
    </Suspense>
  );
}
