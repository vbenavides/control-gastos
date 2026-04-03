"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  Cloud,
  DollarSign,
  Filter,
  FolderOpen,
  History,
  Menu,
  Pencil,
  PieChart,
  Plus,
  Scale,
  Search,
  Wallet,
  House,
  X,
} from "lucide-react";

type Action = {
  label: string;
  icon: ReactNode;
  href?: string;
};

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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const actions = useMemo(() => actionMap(pathname), [pathname]);

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
          onClick={() => setIsFabOpen(true)}
          className="accent-ring grid h-[3.75rem] w-[3.75rem] place-items-center rounded-[1.15rem] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(41,187,243,0.3)] transition hover:scale-[1.02]"
        >
          <Plus size={26} strokeWidth={2.2} />
        </button>
      </div>

      {isFabOpen ? (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Cerrar acciones"
            className="absolute inset-0"
            onClick={() => setIsFabOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] rounded-t-[2rem] border border-white/10 bg-[var(--surface)] px-5 pb-10 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] md:max-w-[920px] md:rounded-t-[2.2rem] lg:max-w-[1180px] xl:inset-x-auto xl:bottom-5 xl:right-6 xl:mx-0 xl:max-w-[560px] xl:rounded-[2rem]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Acción global
                </p>
                <h3 className="mt-1 text-2xl font-semibold">Nueva acción</h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar panel"
                onClick={() => setIsFabOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--surface-dark)] text-[var(--text-primary)]"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--app-bg-elevated)] p-5">
              <div className="mb-3 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
                Pendiente de definición
              </div>
              <p className="text-base leading-7 text-[var(--text-secondary)]">
                Dejé el comportamiento visual del botón <strong>+</strong> con apertura desde abajo,
                pero las opciones internas todavía no están detalladas en <code>idea.md</code>.
                Cuando me pases esas acciones, se conectan acá sin romper la navegación.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--surface-dark)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <Filter size={18} className="text-[var(--accent)]" />
              Sin inventar features: se replica la animación base y se reserva el contenido real.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
