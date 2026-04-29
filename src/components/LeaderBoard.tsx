import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Star } from "lucide-react";

interface LeaderEntry {
  volunteer_id: string;
  volunteer_name: string;
  completed: number;
}

const RANK_ICONS = [
  <Trophy className="h-4 w-4 text-yellow-400" />,
  <Medal className="h-4 w-4 text-slate-300" />,
  <Medal className="h-4 w-4 text-amber-600" />,
];

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export function LeaderBoard({ limit = 5 }: { limit?: number }) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("missions")
        .select("volunteer_id, volunteer_name")
        .eq("status", "completed");

      if (!data) { setLoading(false); return; }

      // Aggregate client-side
      const counts = new Map<string, { name: string; count: number }>();
      for (const m of data) {
        const existing = counts.get(m.volunteer_id);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(m.volunteer_id, { name: m.volunteer_name, count: 1 });
        }
      }

      const sorted = Array.from(counts.entries())
        .map(([id, v]) => ({ volunteer_id: id, volunteer_name: v.name, completed: v.count }))
        .sort((a, b) => b.completed - a.completed)
        .slice(0, limit);

      setEntries(sorted);
      setLoading(false);
    }

    load();
    // Refresh every 30s
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-3 animate-pulse h-12" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass rounded-xl p-4 text-center text-sm text-muted-foreground">
        No completed missions yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div
          key={e.volunteer_id}
          className="glass rounded-xl px-4 py-3 flex items-center gap-3 animate-float-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-xl leading-none w-6 text-center flex-shrink-0">
            {i < 3 ? RANK_BADGES[i] : <Star className="h-4 w-4 text-muted-foreground" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{e.volunteer_name}</div>
            <div className="text-xs text-muted-foreground">{e.completed} mission{e.completed !== 1 ? "s" : ""} completed</div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            {i < 3 ? RANK_ICONS[i] : null}
          </div>
        </div>
      ))}
    </div>
  );
}
