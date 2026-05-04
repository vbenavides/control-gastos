import type { SupabaseClient } from "@supabase/supabase-js";

import type { InstallmentPayment } from "@/lib/models";
import type { IInstallmentPaymentRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  purchase_transaction_id: string;
  installment_number: number;
  amount: number;
  paid_from_account_id: string;
  payment_date: string;
  debit_transaction_id: string;
  is_paid: boolean;
  note: string | null;
  created_at: string;
};

function rowToModel(row: DbRow): InstallmentPayment {
  return {
    id: row.id,
    profileId: row.profile_id,
    purchaseTransactionId: row.purchase_transaction_id,
    installmentNumber: row.installment_number,
    amount: row.amount,
    paidFromAccountId: row.paid_from_account_id,
    paymentDate: row.payment_date,
    debitTransactionId: row.debit_transaction_id,
    isPaid: row.is_paid,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export class SupabaseInstallmentPaymentRepository implements IInstallmentPaymentRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async getAll(): Promise<InstallmentPayment[]> {
    const { data, error } = await this.supabase
      .from("installment_payments")
      .select("*")
      .eq("profile_id", this.profileId)
      .order("installment_number", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getByPurchaseTransactionId(purchaseTransactionId: string): Promise<InstallmentPayment[]> {
    const { data, error } = await this.supabase
      .from("installment_payments")
      .select("*")
      .eq("profile_id", this.profileId)
      .eq("purchase_transaction_id", purchaseTransactionId)
      .order("installment_number", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getById(id: string): Promise<InstallmentPayment | null> {
    const { data, error } = await this.supabase
      .from("installment_payments")
      .select("*")
      .eq("profile_id", this.profileId)
      .eq("id", id)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async create(
    data: Omit<InstallmentPayment, "id" | "createdAt">,
  ): Promise<InstallmentPayment> {
    const { data: created, error } = await this.supabase
      .from("installment_payments")
      .insert({
        profile_id: data.profileId,
        purchase_transaction_id: data.purchaseTransactionId,
        installment_number: data.installmentNumber,
        amount: data.amount,
        paid_from_account_id: data.paidFromAccountId,
        payment_date: data.paymentDate,
        debit_transaction_id: data.debitTransactionId,
        is_paid: data.isPaid,
        note: data.note,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToModel(created as DbRow);
  }

  async update(
    id: string,
    data: Partial<Omit<InstallmentPayment, "id" | "createdAt">>,
  ): Promise<InstallmentPayment> {
    const patch: Record<string, unknown> = {};
    if (data.profileId !== undefined) patch.profile_id = data.profileId;
    if (data.purchaseTransactionId !== undefined) patch.purchase_transaction_id = data.purchaseTransactionId;
    if (data.installmentNumber !== undefined) patch.installment_number = data.installmentNumber;
    if (data.amount !== undefined) patch.amount = data.amount;
    if (data.paidFromAccountId !== undefined) patch.paid_from_account_id = data.paidFromAccountId;
    if (data.paymentDate !== undefined) patch.payment_date = data.paymentDate;
    if (data.debitTransactionId !== undefined) patch.debit_transaction_id = data.debitTransactionId;
    if (data.isPaid !== undefined) patch.is_paid = data.isPaid;
    if (data.note !== undefined) patch.note = data.note;

    const { data: updated, error } = await this.supabase
      .from("installment_payments")
      .update(patch)
      .eq("profile_id", this.profileId)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToModel(updated as DbRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("installment_payments")
      .delete()
      .eq("profile_id", this.profileId)
      .eq("id", id);
    if (error) throw error;
  }
}
