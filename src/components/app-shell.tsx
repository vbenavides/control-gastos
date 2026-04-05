"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowUpDown,
  BadgeDollarSign,
  BadgePercent,
  CalendarDays,
  Cloud,
  CreditCard,
  DollarSign,
  FileText,
  FolderOpen,
  History,
  ListChecks,
  Menu,
  Pencil,
  PieChart,
  Plus,
  ReceiptText,
  RotateCcw,
  Scale,
  Search,
  Wallet,
  House,
} from "lucide-react";

import { accountQuickActionItems, quickActionItems } from "@/lib/mock-data";

type Action = {
  label: string;
  icon: ReactNode;
  href?: string;
};

type SheetStage = "peek" | "full";

const FAB_SHEET_ANIMATION_MS = 280;
const SWIPE_UP_THRESHOLD = -44;
const SWIPE_DOWN_THRESHOLD = 68;

const FAB_SHEET_HEIGHT = "90svh";
const FAB_SHEET_PEEK_OFFSET = "30svh";

const navigationItems = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/categorias", label: "Categorías", icon: PieChart },
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/historial", label: "Historial", icon: History },
] as const;

function actionMap(pathname: string): Action[] {
  if (pathname.startsWith("/calendario")) {
    return [
      { label: "Balance", icon: <Scale size={20} strokeWidth={2} /> },
      { label: "Menú", icon: <Menu size={22} strokeWidth={2} />, href: "/menu" },
    ];
  }

  if (pathname.startsWith("/categorias")) {
    return [
      { label: "Ordenar", icon: <ArrowUpDown size={20} strokeWidth={2} /> },
      { label: "Carpetas", icon: <FolderOpen size={20} strokeWidth={2} /> },
      { label: "Editar", icon: <Pencil size={20} strokeWidth={2} /> },
      { label: "Menú", icon: <Menu size={22} strokeWidth={2} />, href: "/menu" },
    ];
  }

  if (pathname.startsWith("/historial")) {
    return [
      { label: "Buscar", icon: <Search size={20} strokeWidth={2} /> },
      { label: "Menú", icon: <Menu size={22} strokeWidth={2} />, href: "/menu" },
    ];
  }

  return [
    { label: "Sincronizar", icon: <Cloud size={20} strokeWidth={2} /> },
    { label: "Menú", icon: <Menu size={22} strokeWidth={2} />, href: "/menu" },
  ];
}

