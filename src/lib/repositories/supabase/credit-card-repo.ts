import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreditCard, CurrencyCode, PaymentScheduleMode } from "@/lib/models";
import type { ICreditCardRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  name: string;
  last4: string | null;
  balance: number;
  credit_limit: number | null;
  currency_code: string;
  interest_rate: number | null;
  statement_day: number | null;
  payment_day: number | null;
  grace_period_days: number | null;
  payment_reminder_enabled: boolean;
  payment_schedule_mode: string | null;
  created_at: string;
};

function rowToModel(row: DbRow): CreditCard {
  return {
    id: row.id,
    name: row.name,
    last4: row.last4 ?? "",
    balance: row.balance,
    limit: row.credit_limit ?? 0,
    currencyCode: row.currency_code as CurrencyCode,
    interestRate: row.interest_rate ?? 0,
    statementDay: row.statement_day ?? 1,
    paymentDay: row.payment_day ?? 1,
    gracePeriodDays: row.grace_period_days ?? 0,
    paymentReminderEnabled: row.payment_reminder_enabled,
    paymentScheduleMode: (row.payment_schedule_mode as PaymentScheduleMode) ?? "manual",
    createdAt: row.created_at,
  };
}

export class SupabaseCreditCardRepository implements ICreditCardRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async getAll(): Promise<CreditCard[]> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .select("*")
      .eq("profile_id", this.profileId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getById(id: string): Promise<CreditCard | null> {
    const { data, error } = await this.supabase
      .from("credit_cards")
      .select("*")
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async create(data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard> {
    const { data: created, error } = await this.supabase
      .from("credit_cards")
      .insert({
        profile_id: this.profileId,
        name: data.name,
        last4: data.last4,
        balance: data.balance,
        credit_limit: data.limit,
        currency_code: data.currencyCode,
        interest_rate: data.interestRate,
        statement_day: data.statementDay,
        payment_day: data.paymentDay,
        grace_period_days: data.gracePeriodDays,
        payment_reminder_enabled: data.paymentReminderEnabled,
        payment_schedule_mode: data.paymentScheduleMode ?? "manual",
      })
      .select()
      .single();
    if (error) throw error;
    return rowToModel(created as DbRow);
  }

  async update(
    id: string,
    data: Partial<Omit<CreditCard, "id" | "createdAt">>,
  ): Promise<CreditCard> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.last4 !== undefined) patch.last4 = data.last4;
    if (data.balance !== undefined) patch.balance = data.balance;
    if (data.limit !== undefined) patch.credit_limit = data.limit;
    if (data.currencyCode !== undefined) patch.currency_code = data.currencyCode;
    if (data.interestRate !== undefined) patch.interest_rate = data.interestRate;
    if (data.statementDay !== undefined) patch.statement_day = data.statementDay;
    if (data.paymentDay !== undefined) patch.payment_day = data.paymentDay;
    if (data.gracePeriodDays !== undefined) patch.grace_period_days = data.gracePeriodDays;
    if (data.paymentReminderEnabled !== undefined)
      patch.payment_reminder_enabled = data.paymentReminderEnabled;
    if (data.paymentScheduleMode !== undefined)
      patch.payment_schedule_mode = data.paymentScheduleMode;

    const { data: updated, error } = await this.supabase
      .from("credit_cards")
      .update(patch)
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .select()
      .single();
    if (error) throw error;
    return rowToModel(updated as DbRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("credit_cards")
      .delete()
      .eq("id", id)
      .eq("profile_id", this.profileId);
    if (error) throw error;
  }
}
