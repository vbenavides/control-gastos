import type { Metadata } from "next";

import { AddRefundScreen } from "@/components/screens/add-refund-screen";

export const metadata: Metadata = {
  title: "Agregar Reembolso",
};

export default function AddRefundPage() {
  return <AddRefundScreen />;
}
