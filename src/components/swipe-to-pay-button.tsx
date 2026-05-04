"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export function SwipeToPayButton({
  onConfirm,
  isLoading,
}: {
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const maxXRef = useRef(260);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [labelOpacity, setLabelOpacity] = useState(1);

  const THUMB_SIZE = 52;
  const THRESHOLD = 0.82;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLoading || confirmed) return;
    if (trackRef.current) {
      maxXRef.current = trackRef.current.offsetWidth - THUMB_SIZE - 8;
    }
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const rawX = e.clientX - rect.left - THUMB_SIZE / 2;
    const clamped = clamp(rawX, 0, maxXRef.current);
    setDragX(clamped);
    setLabelOpacity(Math.max(0, 1 - (clamped / maxXRef.current) * 2.5));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX / maxXRef.current >= THRESHOLD) {
      setConfirmed(true);
      setDragX(maxXRef.current);
      setLabelOpacity(0);
      onConfirm();
    } else {
      setDragX(0);
      setLabelOpacity(1);
    }
  };

  return (
    <div
      ref={trackRef}
      className="relative flex h-14 w-full select-none items-center overflow-hidden rounded-2xl bg-[var(--accent)] px-1"
      style={{ touchAction: "none" }}
    >
      {/* Track fill */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-2xl bg-white/10"
        style={{ width: dragX + THUMB_SIZE + 4, transition: isDragging ? "none" : "width 0.25s ease" }}
      />

      {/* Label */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.92rem] font-semibold text-white"
        style={{ opacity: labelOpacity, transition: "opacity 0.1s" }}
      >
        {isLoading || confirmed ? "Procesando…" : "Desliza para pagar"}
      </span>

      {/* Thumb */}
      <div
        className="relative z-10 grid h-[52px] w-[52px] cursor-grab shrink-0 place-items-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ArrowRight size={22} strokeWidth={2.5} className="text-[var(--accent)]" />
      </div>
    </div>
  );
}
