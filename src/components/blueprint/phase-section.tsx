"use client";

import { cn } from "@/lib/utils";

interface PhaseSectionProps {
  id: string;
  phase: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accentColor?: "teal" | "orange" | "amber" | "rose" | "sky" | "emerald";
}

const accentMap = {
  teal: {
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    line: "bg-teal-500",
    dot: "bg-teal-500",
    glow: "shadow-teal-500/20",
  },
  orange: {
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    line: "bg-orange-500",
    dot: "bg-orange-500",
    glow: "shadow-orange-500/20",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    line: "bg-amber-500",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/20",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    line: "bg-rose-500",
    dot: "bg-rose-500",
    glow: "shadow-rose-500/20",
  },
  sky: {
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    line: "bg-sky-500",
    dot: "bg-sky-500",
    glow: "shadow-sky-500/20",
  },
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    line: "bg-emerald-500",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/20",
  },
};

export function PhaseSection({
  id,
  phase,
  title,
  subtitle,
  icon,
  children,
  className,
  accentColor = "teal",
}: PhaseSectionProps) {
  const colors = accentMap[accentColor];

  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="relative">
        {/* Phase header */}
        <div className="flex items-start gap-4 mb-8">
          <div className={cn("flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", colors.icon, colors.glow)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", colors.badge)}>
                Phase {phase}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-1.5 text-muted-foreground text-base max-w-2xl">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="pl-0 md:pl-16 border-l-0 md:border-l-2 md:border-dashed border-border ml-0 md:ml-6 space-y-6">
          {children}
        </div>
      </div>
    </section>
  );
}

interface InsightCardProps {
  type?: "warning" | "info" | "tip" | "critical";
  title: string;
  children: React.ReactNode;
  className?: string;
}

const insightStyles = {
  warning: {
    container: "border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5",
    title: "text-amber-800 dark:text-amber-300",
  },
  info: {
    container: "border-sky-500/30 bg-sky-50/80 dark:bg-sky-500/5",
    title: "text-sky-800 dark:text-sky-300",
  },
  tip: {
    container: "border-teal-500/30 bg-teal-50/80 dark:bg-teal-500/5",
    title: "text-teal-800 dark:text-teal-300",
  },
  critical: {
    container: "border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/5",
    title: "text-rose-800 dark:text-rose-300",
  },
};

export function InsightCard({ type = "info", title, children, className }: InsightCardProps) {
  const styles = insightStyles[type];
  return (
    <div className={cn("rounded-xl border p-4", styles.container, className)}>
      <p className={cn("text-sm font-semibold mb-1.5", styles.title)}>{title}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}