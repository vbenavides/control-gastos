"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  BadgePercent,
  FileText,
  Plus,
  ReceiptText,
  RotateCcw,
} from "lucide-react";

import { accountQuickActionItems } from "@/lib/mock-data";

type SheetStage = "peek" | "full";

const FAB_SHEET_ANIMATION_MS = 280;
const SWIPE_UP_THRESHOLD = -44;
const SWIPE_DOWN_THRESHOLD = 68;
const FAB_SHEET_HEIGHT = "90svh";
const FAB_SHEET_PEEK_OFFSET = "30svh";

function renderQuickActionIcon(kind: (typeof accountQuickActionItems)[number]["kind"]) {
  switch (kind) {
    case "expense":
      return <ReceiptText size={23} strokeWidth={2} />;
    case "payment":
      return <FileText size={23} strokeWidth={2} />;
    case "income":
      return <BadgeDollarSign size={23} strokeWidth={2} />;
    case "transfer":
      return <ArrowLeftRight size={23} strokeWidth={2} />;
    case "refund":
      return <RotateCcw size={23} strokeWidth={2} />;
    case "cashback":
      return <BadgePercent size={23} strokeWidth={2} />;
  }
}

export function AccountQuickActionsFab() {
  const closeTimeoutRef = useRef<number | null>(null);
  const gestureStartYRef = useRef<number | null>(null);
  const gestureDeltaYRef = useRef(0);

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [sheetStage, setSheetStage] = useState<SheetStage>("peek");
  const [sheetDragOffset, setSheetDragOffset] = useState(0);

  const quickActions = useMemo(() => accountQuickActionItems, []);

  const resetGesture = useCallback(() => {
    gestureStartYRef.current = null;
    gestureDeltaYRef.current = 0;
    setIsDraggingSheet(false);
    setSheetDragOffset(0);
  }, []);

  const closeSheet = useCallback(() => {
    if (!isMounted) {
      return;
    }

    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setIsVisible(false);

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setSheetStage("peek");
    }, FAB_SHEET_ANIMATION_MS);
  }, [isMounted]);

  const expandSheet = useCallback(() => {
    setSheetStage("full");
  }, []);

  const collapseSheet = useCallback(() => {
    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setSheetStage("peek");
  }, []);

  const openSheet = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setSheetStage("peek");
    setIsMounted(true);

    window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleSheetPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    gestureStartYRef.current = event.clientY;
    gestureDeltaYRef.current = 0;
    setIsDraggingSheet(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleSheetPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (gestureStartYRef.current === null) {
        return;
      }

      const deltaY = event.clientY - gestureStartYRef.current;
      gestureDeltaYRef.current = deltaY;

      if (sheetStage === "peek") {
        setSheetDragOffset(Math.max(-360, Math.min(260, deltaY)));
        return;
      }

      if (deltaY > 0) {
        setSheetDragOffset(Math.min(320, deltaY));
        return;
      }

      setSheetDragOffset(Math.max(-56, deltaY * 0.18));
    },
    [sheetStage],
  );

  const handleSheetPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const deltaY = gestureDeltaYRef.current;
      resetGesture();

      if (sheetStage === "peek" && deltaY <= SWIPE_UP_THRESHOLD) {
        expandSheet();
        return;
      }

      if (deltaY >= SWIPE_DOWN_THRESHOLD) {
        if (sheetStage === "full") {
          collapseSheet();
          return;
        }

        closeSheet();
      }
    },
    [closeSheet, collapseSheet, expandSheet, resetGesture, sheetStage],
  );

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSheet, isMounted]);

  const sheetBaseOffset = sheetStage === "peek" ? FAB_SHEET_PEEK_OFFSET : "0px";
  const sheetTranslateY = !isVisible
    ? "calc(100% + 2rem)"
    : isDraggingSheet
      ? `calc(${sheetBaseOffset} + ${sheetDragOffset}px)`
      : sheetBaseOffset;

  return (
    <>
      <div className="fixed bottom-6 right-4 z-30 md:right-6 lg:right-8">
        <button
          type="button"
          aria-label="Agregar nueva acción"
          aria-expanded={isMounted}
          aria-controls="account-quick-actions-sheet"
          onClick={openSheet}
          className="accent-ring grid h-[3.75rem] w-[3.75rem] place-items-center rounded-[1.15rem] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(41,187,243,0.3)] transition hover:scale-[1.02]"
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      </div>

      {isMounted ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar acciones"
            className={`absolute inset-0 transition-opacity duration-300 ${
              isVisible ? "bg-black/58 backdrop-blur-sm" : "bg-black/0"
            }`}
            onClick={closeSheet}
          />
          <div
            id="account-quick-actions-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-quick-actions-title"
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
            onPointerCancel={handleSheetPointerEnd}
            className="absolute inset-x-0 bottom-0 flex w-auto origin-bottom flex-col overflow-hidden rounded-t-[2rem] border border-white/8 bg-[var(--surface)] shadow-[0_-16px_40px_rgba(0,0,0,0.46)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform md:inset-x-6 md:rounded-t-[2.2rem] lg:inset-x-8"
            style={{
              height: FAB_SHEET_HEIGHT,
              opacity: isVisible ? 1 : 0.96,
              transform: `translate3d(0, ${sheetTranslateY}, 0)`,
              touchAction: "none",
              userSelect: isDraggingSheet ? "none" : undefined,
            }}
          >
            <div className="border-b border-white/7 px-4 pb-4 pt-3 md:px-5">
              <div className="mx-auto mb-4 h-[0.32rem] w-14 rounded-full bg-white/92" />
              <h3
                id="account-quick-actions-title"
                className="text-[1.62rem] font-medium tracking-[-0.055em] text-[var(--text-primary)] sm:text-[1.68rem] md:text-[1.76rem]"
              >
                Agregar transacción
              </h3>
            </div>

            <ul className="flex-1 overflow-hidden pb-6">
              {quickActions.map((item) => (
                <li key={item.id} className="border-b border-white/7 last:border-b-0">
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left md:px-5 md:py-4"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-[0.95rem] bg-white/[0.055] text-white/92 md:h-12 md:w-12">
                      {renderQuickActionIcon(item.kind)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[1rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] md:text-[1.03rem]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[0.81rem] leading-[1.28rem] text-white/78 md:text-[0.84rem] md:leading-[1.34rem]">
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
