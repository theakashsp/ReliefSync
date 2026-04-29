import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { SosButton } from "@/components/SosButton";
import { DisasterMap, type MapMarker } from "@/components/DisasterMap";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { LeaderBoard } from "@/components/LeaderBoard";
import { SkeletonStat } from "@/components/SkeletonLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Urgency } from "@/lib/ai-scoring";
import { useCountUp } from "@/lib/use-count-up";
import {
  Activity, AlertTriangle, CheckCircle2, Users, Truck, FileWarning,
  Trophy, ShieldAlert, BarChart3, Lock,
} from "lucide-react";
import { formatDistanceToNow, subDays, format } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Console · ReliefLink AI" }] }),
});

interface Req {
  id: string;
  need_type: string;
  disaster_type: string;
  people_affected: number;
  description: string;
  latitude: number;
  longitude: number;
  urgency: Urgency;
  ai_score: number;
  status: string;
  created_at: string;
}

interface Mission {
  id: string;
  request_id: string;
  volunteer_name: string;
  status: string;
  created_at: string;
}

const URGENCY_CHART_COLORS: Record<string, string> = {
  critical: "oklch(0.62 0.27 18)",
  high: "oklch(0.7 0.22 25)",
  medium: "oklch(0.8 0.18 80)",
  low: "oklch(0.72 0.18 155)",
};

const NEED_COLORS = [
  "oklch(0.7 0.22 25)",
  "oklch(0.75 0.15 200)",
  "oklch(0.72 0.18 155)",
  "oklch(0.8 0.18 80)",
  "oklch(0.65 0.2 300)",
  "oklch(0.68 0.2 240)",
];

function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-mesh">
      <div className="glass-strong rounded-3xl p-10 max-w-sm text-center">
        <div className="h-16 w-16 rounded-2xl gradient-emergency flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-display font-bold">Admin Access Required</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          This command center is restricted to Admin and NGO coordinators.
        </p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="inline-flex h-11 items-center justify-center rounded-xl gradient-hero px-6 text-sm font-semibold text-white border-0"
        >
          Sign in as Admin
        </button>
      </div>
    </div>
  );
}

