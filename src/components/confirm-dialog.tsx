"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  cancelLabel = "NO",
  confirmLabel,
  confirmClassName,
  onCancel,
  onConfirm,
}: Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel: string;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}>) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[26rem] rounded-[1.8rem] bg-[#121d27] px-6 py-7 shadow-[0_18px_42px_rgba(0,0,0,0.38)]"
      >
        <h2 className="type-subsection-title font-medium text-[var(--text-primary)]">{title}</h2>
        <p className="type-label mt-6 text-[var(--text-primary)]">{description}</p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="type-body min-w-[4rem] rounded-full bg-[#0f2a39] px-5 py-2 font-medium text-[var(--accent)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`type-body min-w-[4rem] rounded-full bg-[#0f2a39] px-5 py-2 font-medium ${confirmClassName ?? "text-[var(--accent)]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
