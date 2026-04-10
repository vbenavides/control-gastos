"use client";

import { useCallback } from "react";

import type { BudgetSettings } from "@/lib/models";
import { useAppData } from "@/components/app-data-provider";

const DEFAULT_SETTINGS: BudgetSettings = {
  resetDay: 1,
  includeScheduledTx: false,
  monthlyBudgetEnabled: true,
  monthlyBudget: 500000,
};

export function useBudgetSettings() {
  const { budgetSettings, isHydrated, saveBudgetSettings } = useAppData();

  const settings = budgetSettings ?? DEFAULT_SETTINGS;

  const updateSettings = useCallback(
    (partial: Partial<BudgetSettings>) => {
      void saveBudgetSettings({ ...settings, ...partial });
    },
    [settings, saveBudgetSettings],
  );

  return { settings, isHydrated, updateSettings };
}
