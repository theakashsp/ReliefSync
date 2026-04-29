import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Globe,
  Languages,
  MapPinned,
  Mic,
  Radar,
  ShieldCheck,
  Siren,
  Users,
  WifiOff,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/SosButton";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({ meta: [{ title: "About Us · ReliefLink AI" }] }),
});

const FEATURES = [
  { icon: Activity, title: "Real-time emergency requests" },
  { icon: Users, title: "Volunteer coordination" },
  { icon: MapPinned, title: "Live maps" },
  { icon: Bot, title: "AI priority scoring" },
  { icon: Radar, title: "Duplicate detection" },
  { icon: Languages, title: "Multilingual support" },
  { icon: Mic, title: "Voice SOS reporting" },
  { icon: WifiOff, title: "Offline access" },
];

const STACK = [
  "React + TanStack Router",
  "TypeScript",
  "Supabase (Auth + Realtime + Postgres)",
  "Leaflet Maps",
  "Cloudflare + Vite",
  "PWA + Service Worker",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh animate-mesh-drift opacity-75" />
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-bold tracking-widest uppercase text-accent">About ReliefLink</span>
              <h1 className="mt-3 text-4xl sm:text-5xl font-display font-bold leading-tight">
                Hyperlocal disaster coordination for faster, safer response.
              </h1>
              <p className="mt-4 text-muted-foreground max-w-2xl">
                ReliefLink is a hyperlocal volunteer coordination platform that helps citizens, volunteers, NGOs,
                and responders connect in real time during emergencies.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/submit">
                  <Button className="gradient-emergency border-0">Report Emergency</Button>
                </Link>
                <Link to="/map">
                  <Button variant="outline">View Live Map</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-strong rounded-3xl p-6 shadow-elevated tilt-soft"
            >
              <div className="relative h-56 rounded-2xl border border-border/60 overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: [0, 8, 0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
                >
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,oklch(0.75_0.15_200_/_0.24),transparent_45%),radial-gradient(circle_at_75%_65%,oklch(0.7_0.22_25_/_0.26),transparent_45%)]" />
                </motion.div>
                <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ rotateY: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 7 }}>
                  <Globe className="h-16 w-16 text-primary drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]" />
                </motion.div>
                <motion.div className="absolute top-4 left-4 h-9 w-9 rounded-xl gradient-emergency flex items-center justify-center" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                  <Siren className="h-4 w-4 text-white" />
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Mission: reduce response delays, coordinate rescue faster, and empower communities when every second matters.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -6, rotateX: 4, rotateY: -4 }}
                  className="glass rounded-2xl p-4 card-3d"
                >
                  <div className="h-10 w-10 rounded-xl gradient-cool flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-4">
          <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
            <h2 className="text-2xl font-display font-bold">Why it matters</h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              In floods, fires, earthquakes, and medical emergencies, rescue delays cost lives. ReliefLink improves
              field visibility, reduces duplicate reporting noise, and helps aid teams reach high-risk locations sooner.
            </p>
          </div>
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Trust & Safety</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Privacy-aware data handling</li>
              <li>Verified coordination workflow</li>
              <li>Secure operational records</li>
            </ul>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="text-xl font-display font-bold">Technology stack</h3>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STACK.map((item) => (
                <div key={item} className="glass rounded-xl px-3 py-2 text-sm">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-bold">Team</h3>
              <p className="text-sm text-muted-foreground mt-2">Professional coordination and civic-tech collaboration.</p>
            </div>
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-bold">Vision</h3>
              <p className="text-sm text-muted-foreground mt-2">Reliable emergency support in every neighborhood.</p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-16 pt-8">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-display font-bold">Need support or partnership details?</h3>
            <p className="text-sm text-muted-foreground mt-2">Reach the coordination team and help expand rapid-response capacity.</p>
            <div className="mt-5 flex justify-center gap-3">
              <a href="mailto:support@relieflink.ai">
                <Button className="gradient-hero border-0">Contact Support</Button>
              </a>
              <Link to="/volunteer">
                <Button variant="outline">Join Volunteers</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span>ReliefLink AI &copy; {new Date().getFullYear()}</span>
          <Link to="/map" className="hover:text-primary transition-colors">Live Map</Link>
          <Link to="/submit" className="hover:text-primary transition-colors">Report</Link>
          <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
        </div>
      </footer>
      <SosButton />
    </div>
  );
}
