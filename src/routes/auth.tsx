import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Siren, ShieldCheck, Users, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · ReliefLink AI" }] }),
});

const ROLES = [
  { id: "citizen", label: "Citizen", icon: UserIcon, desc: "Report emergencies in my area" },
  { id: "volunteer", label: "Volunteer", icon: Users, desc: "Accept missions and help nearby" },
  { id: "admin", label: "Admin / NGO", icon: ShieldCheck, desc: "Coordinate operations" },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const { user } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"citizen" | "volunteer" | "admin">("citizen");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: redirect || "/map" });
  }, [user, redirect, navigate]);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name, phone, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Welcome to ReliefLink.");
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 gradient-mesh">
      <div className="w-full max-w-md animate-float-up">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl gradient-emergency items-center justify-center shadow-glow mb-4">
            <Siren className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Welcome to ReliefLink</h1>
          <p className="text-sm text-muted-foreground mt-1">Coordinate. Respond. Save lives.</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-hero border-0 h-11">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const active = role === r.id;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`p-3 rounded-xl border text-center transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          <Icon className="h-4 w-4 mx-auto mb-1" />
                          <div className="text-xs font-semibold">{r.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{ROLES.find((r) => r.id === role)?.desc}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Phone</Label>
                    <Input id="su-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" maxLength={20} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-emergency border-0 h-11">
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to coordinate help in good faith.
        </p>
      </div>
    </div>
  );
}
