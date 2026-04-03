import type { Metadata } from "next";
import { MenuScreen } from "@/components/screens/menu-screen";

export const metadata: Metadata = {
  title: "Menú",
};

export default function MenuPage() {
  return <MenuScreen />;
}
