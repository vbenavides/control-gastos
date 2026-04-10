import type { SupabaseClient } from "@supabase/supabase-js";

import type { BudgetSettings } from "@/lib/models";
import type { IBudgetSettingsRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  reset_day: number | null;
  include_scheduled_tx: boolean;
  monthly_budget_enabled: boolean;
  monthly_budget: number | null;
};

function rowToModel(row: DbRow): BudgetSettings {
  return {
    resetDay: row.reset_day ?? 1,
    includeScheduledTx: row.include_scheduled_tx,
    monthlyBudgetEnabled: row.monthly_budget_enabled,
    monthlyBudget: row.monthly_budget ?? 0,
  };
}

export class SupabaseBudgetSettingsRepository implements IBudgetSettingsRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async get(): Promise<BudgetSettings | null> {
    const { data, error } = await this.supabase
      .from("budget_settings")
      .select("*")
      .eq("profile_id", this.profileId)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async upsert(data: BudgetSettings): Promise<BudgetSettings> {
    const { data: saved, error } = await this.supabase
      .from("budget_settings")
      .upsert(
        {
          profile_id: this.profileId,
          reset_day: data.resetDay,
          include_scheduled_tx: data.includeScheduledTx,
          monthly_budget_enabled: data.monthlyBudgetEnabled,
          monthly_budget: data.monthlyBudget,
        },
        { onConflict: "profile_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return rowToModel(saved as DbRow);
  }
}
