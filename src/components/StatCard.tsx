import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  gradient?: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, color = "text-foreground", gradient, delay = 0 }: StatCardProps) {
  const display = useCountUp(value);

  return (
    <div
      className="glass-strong rounded-2xl p-4 animate-float-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          gradient || "bg-muted"
        )}>
          <Icon className={cn("h-4 w-4", gradient ? "text-white" : color)} />
        </div>
      </div>
      <div className={cn("font-display text-3xl font-bold tabular-nums", color)}>
        {display.toLocaleString()}
      </div>
    </div>
  );
}
