import type { Metadata } from "next";

import { AddCashbackScreen } from "@/components/screens/add-cashback-screen";

export const metadata: Metadata = {
  title: "Agregar Cashback",
};

export default function AddCashbackPage() {
  return <AddCashbackScreen />;
}
