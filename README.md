# ReliefLink AI 🚨

> **Hyperlocal Disaster Volunteer Coordination Platform** — AI-prioritized rescue requests, real-time map, instant mission dispatch.

[![Built with TanStack](https://img.shields.io/badge/TanStack-Start-orange)](https://tanstack.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-Map-blue)](https://leafletjs.com)

---

## Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Live Disaster Map** | Real-time Leaflet map with colored urgency markers |
| 🤖 **AI Priority Engine** | Keyword + people-count scoring classifies requests critical/high/medium/low |
| 👥 **Volunteer Dispatch** | Accept missions in one tap, ETA auto-computed from GPS |
| 🔄 **Realtime Sync** | Supabase Postgres changes push updates instantly to all screens |
| 🛡️ **Duplicate Detection** | Haversine proximity + NLP overlap prevents spam |
| 📊 **Admin Dashboard** | Recharts area/bar/pie charts, heatmap, leaderboard |
| 🎙️ **Voice SOS** | Web Speech API — speak to describe emergencies |
| 🌐 **i18n** | English · Hindi · Kannada UI labels |
| 🔔 **Sound Alerts** | Web Audio API tones — no audio files required |
| 📱 **PWA** | Installable, offline shell caching |
| 🎭 **Demo Mode** | Simulate live requests + auto-accept for judge demos |

---

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A [Supabase](https://supabase.com) project

### 1. Clone & Install
```bash
git clone https://github.com/your-org/relieflink-ai.git
cd relieflink-ai
npm install
# or: bun install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

### 3. Set Up Database
Run the SQL migrations in order from `supabase/migrations/`:
```bash
# Using Supabase CLI:
npx supabase db push
# Or paste SQL files into Supabase SQL editor
```

### 4. Run Development Server
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (name, phone, skills, vehicle) |
| `user_roles` | Role assignments (citizen/volunteer/admin) |
| `emergency_requests` | Core request data with AI score and urgency |
| `missions` | Volunteer-request assignments with status/ETA |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Citizen** | Submit emergency requests |
| **Volunteer** | View + accept missions, update status |
| **Admin** | Full dashboard, charts, all data |

> **To create an Admin account**: Sign up normally, then run in Supabase SQL editor:
> ```sql
> UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'your-user-id';
> ```

---

## 5-Minute Judge Demo Flow

1. **Open** `http://localhost:3000` — hero animations play, live counters show real data
2. **Enable Demo Mode** — click `DEMO` panel (bottom-left) → Start Demo
3. **Go to `/map`** — watch emergency markers appear every 10 seconds with urgency colors
4. **Click a marker** — sidebar shows full details, reporter contact, AI score
5. **Go to `/submit`** — speak into mic 🎙️, watch AI score update live as you type
6. **Sign in as Volunteer** (`/auth`) — mission feed shows nearby requests sorted by AI score
7. **Accept a mission** — status updates in real-time across all tabs
8. **Admin dashboard** (`/admin`) — charts update, leaderboard shows volunteers, heatmap live

---

## Architecture

```
src/
├── routes/           # TanStack Router file-based routing
│   ├── __root.tsx    # Root layout, AuthProvider, I18nProvider, PWA
│   ├── index.tsx     # Landing page with live stats
│   ├── map.tsx       # Live disaster map
│   ├── submit.tsx    # 3-step emergency report form
│   ├── volunteer.tsx # Volunteer mission dashboard
│   ├── admin.tsx     # Admin command center (role-guarded)
│   └── auth.tsx      # Sign in / register
├── components/
│   ├── DisasterMap.tsx    # Leaflet map wrapper
│   ├── Navbar.tsx         # Nav with language selector + helplines
│   ├── SosButton.tsx      # Floating SOS button
│   ├── UrgencyBadge.tsx   # AI urgency indicator
│   ├── ActivityTicker.tsx # Scrolling live events ticker
│   ├── DemoModePanel.tsx  # Demo simulation controls
│   ├── HelplineDrawer.tsx # Emergency numbers modal
│   ├── LeaderBoard.tsx    # Volunteer rankings
│   ├── StatCard.tsx       # Animated stat cards
│   ├── SkeletonLoader.tsx # Loading states
│   └── VoiceSOS.tsx       # Web Speech API input
├── lib/
│   ├── ai-scoring.ts   # Priority scoring engine (runs offline)
│   ├── auth.tsx        # AuthContext + AuthProvider
│   ├── demo-mode.ts    # Simulation engine
│   ├── i18n.tsx        # EN/HI/KN translations
│   ├── sounds.ts       # Web Audio API alerts
│   └── use-count-up.ts # Number animation hook
└── integrations/supabase/
    ├── client.ts       # Supabase client (singleton proxy)
    └── types.ts        # Auto-generated DB types
```

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set the following environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

---

## Security

- All tables use **Row Level Security (RLS)** — users can only modify their own data
- Admin functions require verified `user_roles.role = 'admin'`
- Volunteer actions verified against `volunteer_id = auth.uid()`
- All inputs length-limited before DB insert
- No secrets exposed client-side (only anon key used)

---

## Built With

- **[TanStack Start](https://tanstack.com/start)** — Full-stack React framework
- **[Supabase](https://supabase.com)** — Postgres + Auth + Realtime
- **[Leaflet](https://leafletjs.com)** + **[react-leaflet](https://react-leaflet.js.org/)** — Maps
- **[Recharts](https://recharts.org/)** — Charts
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Styling
- **[Radix UI](https://www.radix-ui.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** — Components
- **[Zod](https://zod.dev/)** — Validation
- **[sonner](https://sonner.emilkowal.ski/)** — Toasts
- **[date-fns](https://date-fns.org/)** — Date formatting

---

*ReliefLink AI · Built for hackathon · Stay safe. 🙏*
=======
# ReliefSync
>>>>>>> fb2fbc76544eb587eef124131c5a13480227a975
