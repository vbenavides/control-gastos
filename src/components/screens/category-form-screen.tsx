"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CategoryIconColorPicker } from "@/components/ui/category-icon-color-picker";
import { resolveIcon } from "@/lib/category-icons";
import { useCategories } from "@/lib/hooks/use-categories";
import type { CategoryType } from "@/lib/models";

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative z-10 w-full max-w-[18rem] rounded-[1.2rem] bg-[var(--surface-strong)] px-6 py-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <p className="text-[1.05rem] font-semibold text-[var(--text-primary)]">
          Eliminar Categoría
        </p>
        <p className="mt-2 text-[0.9rem] text-[var(--text-secondary)]">
          ¿Estás seguro?
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-[0.9rem] font-semibold text-white transition hover:opacity-90"
          >
            NO
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#dc2626] px-6 py-2 text-[0.9rem] font-semibold text-white transition hover:opacity-90"
          >
            SI
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--line)] px-4 pb-3 pt-4">
      <p className="text-[0.72rem] font-medium text-[var(--text-secondary)]">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props =
  | { mode: "create"; defaultType?: "expense" | "income" }
  | { mode: "edit"; categoryId: string };

export function CategoryFormScreen(props: Props) {
  const router = useRouter();
  const { categories, create, update, remove } = useCategories();

  const isEdit = props.mode === "edit";
  const categoryId = isEdit ? props.categoryId : null;
  const defaultType = !isEdit && props.defaultType ? props.defaultType : "expense";

  // ── State ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [accent, setAccent] = useState("#7c3aed");
  const [iconKey, setIconKey] = useState("layers");
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Pre-fill for edit ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !categories) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setName(cat.name);
    setType(cat.type ?? "expense");
    setAccent(cat.accent);
    setIconKey(cat.iconKey ?? "layers");
  }, [isEdit, categoryId, categories]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (isEdit && categoryId) {
        await update(categoryId, { name: name.trim(), type, accent, iconKey });
      } else {
        await create({ name: name.trim(), type, accent, iconKey, budget: 0 });
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!categoryId) return;
    setIsDeleting(true);
    try {
      await remove(categoryId);
      router.back();
    } finally {
      setIsDeleting(false);
    }
  }

  const PreviewIcon = resolveIcon(iconKey);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative flex shrink-0 items-center justify-between px-2 pb-2 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-primary)] transition hover:bg-white/5"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[1rem] font-semibold text-[var(--text-primary)]">
          {isEdit ? "Editar Categoría" : "Nueva Categoría"}
        </h1>

        {isEdit ? (
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            aria-label="Eliminar categoría"
            className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
          >
            <Trash2 size={20} strokeWidth={1.9} />
          </button>
        ) : (
          <div className="h-11 w-11" aria-hidden="true" />
        )}
      </header>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[640px] flex-1 overflow-y-auto lg:max-w-[720px]">

        {/* Icon preview */}
        <div className="flex justify-center py-7">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            aria-label="Cambiar ícono y color"
            className="relative"
          >
            <div
              className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1rem] transition hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <PreviewIcon size={30} strokeWidth={1.8} color="#fff" />
            </div>
            {/* Pencil badge */}
            <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white shadow-md">
              <Pencil size={11} strokeWidth={2.2} className="text-gray-700" />
            </div>
          </button>
        </div>

        {/* Form fields */}
        <FormField label="Descripción">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            autoComplete="off"
            className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          />
        </FormField>

        <FormField label="Tipo">
          <button
            type="button"
            onClick={() => setType((t) => (t === "expense" ? "income" : "expense"))}
            className="w-full text-left text-[var(--text-primary)]"
          >
            {type === "expense" ? "Gasto" : "Ingreso"}
          </button>
        </FormField>

        <FormField label="Grupo">
          <p className="text-[var(--text-primary)]">Sin Grupo</p>
        </FormField>
      </div>

      {/* ── Footer: Guardar ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[640px] shrink-0 px-4 py-4 lg:max-w-[720px]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="w-full rounded-2xl bg-[var(--accent)] py-4 text-[0.95rem] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {/* ── Icon/color picker bottom sheet ──────────────────────────────── */}
      {showPicker && (
        <CategoryIconColorPicker
          selectedIconKey={iconKey}
          selectedAccent={accent}
          onClose={() => setShowPicker(false)}
          onApply={(key, color) => {
            setIconKey(key);
            setAccent(color);
            setShowPicker(false);
          }}
        />
      )}

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <p className="text-white">Eliminando…</p>
        </div>
      )}
    </div>
  );
}
