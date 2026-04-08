"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CATEGORY_COLORS,
  CATEGORY_ICON_MAP,
  ICON_SECTIONS,
} from "@/lib/category-icons";

type PickerTab = "icon" | "color";

type Props = {
  selectedIconKey: string;
  selectedAccent: string;
  onClose: () => void;
  onApply: (iconKey: string, accent: string) => void;
};

export function CategoryIconColorPicker({
  selectedIconKey,
  selectedAccent,
  onClose,
  onApply,
}: Props) {
  const [tab, setTab] = useState<PickerTab>("icon");
  const [pendingIcon, setPendingIcon] = useState(selectedIconKey);
  const [pendingColor, setPendingColor] = useState(selectedAccent);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const PreviewIcon = CATEGORY_ICON_MAP[pendingIcon] ?? CATEGORY_ICON_MAP["layers"];

  function handleApply() {
    onApply(pendingIcon, pendingColor);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar ícono y color"
        className="relative z-10 flex max-h-[80svh] flex-col rounded-t-[1.5rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:mx-auto sm:w-full sm:max-w-[540px] lg:max-w-[580px]"
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[var(--text-secondary)] transition hover:bg-white/15 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Preview icon centered */}
        <div className="flex justify-center pt-6 pb-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-[1rem]"
            style={{ backgroundColor: pendingColor }}
          >
            {PreviewIcon && <PreviewIcon size={30} strokeWidth={1.8} color="#fff" />}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)]" role="tablist">
          {(["icon", "color"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={[
                "flex-1 pb-3 pt-2 text-[0.92rem] font-semibold transition-colors",
                tab === t
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {t === "icon" ? "Ícono" : "Color"}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "icon" ? (
            <IconGrid
              selected={pendingIcon}
              onSelect={setPendingIcon}
            />
          ) : (
            <ColorGrid
              selected={pendingColor}
              onSelect={setPendingColor}
            />
          )}
        </div>

        {/* Apply button */}
        <div className="border-t border-[var(--line)] px-4 py-4">
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-2xl bg-[var(--accent)] py-3.5 text-[0.95rem] font-semibold text-white transition hover:opacity-90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Icon grid ────────────────────────────────────────────────────────────────

function IconGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="px-4 pb-2 pt-3">
      {ICON_SECTIONS.map((section) => (
        <div key={section.label} className="mb-5">
          <p className="mb-3 text-[0.78rem] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            {section.label}
          </p>
          <div className="grid grid-cols-5 gap-3">
            {section.icons.map((iconKey) => {
              const Icon = CATEGORY_ICON_MAP[iconKey];
              if (!Icon) return null;
              const isSelected = selected === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  aria-label={iconKey}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(iconKey)}
                  className={[
                    "grid aspect-square place-items-center rounded-[0.7rem] transition",
                    isSelected
                      ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                      : "bg-white/6 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Icon size={22} strokeWidth={1.7} className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Color grid ───────────────────────────────────────────────────────────────

function ColorGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-5 gap-4">
        {CATEGORY_COLORS.map((color) => {
          const isSelected = selected.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={isSelected}
              onClick={() => onSelect(color)}
              className="group relative flex aspect-square items-center justify-center"
            >
              <span
                className={[
                  "block h-12 w-12 rounded-full transition-transform group-hover:scale-110",
                  isSelected ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[var(--surface)]" : "",
                ].join(" ")}
                style={{ backgroundColor: color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
