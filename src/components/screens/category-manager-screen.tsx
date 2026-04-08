"use client";

import Link from "next/link";
import { ChevronLeft, FolderOpen, Plus } from "lucide-react";
import { useState } from "react";

import { resolveIcon } from "@/lib/category-icons";
import { useCategories } from "@/lib/hooks/use-categories";
import type { CategoryType } from "@/lib/models";

export function CategoryManagerScreen() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");

  const { categories, isLoading } = useCategories();

  const filtered = (categories ?? []).filter(
    (c) => (c.type ?? "expense") === activeTab,
  );

  return (
    <div className="flex h-dvh flex-col bg-[var(--app-bg)] text-[var(--text-primary)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative flex shrink-0 items-center justify-between px-2 pb-2 pt-3">
        {/* Back */}
        <Link
          href="/menu"
          aria-label="Volver al menú"
          className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-primary)] transition hover:bg-white/5"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </Link>

        {/* Title */}
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[1rem] font-semibold text-[var(--text-primary)]">
          Categorías
        </h1>

        {/* Actions */}
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Carpetas"
            className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
          >
            <FolderOpen size={20} strokeWidth={1.9} />
          </button>
          <Link
            href="/gestion/categorias/nueva"
            aria-label="Nueva categoría"
            className="grid h-11 w-11 place-items-center rounded-2xl text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
          >
            <Plus size={22} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-4 pb-8 pt-3 lg:max-w-[720px]">

          {/* ── Segment control tabs ─────────────────────────────────────── */}
          <div
            className="mb-5 flex rounded-[0.75rem] border border-[var(--line)] bg-[var(--surface)] p-[0.22rem]"
            role="tablist"
            aria-label="Tipo de categoría"
          >
            {(["expense", "income"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "flex-1 rounded-[0.55rem] py-[0.52rem] text-[0.9rem] font-semibold leading-none transition-colors duration-150",
                  activeTab === tab
                    ? "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                {tab === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>

          {/* ── Section label ─────────────────────────────────────────────── */}
          <p className="mb-2 px-1 text-[0.82rem] font-medium text-[var(--text-secondary)]">
            Sin Grupo
          </p>

          {/* ── Category list ─────────────────────────────────────────────── */}
          {isLoading ? (
            <p className="type-body pt-6 text-center text-[var(--text-secondary)]">
              Cargando…
            </p>
          ) : filtered.length === 0 ? (
            <p className="type-body py-10 text-center text-[var(--text-secondary)]">
              No hay categorías todavía.
            </p>
          ) : (
            <ul
              aria-label={
                activeTab === "expense"
                  ? "Categorías de gasto"
                  : "Categorías de ingreso"
              }
            >
              {filtered.map((category, index) => {
                const Icon = resolveIcon(category.iconKey, index);

                return (
                  <li key={category.id}>
                    <Link
                      href={`/gestion/categorias/${category.id}/editar`}
                      className={[
                        "flex items-center gap-3.5 py-[0.62rem] transition hover:opacity-80",
                        index > 0 ? "border-t border-[var(--line)]" : "",
                      ].join(" ")}
                    >
                      {/* Icon badge */}
                      <div
                        className="grid h-[2.35rem] w-[2.35rem] shrink-0 place-items-center rounded-[0.6rem]"
                        style={{ backgroundColor: category.accent }}
                        aria-hidden="true"
                      >
                        <Icon size={18} strokeWidth={1.9} color="#fff" />
                      </div>

                      {/* Name */}
                      <span className="type-body text-[var(--text-primary)]">
                        {category.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
