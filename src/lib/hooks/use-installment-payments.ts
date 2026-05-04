"use client";

import { useAppData } from "@/components/app-data-provider";
import type { InstallmentPayment } from "@/lib/models";

export type UseInstallmentPaymentsResult = {
  installmentPayments: InstallmentPayment[] | null;
  isLoading: boolean;
  create: (data: Omit<InstallmentPayment, "id" | "createdAt">) => Promise<InstallmentPayment>;
  update: (
    id: string,
    data: Partial<Omit<InstallmentPayment, "id" | "createdAt">>,
  ) => Promise<InstallmentPayment>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useInstallmentPayments(): UseInstallmentPaymentsResult {
  const {
    installmentPayments,
    isHydrated,
    createInstallmentPayment,
    updateInstallmentPayment,
    removeInstallmentPayment,
    refreshInstallmentPayments,
  } = useAppData();

  return {
    installmentPayments,
    isLoading: !isHydrated,
    create: createInstallmentPayment,
    update: updateInstallmentPayment,
    remove: removeInstallmentPayment,
    refresh: refreshInstallmentPayments,
  };
}
