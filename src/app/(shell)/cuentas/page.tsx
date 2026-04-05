import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountsScreen } from "@/components/screens/accounts-screen";

export const metadata: Metadata = {
  title: "Cuentas",
};

export default function AccountsPage() {
  return (
    <Suspense fallback={null}>
      <AccountsScreen />
    </Suspense>
  );
}
