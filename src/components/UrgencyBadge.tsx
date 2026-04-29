import { Sparkles } from "lucide-react";
import type { Urgency } from "@/lib/ai-scoring";
import { cn } from "@/lib/utils";

const STYLES: Record<Urgency, string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-primary/15 text-primary border-primary/40",
  medium: "bg-warning/15 text-warning border-warning/40",
  low: "bg-success/15 text-success border-success/40",
};

export function UrgencyBadge({ urgency, score, showAi = true }: { urgency: Urgency; score?: number; showAi?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold tracking-wider uppercase", STYLES[urgency])}>
      {showAi && <Sparkles className="h-3 w-3" />}
      {urgency}
      {score !== undefined && <span className="opacity-60 font-mono">{score}</span>}
    </span>
  );
}
