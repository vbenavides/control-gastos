import type { SupabaseClient } from "@supabase/supabase-js";

import type { Transaction, TransactionIconKind, TransactionKind } from "@/lib/models";
import type { ITransactionRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  account_id: string | null;
  amount: number;
  description: string | null;
  category: string | null;
  date: string | null;
  payment_date: string | null;
  kind: string | null;
  icon_kind: string | null;
  icon_background: string | null;
  icon_color: string | null;
  note: string | null;
  status_label: string | null;
  is_pending: boolean | null;
  created_at: string | null;
  transfer_pair_id: string | null;
};

function rowToModel(row: DbRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id ?? "",
    amount: row.amount,
    description: row.description ?? "",
    category: row.category ?? "",
    date: row.date ?? new Date().toISOString(),
    paymentDate: row.payment_date ?? new Date().toISOString(),
    kind: (row.kind ?? "expense") as TransactionKind,
    iconKind: (row.icon_kind ?? "shopping-cart") as TransactionIconKind,
    iconBackground: row.icon_background ?? "#000",
    iconColor: row.icon_color ?? "#fff",
    note: row.note ?? undefined,
    statusLabel: row.status_label ?? "",
    isPending: row.is_pending ?? false,
    createdAt: row.created_at ?? undefined,
    transferPairId: row.transfer_pair_id ?? undefined,
  };
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("profile_id", this.profileId)
      .order("date", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getByAccountId(accountId: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("profile_id", this.profileId)
      .eq("account_id", accountId)
      .order("date", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async create(data: Omit<Transaction, "id">): Promise<Transaction> {
    const { data: created, error } = await this.supabase
      .from("transactions")
      .insert({
        profile_id: this.profileId,
        account_id: data.accountId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        payment_date: data.paymentDate,
        kind: data.kind,
        icon_kind: data.iconKind,
        icon_background: data.iconBackground,
        icon_color: data.iconColor,
        note: data.note,
        status_label: data.statusLabel,
        is_pending: data.isPending ?? false,
        transfer_pair_id: data.transferPairId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToModel(created as DbRow);
  }

  async update(id: string, data: Partial<Omit<Transaction, "id">>): Promise<Transaction> {
    const patch: Record<string, unknown> = {};
    if (data.accountId !== undefined) patch.account_id = data.accountId;
    if (data.amount !== undefined) patch.amount = data.amount;
    if (data.description !== undefined) patch.description = data.description;
    if (data.category !== undefined) patch.category = data.category;
    if (data.date !== undefined) patch.date = data.date;
    if (data.paymentDate !== undefined) patch.payment_date = data.paymentDate;
    if (data.kind !== undefined) patch.kind = data.kind;
    if (data.iconKind !== undefined) patch.icon_kind = data.iconKind;
    if (data.iconBackground !== undefined) patch.icon_background = data.iconBackground;
    if (data.iconColor !== undefined) patch.icon_color = data.iconColor;
    if (data.note !== undefined) patch.note = data.note;
    if (data.statusLabel !== undefined) patch.status_label = data.statusLabel;
    if (data.isPending !== undefined) patch.is_pending = data.isPending;
    if (data.transferPairId !== undefined) patch.transfer_pair_id = data.transferPairId;

    const { data: updated, error } = await this.supabase
      .from("transactions")
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
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("profile_id", this.profileId);
    if (error) throw error;
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from("transactions")
      .delete()
      .eq("profile_id", this.profileId)
      .eq("account_id", accountId);
    if (error) throw error;
  }
}