function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const load = async () => {
    const [{ data: r }, { data: m }, { data: v }] = await Promise.all([
      supabase.from("emergency_requests").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("missions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id").eq("role", "volunteer"),
    ]);
    setReqs((r || []) as Req[]);
    setMissions((m || []) as Mission[]);
    setVolunteerCount((v || []).length);
    setDataLoading(false);
  };

  useEffect(() => {
    if (!user || (role !== "admin" && !authLoading)) return;
    load();
    const ch = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, role, authLoading]); // eslint-disable-line

  const stats = useMemo(() => ({
    total: reqs.length,
    pending: reqs.filter((r) => r.status === "open").length,
    inProgress: reqs.filter((r) => r.status === "in_progress" || r.status === "assigned").length,
    completed: reqs.filter((r) => r.status === "completed").length,
    critical: reqs.filter((r) => r.urgency === "critical").length,
    activeMissions: missions.filter((m) => m.status === "accepted" || m.status === "on_the_way").length,
  }), [reqs, missions]);

  // Chart: daily request volume (last 7 days)
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const label = format(d, "MMM d");
      const dayStr = format(d, "yyyy-MM-dd");
      const count = reqs.filter((r) => r.created_at.startsWith(dayStr)).length;
      const critical = reqs.filter((r) => r.created_at.startsWith(dayStr) && r.urgency === "critical").length;
      return { label, count, critical };
    });
    return days;
  }, [reqs]);

  // Chart: urgency breakdown
  const urgencyData = useMemo(() => {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    reqs.forEach((r) => { breakdown[r.urgency as keyof typeof breakdown]++; });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [reqs]);

  // Chart: need-type breakdown
  const needData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    reqs.forEach((r) => { breakdown[r.need_type] = (breakdown[r.need_type] || 0) + 1; });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [reqs]);

  const markers: MapMarker[] = reqs.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    urgency: r.urgency,
    title: `${r.need_type} · ${r.people_affected}`,
    subtitle: r.urgency,
  }));

  const feed = useMemo(() => {
    const items = [
      ...reqs.slice(0, 20).map((r) => ({
        id: "r-" + r.id,
        text: `New ${r.urgency} request: ${r.need_type} (${r.people_affected} people)`,
        color: r.urgency === "critical" ? "oklch(0.62 0.27 18)" : r.urgency === "high" ? "oklch(0.7 0.22 25)" : undefined,
      })),
      ...missions.slice(0, 10).map((m) => ({
        id: "m-" + m.id,
        text: `${m.volunteer_name} → ${m.status.replace("_", " ")}`,
        color: m.status === "completed" ? "oklch(0.72 0.18 155)" : undefined,
      })),
    ];
    return items;
  }, [reqs, missions]);

  const feedItems = useMemo(() => {
    return [
      ...reqs.slice(0, 20).map((r) => ({
        id: "r-" + r.id,
        kind: "request" as const,
        time: r.created_at,
        text: `New ${r.urgency} request: ${r.need_type} (${r.people_affected})`,
        urgency: r.urgency,
      })),
      ...missions.slice(0, 20).map((m) => ({
        id: "m-" + m.id,
        kind: "mission" as const,
        time: m.created_at,
        text: `${m.volunteer_name} → ${m.status.replace("_", " ")}`,
        urgency: "low" as Urgency,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 25);
  }, [reqs, missions]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full gradient-hero animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <AccessDenied />
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Total requests", value: stats.total, icon: FileWarning, color: "text-foreground" },
    { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "text-warning" },
    { label: "In progress", value: stats.inProgress, icon: Activity, color: "text-accent" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
    { label: "Volunteers", value: volunteerCount, icon: Users, color: "text-primary" },
    { label: "Active missions", value: stats.activeMissions, icon: Truck, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent uppercase">Command Center</span>
            <h1 className="text-3xl font-display font-bold mt-1">Operations Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Live view across all requests, volunteers and missions.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success pulse-ring" />
            <span className="text-xs text-muted-foreground">Live data · auto-updating</span>
          </div>
        </div>

        {/* Stat Cards */}
        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[...Array(6)].map((_, i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {STAT_CARDS.map((s, i) => {
              const Icon = s.icon;
              const AnimatedValue = () => {
                const v = useCountUp(s.value);
                return <span>{v}</span>;
              };
              return (
                <div key={s.label} className="glass-strong rounded-2xl p-4 animate-float-up card-3d" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className={`font-display text-3xl font-bold mt-2 ${s.color}`}>
                    <AnimatedValue />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Map + Feed */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 h-[500px] mb-6">
          <div className="glass-strong rounded-2xl p-3 relative tilt-soft">
            <div className="absolute top-6 left-6 z-[400] glass-strong rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Live Heatmap</div>
              <div className="text-sm font-bold">{stats.critical} critical · {stats.pending} pending</div>
            </div>
            <DisasterMap markers={markers} height="100%" />
          </div>

          <div className="glass-strong rounded-2xl p-4 overflow-y-auto tilt-soft">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary pulse-ring" /> Activity feed
            </h3>
            <div className="space-y-2">
              {feedItems.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {feedItems.map((f) => (
                <div key={f.id} className="glass rounded-lg p-3 text-xs animate-float-up card-3d">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`uppercase tracking-widest text-[10px] font-bold ${f.kind === "request" ? "text-primary" : "text-accent"}`}>
                      {f.kind}
                    </span>
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(f.time), { addSuffix: true })}</span>
                  </div>
                  <div>{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Daily Volume */}
          <div className="lg:col-span-2 glass-strong rounded-2xl p-5 tilt-soft">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold">Request volume (7 days)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.22 25)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.7 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-critical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.27 18)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.62 0.27 18)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "oklch(0.7 0.02 250)" }} />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.02 250)" }} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.025 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.98 0.005 250)" }}
                />
                <Area type="monotone" dataKey="count" stroke="oklch(0.7 0.22 25)" fill="url(#grad-total)" strokeWidth={2} name="Total" />
                <Area type="monotone" dataKey="critical" stroke="oklch(0.62 0.27 18)" fill="url(#grad-critical)" strokeWidth={2} name="Critical" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Urgency breakdown */}
          <div className="glass-strong rounded-2xl p-5 tilt-soft">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <h3 className="font-display font-semibold">Urgency split</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={urgencyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                  {urgencyData.map((entry) => (
                    <Cell key={entry.name} fill={URGENCY_CHART_COLORS[entry.name] || "oklch(0.5 0.1 250)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.025 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 11, color: "oklch(0.7 0.02 250)" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Need-type bar + Leaderboard */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 mb-6">
          <div className="glass-strong rounded-2xl p-5 tilt-soft">
            <h3 className="font-display font-semibold mb-4">Need types requested</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={needData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.7 0.02 250)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.7 0.02 250)" }} width={65} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.22 0.025 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {needData.map((_, i) => (
                    <Cell key={i} fill={NEED_COLORS[i % NEED_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-strong rounded-2xl p-5 tilt-soft">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" /> Top Volunteers
            </h3>
            <LeaderBoard limit={6} />
          </div>
        </div>

        {/* Recent Requests Table */}
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-bold">Recent requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/30">
                <tr>
                  <th className="text-left p-3">Urgency</th>
                  <th className="text-left p-3">Need</th>
                  <th className="text-left p-3">People</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">When</th>
                  <th className="text-left p-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {reqs.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3"><UrgencyBadge urgency={r.urgency} score={r.ai_score} /></td>
                    <td className="p-3 capitalize">{r.need_type}</td>
                    <td className="p-3">{r.people_affected}</td>
                    <td className="p-3 capitalize text-xs">{r.status.replace("_", " ")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SosButton />
    </div>
  );
}
