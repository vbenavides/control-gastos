import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountType, CurrencyCode, DebitAccount } from "@/lib/models";
import type { IDebitAccountRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  name: string;
  balance: number;
  type: string;
  currency_code: string;
  created_at: string;
};

function rowToModel(row: DbRow): DebitAccount {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    type: row.type as AccountType,
    currencyCode: row.currency_code as CurrencyCode,
    createdAt: row.created_at,
  };
}

export class SupabaseDebitAccountRepository implements IDebitAccountRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async getAll(): Promise<DebitAccount[]> {
    const { data, error } = await this.supabase
      .from("debit_accounts")
      .select("*")
      .eq("profile_id", this.profileId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getById(id: string): Promise<DebitAccount | null> {
    const { data, error } = await this.supabase
      .from("debit_accounts")
      .select("*")
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async create(data: Omit<DebitAccount, "id" | "createdAt">): Promise<DebitAccount> {
    const { data: created, error } = await this.supabase
      .from("debit_accounts")
      .insert({
        profile_id: this.profileId,
        name: data.name,
        balance: data.balance,
        type: data.type,
        currency_code: data.currencyCode,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToModel(created as DbRow);
  }

  async update(
    id: string,
    data: Partial<Omit<DebitAccount, "id" | "createdAt">>,
  ): Promise<DebitAccount> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.balance !== undefined) patch.balance = data.balance;
    if (data.type !== undefined) patch.type = data.type;
    if (data.currencyCode !== undefined) patch.currency_code = data.currencyCode;

    const { data: updated, error } = await this.supabase
      .from("debit_accounts")
      .update(patch)
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .select()
      .single();
    if (error) throw error;
    return rowToModel(updated as DbRow);
  }

  async adjustBalance(id: string, delta: number): Promise<void> {
    const { error } = await this.supabase.rpc("adjust_account_balance", {
      p_account_id: id,
      p_delta: delta,
    });
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("debit_accounts")
      .delete()
      .eq("id", id)
      .eq("profile_id", this.profileId);
    if (error) throw error;
  }
}
