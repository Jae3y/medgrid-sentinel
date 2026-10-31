"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  title,
  subtitle,
  right,
}: {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className={clsx("card", className)}>
      {(title || right) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad" | "cyan";
  icon?: ReactNode;
}) {
  const toneCls = {
    default: "text-white",
    good: "text-energy-green",
    warn: "text-energy-amber",
    bad: "text-energy-red",
    cyan: "text-cyan",
  }[tone];
  return (
    <div className="card flex items-center gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-cyan">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="label truncate">{label}</div>
        <div className={clsx("num text-xl font-bold leading-tight", toneCls)}>{value}</div>
        {sub && <div className="truncate text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "good" | "warn" | "bad" | "cyan";
}) {
  const cls = {
    default: "bg-navy-800 text-slate-300 ring-surface-border",
    good: "bg-energy-green/10 text-energy-green ring-energy-green/30",
    warn: "bg-energy-amber/10 text-energy-amber ring-energy-amber/30",
    bad: "bg-energy-red/10 text-energy-red ring-energy-red/30",
    cyan: "bg-cyan/10 text-cyan ring-cyan/30",
  }[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
        cls
      )}
    >
      {children}
    </span>
  );
}

export function Row({
  k,
  v,
  mono,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-surface-border/50 py-1.5 last:border-0">
      <span className="text-xs text-slate-400">{k}</span>
      <span className={clsx("text-sm font-semibold text-white", mono && "font-mono")}>{v}</span>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border border-surface-border/60 bg-navy-950/60 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
      {children}
    </p>
  );
}
