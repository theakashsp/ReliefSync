import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { SosButton } from "@/components/SosButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { LeaderBoard } from "@/components/LeaderBoard";
import { SkeletonList, SkeletonStat } from "@/components/SkeletonLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { Urgency } from "@/lib/ai-scoring";
import { distanceKm } from "@/lib/ai-scoring";
import { Users, MapPin, Clock, Phone, Truck, CheckCircle2, Navigation, AlertTriangle, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/volunteer")({
  component: VolunteerPage,
  head: () => ({ meta: [{ title: "Volunteer Dashboard · ReliefLink AI" }] }),
});

interface Req {
  id: string;
  reporter_name: string;
  reporter_phone: string;
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
  status: "accepted" | "on_the_way" | "completed" | "cancelled";
  eta_minutes: number | null;
  volunteer_id: string;
}

const BENGALURU: [number, number] = [12.9716, 77.5946];
const MAX_VOLUNTEERS_PER_REQUEST = 3;

function VolunteerPage() {
  const { user, profile, role } = useAuth();
  const [requests, setRequests] = useState<Req[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [allMissions, setAllMissions] = useState<Mission[]>([]);
  const [myLoc, setMyLoc] = useState<[number, number]>(BENGALURU);
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [hasVehicle, setHasVehicle] = useState(profile?.has_vehicle || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSkills(profile?.skills?.join(", ") || "");
    setHasVehicle(profile?.has_vehicle || false);
  }, [profile]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setMyLoc([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const load = async () => {
    const [{ data: reqs }, { data: allM }] = await Promise.all([
      supabase.from("emergency_requests").select("*").in("status", ["open", "assigned", "in_progress"]).order("ai_score", { ascending: false }),
      supabase.from("missions").select("*"),
    ]);
    setRequests((reqs || []) as Req[]);
    setAllMissions((allM || []) as Mission[]);
    if (user) setMissions(((allM || []) as Mission[]).filter((m) => m.volunteer_id === user.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("volunteer-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "missions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]); // eslint-disable-line

  const sortedNearby = useMemo(() => {
    const withDist = requests.map((r) => ({
      ...r,
      distance: distanceKm(myLoc[0], myLoc[1], r.latitude, r.longitude),
      assigned: allMissions.filter((m) => m.request_id === r.id && m.status !== "cancelled" && m.status !== "completed").length,
      mine: missions.find((m) => m.request_id === r.id),
    }));
    return withDist.sort((a, b) => {
      // mine first, then by ai_score desc with distance penalty
      if (a.mine && !b.mine) return -1;
      if (b.mine && !a.mine) return 1;
      return (b.ai_score - a.ai_score) - (a.distance - b.distance) * 2;
    });
  }, [requests, allMissions, missions, myLoc]);

  const accept = async (req: Req) => {
    if (!user) return toast.error("Sign in first");
    const assigned = allMissions.filter((m) => m.request_id === req.id && m.status !== "cancelled" && m.status !== "completed").length;
    if (assigned >= MAX_VOLUNTEERS_PER_REQUEST) {
      toast.warning("Enough volunteers already assigned to this request.");
      return;
    }
    const eta = Math.max(5, Math.round(distanceKm(myLoc[0], myLoc[1], req.latitude, req.longitude) * 4));
    const { error } = await supabase.from("missions").insert({
      request_id: req.id,
      volunteer_id: user.id,
      volunteer_name: profile?.full_name || "Volunteer",
      status: "accepted",
      eta_minutes: eta,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Mission accepted · ETA ${eta}m`);
  };

  const updateStatus = async (missionId: string, status: Mission["status"]) => {
    const { error } = await supabase.from("missions").update({ status }).eq("id", missionId);
    if (error) toast.error(error.message);
    else toast.success(`Status: ${status.replace("_", " ")}`);
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      has_vehicle: hasVehicle,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto py-24 px-4 text-center glass-strong rounded-2xl mt-12">
          <Users className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold">Volunteer Sign-in Required</h1>
          <p className="text-muted-foreground mt-2 mb-6">Join the response network in seconds.</p>
          <Link to="/auth"><Button className="gradient-hero border-0">Sign in / Register</Button></Link>
        </div>
      </div>
    );
  }

  const activeMissions = missions.filter((m) => m.status === "accepted" || m.status === "on_the_way");
  const completedCount = missions.filter((m) => m.status === "completed").length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <span className="text-xs font-bold tracking-widest text-accent uppercase">Volunteer Dashboard</span>
          <h1 className="text-3xl font-display font-bold mt-1">Hello, {profile?.full_name || "responder"}.</h1>
          <p className="text-muted-foreground text-sm mt-1">{activeMissions.length} active missions · {completedCount} completed · role: {role}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Active", value: activeMissions.length, color: "text-primary" },
              { label: "Completed", value: completedCount, color: "text-success" },
              { label: "Open nearby", value: sortedNearby.filter((r) => r.distance < 10).length, color: "text-warning" },
              { label: "Critical", value: requests.filter((r) => r.urgency === "critical").length, color: "text-critical" },
            ].map((s) => (
              <div key={s.label} className="glass-strong rounded-xl p-4 animate-float-up card-3d">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className={`font-display text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-3">
            <h2 className="font-display font-bold text-lg">Mission feed (nearest critical first)</h2>
            {sortedNearby.length === 0 && (
              <div className="glass-strong rounded-2xl p-10 text-center text-muted-foreground">No active requests right now. Stay ready.</div>
            )}
            {sortedNearby.map((r) => {
              const full = r.assigned >= MAX_VOLUNTEERS_PER_REQUEST && !r.mine;
              return (
                <div key={r.id} className="glass-strong rounded-2xl p-5 animate-float-up card-3d">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UrgencyBadge urgency={r.urgency} score={r.ai_score} />
                        <span className="text-xs text-muted-foreground capitalize">{r.disaster_type}</span>
                        <span className="text-xs text-muted-foreground">· {r.distance.toFixed(1)} km away</span>
                        <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg mt-2 capitalize">{r.need_type} · {r.people_affected} {r.people_affected === 1 ? "person" : "people"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.assigned}/{MAX_VOLUNTEERS_PER_REQUEST} volunteers</span>
                        <a href={`tel:${r.reporter_phone}`} className="flex items-center gap-1 text-primary"><Phone className="h-3 w-3" /> {r.reporter_phone}</a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.mine ? (
                      <>
                        <span className="text-xs glass rounded-full px-3 py-1.5 capitalize flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Status: {r.mine.status.replace("_", " ")} {r.mine.eta_minutes ? `· ETA ${r.mine.eta_minutes}m` : ""}
                        </span>
                        {r.mine.status === "accepted" && (
                          <Button size="sm" onClick={() => updateStatus(r.mine!.id, "on_the_way")} className="gradient-cool border-0">
                            <Navigation className="h-3.5 w-3.5 mr-1" /> On the way
                          </Button>
                        )}
                        {r.mine.status === "on_the_way" && (
                          <Button size="sm" onClick={() => updateStatus(r.mine!.id, "completed")} className="gradient-hero border-0">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark completed
                          </Button>
                        )}
                      </>
                    ) : full ? (
                      <div className="flex items-center gap-2 text-xs text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" /> Enough volunteers already assigned
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => accept(r)} className="gradient-emergency border-0">
                        <Truck className="h-3.5 w-3.5 mr-1" /> Accept Mission
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="glass-strong rounded-2xl p-5 tilt-soft">
              <h3 className="font-display font-bold mb-3">Volunteer profile</h3>
              <div className="space-y-3">
                <div>
                  <Label>Skills (comma-separated)</Label>
                  <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="first-aid, swimming, driving" className="mt-1.5" maxLength={200} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)} className="h-4 w-4 accent-primary" />
                  I have a vehicle available
                </label>
                <Button onClick={saveProfile} variant="outline" className="w-full">Save profile</Button>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-5 tilt-soft">
              <h3 className="font-display font-bold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Your location</h3>
              <p className="font-mono text-xs text-muted-foreground">{myLoc[0].toFixed(4)}, {myLoc[1].toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-1">Mission ETAs are computed from this point.</p>
            </div>

            <div className="glass-strong rounded-2xl p-5 tilt-soft">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" /> Volunteer Leaderboard
              </h3>
              <LeaderBoard limit={5} />
            </div>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
