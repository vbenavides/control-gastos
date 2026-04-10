import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { AppDataProvider } from "@/components/app-data-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ProfileProvider } from "@/lib/profile/profile-context";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Control Gastos",
    template: "%s | Control Gastos",
  },
  description: "Frontend mobile-first para control de gastos con datos mockeados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--app-bg)] font-sans text-[var(--text-primary)]">
        <AuthProvider>
          <ProfileProvider>
            <AppDataProvider>{children}</AppDataProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