function renderQuickActionIcon(kind: (typeof quickActionItems)[number]["kind"]) {
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
    case "installments":
      return <ListChecks size={23} strokeWidth={2} />;
    case "cardPayment":
      return <CreditCard size={23} strokeWidth={2} />;
    case "cashback":
      return <BadgePercent size={23} strokeWidth={2} />;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const closeTimeoutRef = useRef<number | null>(null);
  const gestureStartYRef = useRef<number | null>(null);
  const gestureDeltaYRef = useRef(0);

  const [isFabMounted, setIsFabMounted] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(false);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [sheetStage, setSheetStage] = useState<SheetStage>("peek");
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const actions = useMemo(() => actionMap(pathname), [pathname]);
  const visibleQuickActions = useMemo(
    () => (pathname.startsWith("/cuentas") ? accountQuickActionItems : quickActionItems),
    [pathname],
  );

  const resetGesture = useCallback(() => {
    gestureStartYRef.current = null;
    gestureDeltaYRef.current = 0;
    setIsDraggingSheet(false);
    setSheetDragOffset(0);
  }, []);

  const closeFabSheet = useCallback(() => {
    if (!isFabMounted) {
      return;
    }

    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setIsFabVisible(false);

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsFabMounted(false);
      setSheetStage("peek");
    }, FAB_SHEET_ANIMATION_MS);
  }, [isFabMounted]);

  const expandFabSheet = useCallback(() => {
    setSheetStage("full");
  }, []);

  const collapseFabSheet = useCallback(() => {
    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setSheetStage("peek");
  }, []);

  const openFabSheet = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setIsDraggingSheet(false);
    setSheetDragOffset(0);
    setSheetStage("peek");
    setIsFabMounted(true);

    window.requestAnimationFrame(() => {
      setIsFabVisible(true);
    });
  }, []);

  const handleSheetWheel = useCallback(
    (event: ReactWheelEvent<HTMLElement>) => {
      if (Math.abs(event.deltaY) < 18) {
        return;
      }

      if (sheetStage === "peek") {
        event.preventDefault();

        if (event.deltaY > 0) {
          expandFabSheet();
          return;
        }

        closeFabSheet();
        return;
      }

      if (event.deltaY < 0) {
        event.preventDefault();
        collapseFabSheet();
      }
    },
    [closeFabSheet, collapseFabSheet, expandFabSheet, sheetStage],
  );

  const handleSheetPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    gestureStartYRef.current = event.clientY;
    gestureDeltaYRef.current = 0;
    setIsDraggingSheet(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleSheetPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
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
  }, [sheetStage]);

  const handleSheetPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const deltaY = gestureDeltaYRef.current;
      resetGesture();

      if (sheetStage === "peek" && deltaY <= SWIPE_UP_THRESHOLD) {
        expandFabSheet();
        return;
      }

      if (deltaY >= SWIPE_DOWN_THRESHOLD) {
        if (sheetStage === "full") {
          collapseFabSheet();
          return;
        }

        closeFabSheet();
      }
    },
    [closeFabSheet, collapseFabSheet, expandFabSheet, resetGesture, sheetStage],
  );

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const sheetBaseOffset = sheetStage === "peek" ? FAB_SHEET_PEEK_OFFSET : "0px";
  const sheetTranslateY = !isFabVisible
    ? "calc(100% + 2rem)"
    : isDraggingSheet
      ? `calc(${sheetBaseOffset} + ${sheetDragOffset}px)`
      : sheetBaseOffset;

  useEffect(() => {
    if (!isFabMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFabMounted]);

  useEffect(() => {
    if (!isFabMounted) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFabSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeFabSheet, isFabMounted]);

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)] xl:flex">
      <aside className="hidden min-h-dvh w-[240px] shrink-0 flex-col border-r border-[var(--line)] bg-[rgba(7,16,25,0.88)] px-3 py-7 xl:flex">
        <div className="mb-9 flex flex-col items-center">
          <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-[#35c7ff] to-[#0b79ae] text-white shadow-[0_18px_40px_rgba(41,187,243,0.24)]">
            <div className="grid h-13 w-13 place-items-center rounded-full border-[3px] border-white/90">
              <DollarSign size={30} strokeWidth={2.5} />
            </div>
          </div>
          <span className="mt-3 rounded-xl bg-[#ffbf45] px-3 py-1 text-sm font-semibold tracking-[0.04em] text-[#1e242b]">
            PREMIUM
          </span>
        </div>

        <nav aria-label="Navegación principal desktop">
          <ul className="space-y-2">
            {navigationItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-[1.05rem] font-medium transition ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(41,187,243,0.2)]"
                        : "text-[var(--text-secondary)] hover:bg-white/4 hover:text-white"
                    }`}
                  >
                    <Icon size={24} strokeWidth={2.1} />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-0 pt-4 md:max-w-[920px] md:px-6 lg:max-w-[1180px] lg:px-8 xl:mx-0 xl:max-w-none xl:flex-1 xl:px-6 xl:pb-6 xl:pt-4">
        <header className="mb-4 flex items-center justify-between xl:justify-end">
          <div className="h-10 w-10 xl:hidden" aria-hidden="true" />
          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const content = (
                <span className="grid h-10 w-10 place-items-center rounded-2xl text-[var(--text-primary)] transition hover:bg-white/5 md:h-11 md:w-11">
                  {action.icon}
                </span>
              );

              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} aria-label={action.label}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={action.label} type="button" aria-label={action.label}>
                  {content}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 pb-6 xl:overflow-y-auto xl:pb-0">
          <div className="w-full xl:px-2">{children}</div>
        </main>

        <nav className="sticky bottom-0 z-20 -mx-4 mt-3 border-t border-white/8 bg-[var(--app-bg)] px-5 pb-3 pt-1.5 xl:hidden">
          <ul className="grid grid-cols-5 items-center gap-2">
            {navigationItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    className="flex h-11 items-center justify-center rounded-2xl py-1 text-xs text-[var(--text-secondary)] transition"
                  >
                    <Icon
                      size={22}
                      strokeWidth={2.1}
                      className={isActive ? "text-[var(--accent)]" : "text-white/68"}
                      fill={href === "/categorias" && isActive ? "currentColor" : "none"}
                    />
                    <span className="sr-only">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="fixed bottom-20 right-4 z-30 md:right-6 lg:right-8 xl:bottom-5 xl:right-6">
        <button
          type="button"
          aria-label="Agregar nueva acción"
          aria-expanded={isFabMounted}
          aria-controls="quick-actions-sheet"
          onClick={openFabSheet}
          className="accent-ring grid h-[3.75rem] w-[3.75rem] place-items-center rounded-[1.15rem] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(41,187,243,0.3)] transition hover:scale-[1.02]"
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      </div>

      {isFabMounted ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar acciones"
            className={`absolute inset-0 transition-opacity duration-300 ${
              isFabVisible ? "bg-black/58 backdrop-blur-sm" : "bg-black/0"
            }`}
            onClick={closeFabSheet}
          />
          <div
            id="quick-actions-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-actions-title"
            onWheel={handleSheetWheel}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
            onPointerCancel={handleSheetPointerEnd}
            className="absolute inset-x-0 bottom-0 flex w-auto origin-bottom flex-col overflow-hidden rounded-t-[2rem] border border-white/8 bg-[var(--surface)] shadow-[0_-16px_40px_rgba(0,0,0,0.46)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform md:inset-x-6 md:rounded-t-[2.2rem] lg:inset-x-8 xl:inset-x-auto xl:bottom-5 xl:right-6 xl:w-[32rem] xl:rounded-[2rem]"
            style={{
              height: FAB_SHEET_HEIGHT,
              opacity: isFabVisible ? 1 : 0.96,
              transform: `translate3d(0, ${sheetTranslateY}, 0)`,
              touchAction: "none",
              userSelect: isDraggingSheet ? "none" : undefined,
            }}
          >
            <div className="border-b border-white/7 px-4 pb-4 pt-3 md:px-5">
              <div className="mx-auto mb-4 h-[0.32rem] w-14 rounded-full bg-white/92" />
              <h3
                id="quick-actions-title"
                className="type-section-title font-medium text-[var(--text-primary)]"
              >
                Agregar transacción
              </h3>
            </div>

            <ul className="flex-1 overflow-hidden pb-6">
              {visibleQuickActions.map((item) => (
                <li key={item.id} className="border-b border-white/7 last:border-b-0">
                  <div className="flex w-full items-center gap-3 px-4 py-3.5 md:px-5 md:py-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center self-center rounded-[0.95rem] bg-white/[0.055] text-white/92 md:h-12 md:w-12">
                      {renderQuickActionIcon(item.kind)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="type-body font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[0.81rem] leading-[1.28rem] text-white/78 md:text-[0.84rem] md:leading-[1.34rem]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
