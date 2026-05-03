import type { ReactNode } from "react";

export function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`app-panel rounded-2xl ${className}`}>{children}</div>;
}

export function SectionHeader({
  title,
  action,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="type-section-title font-medium text-[var(--text-primary)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function SubsectionHeader({
  title,
  action,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h3 className="type-subsection-title font-semibold text-[var(--text-primary)]">{title}</h3>
      {action}
    </div>
  );
}

export function IconBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SmallIconButton({
  children,
  onClick,
  active = false,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--line-strong)] bg-[var(--app-bg-elevated)] text-[var(--text-primary)] hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

export function Segmented({
  items,
  activeIndex = 0,
  onChange,
  className = "",
}: {
  items: readonly string[] | string[];
  activeIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={`flex rounded-2xl bg-[var(--surface-dark)] p-1 ${className}`}>
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange?.(index)}
          className={`flex-1 rounded-[0.9rem] px-3 py-2 text-center text-sm font-medium transition ${
            index === activeIndex
              ? "bg-[var(--surface)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "var(--accent)",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function CircularProgress({
  value,
  center,
  className = "",
  innerClassName = "",
}: {
  value: number;
  center: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={`relative grid h-20 w-20 place-items-center rounded-full ${className}`}
      style={{
        background: `conic-gradient(var(--accent) ${value}%, rgba(255,255,255,0.1) ${value}% 100%)`,
      }}
    >
      <div
        className={`grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] ${innerClassName}`}
      >
        {center}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-14 text-center ${className}`}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="type-body font-medium text-[var(--text-primary)]">{title}</p>
        {description ? (
          <p className="type-label text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
