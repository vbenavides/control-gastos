"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Download,
  FileUp,
  FolderKanban,
  LineChart,
  ListOrdered,
  RefreshCcw,
} from "lucide-react";
import { menuSections } from "@/lib/mock-data";
import { IconBadge, SurfaceCard } from "@/components/ui-kit";

const generalIcons = [ListOrdered, RefreshCcw, FolderKanban, LineChart];
const toolIcons = [FileUp, Download];

export function MenuScreen() {
  const [showDecimals, setShowDecimals] = useState(true);

  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-[36rem] px-4 pb-10 sm:max-w-[680px] sm:px-5 md:max-w-[920px] md:px-6 lg:max-w-[1120px] lg:px-8">
        <header className="sticky top-0 z-10 mb-8 flex items-center bg-[var(--app-bg)] pt-4 lg:pt-6">
          <Link href="/" aria-label="Volver" className="grid h-11 w-11 place-items-center rounded-2xl text-white">
            <ArrowLeft size={24} />
          </Link>
        </header>

        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <div className="grid h-22 w-22 place-items-center rounded-[1.7rem] bg-gradient-to-br from-[#35c7ff] to-[#0b79ae] text-white shadow-[0_18px_40px_rgba(41,187,243,0.28)]">
            <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-white/90">
              <DollarSign size={30} />
            </div>
          </div>
          <p className="mt-6 text-[1.1rem] text-[var(--text-secondary)]">✉ hello@nekomoney.app</p>
        </div>

        <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div>
            <MenuBlock
              title="GENERAL"
              items={menuSections.general}
              icons={generalIcons}
              hrefs={["/gestion/categorias", null, null, null]}
            />
            <MenuBlock
              title="HERRAMIENTAS DE DATOS"
              items={menuSections.tools}
              icons={toolIcons}
            />
          </div>

          <section className="mt-8 md:mt-0 md:pt-[3.25rem]">
            <p className="mb-4 text-sm font-semibold tracking-[0.12em] text-[var(--text-primary)]">PREFERENCIAS</p>
            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-[var(--line)] px-4 py-4">
                <p className="text-[1.1rem] font-medium">Divisa</p>
                <p className="mt-2 text-base text-[var(--text-secondary)]">🇨🇱 Chilean Peso</p>
              </div>

              <div className="flex items-center justify-between px-4 py-5">
                <div>
                  <p className="text-[1.1rem] font-medium">Usar decimales</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">$12.346</p>
                </div>

                <button
                  type="button"
                  aria-pressed={showDecimals}
                  onClick={() => setShowDecimals((value) => !value)}
                  className={`relative h-10 w-18 rounded-full p-1 transition ${
                    showDecimals ? "bg-[var(--accent)]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`block h-8 w-8 rounded-full bg-white transition ${
                      showDecimals ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </SurfaceCard>
          </section>
        </div>
      </div>
    </div>
  );
}

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/[0.03]";

function MenuBlock({
  title,
  items,
  icons,
  hrefs = [],
}: {
  title: string;
  items: string[];
  icons: Array<typeof ListOrdered>;
  hrefs?: (string | null)[];
}) {
  return (
    <section className="mt-8">
      <p className="mb-4 text-sm font-semibold tracking-[0.12em] text-[var(--text-primary)]">{title}</p>
      <SurfaceCard className="overflow-hidden px-0 py-0">
        {items.map((item, index) => {
          const Icon = icons[index];
          const href = hrefs[index] ?? null;
          const borderClass = index > 0 ? "border-t border-[var(--line)]" : "";
          const inner = Icon ? (
            <>
              <IconBadge className="h-12 w-12 rounded-2xl">
                <Icon size={22} />
              </IconBadge>
              <span className="flex-1 text-[1.1rem] font-medium">{item}</span>
              <ChevronRight size={20} className="text-[var(--text-secondary)]" />
            </>
          ) : null;

          if (href) {
            return (
              <Link
                key={item}
                href={href}
                prefetch={true}
                className={`${MENU_ITEM_CLASS} ${borderClass}`}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item}
              type="button"
              className={`${MENU_ITEM_CLASS} ${borderClass}`}
            >
              {inner}
            </button>
          );
        })}
      </SurfaceCard>
    </section>
  );
}
