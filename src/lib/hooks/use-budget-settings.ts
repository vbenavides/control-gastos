"use client";

import { useCallback, useEffect, useState } from "react";

import type { BudgetSettings } from "@/lib/models";

const STORAGE_KEY = "cgapp_budget_settings_v1";

const DEFAULT_SETTINGS: BudgetSettings = {
  resetDay: 1,
  includeScheduledTx: false,
  monthlyBudgetEnabled: true,
  monthlyBudget: 500000,
};

function loadSettings(): BudgetSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<BudgetSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: BudgetSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useBudgetSettings() {
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    Promise.resolve(loadSettings()).then((loaded) => {
      if (!isActive) return;
      setSettings(loaded);
      setIsHydrated(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<BudgetSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, isHydrated, updateSettings };
}
