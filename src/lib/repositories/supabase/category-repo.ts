import type { SupabaseClient } from "@supabase/supabase-js";

import type { Category, CategoryType } from "@/lib/models";
import type { ICategoryRepository } from "@/lib/repositories/interfaces";

type DbRow = {
  id: string;
  profile_id: string;
  name: string;
  budget: number | null;
  accent: string | null;
  icon_key: string | null;
  type: string | null;
};

function rowToModel(row: DbRow): Category {
  return {
    id: row.id,
    name: row.name,
    budget: row.budget ?? 0,
    accent: row.accent ?? "#22c55e",
    iconKey: row.icon_key ?? undefined,
    type: (row.type ?? undefined) as CategoryType | undefined,
  };
}

export class SupabaseCategoryRepository implements ICategoryRepository {
  constructor(
    private supabase: SupabaseClient,
    private profileId: string,
  ) {}

  async getAll(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("profile_id", this.profileId)
      .order("name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map(rowToModel);
  }

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("profile_id", this.profileId)
      .single();
    if (error) return null;
    return rowToModel(data as DbRow);
  }

  async create(data: Omit<Category, "id">): Promise<Category> {
    const { data: created, error } = await this.supabase
      .from("categories")
      .insert({
        profile_id: this.profileId,
        name: data.name,
        budget: data.budget,
        accent: data.accent,
        icon_key: data.iconKey,
        type: data.type,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToModel(created as DbRow);
  }

  async update(id: string, data: Partial<Omit<Category, "id">>): Promise<Category> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.budget !== undefined) patch.budget = data.budget;
    if (data.accent !== undefined) patch.accent = data.accent;
    if (data.iconKey !== undefined) patch.icon_key = data.iconKey;
    if (data.type !== undefined) patch.type = data.type;

    const { data: updated, error } = await this.supabase
      .from("categories")
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
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("profile_id", this.profileId);
    if (error) throw error;
  }
}
