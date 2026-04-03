import type { Metadata } from "next";
import { AccountsScreen } from "@/components/screens/accounts-screen";

export const metadata: Metadata = {
  title: "Cuentas",
};

export default function AccountsPage() {
  return <AccountsScreen />;
}
