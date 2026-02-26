# TrackTrail - CLAUDE.md

## Project Overview
TrackTrail is a running training management PWA. Trainers create and publish workouts for their runners, runners log results, and a superadmin manages the platform. Spanish-language UI, mountain/trail visual theme.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, TypeScript, Turbopack)
- **Backend/Auth/DB**: Supabase (PostgreSQL, Auth with OTP + email/password, RLS, RPC)
- **Styling**: Tailwind CSS v4 — uses `@theme inline` blocks in `globals.css`, NOT `tailwind.config.ts`
- **PWA**: Via `src/app/manifest.ts` (next-pwa is NOT compatible with Next.js 16/Turbopack)
- **React**: 19.2.3

## Commands
```bash
npm run dev     # Start dev server (Turbopack) — http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

## Architecture

### Routing (Flat routes)
Flat route structure — no nested route groups `(runner)/(trainer)` to avoid `/dashboard` collision.

| Route | Description |
|---|---|
| `/` | Landing page (redirect to `/dashboard` if authenticated) |
| `/(auth)/login` | Login page (email + OTP or password for superadmin) |
| `/(auth)/register` | Registration page |
| `/(auth)/verify-otp` | OTP verification |
| `/(auth)/callback` | Auth callback route handler |
| `/dashboard` | Role-based dashboard (TrainerDashboard or RunnerDashboard) |
| `/trainings` | Trainer: list trainings |
| `/trainings/new` | Trainer: create training |
| `/trainings/[id]` | Trainer: edit training |
| `/training/[id]` | Runner: view assigned training + submit results |
| `/runners` | Trainer: manage runners |
| `/admin` | Superadmin: manage authorized trainers |

### Key Patterns
- **AppShell** (`src/components/layout/AppShell.tsx`) wraps all authenticated pages — includes Navbar, Sidebar (trainer/admin only), MobileNav
- **AuthContext** (`src/contexts/AuthContext.tsx`) at root layout provides `useAuth()` hook with user, profile, role, loading state
- **Middleware** (`src/middleware.ts`) handles Supabase session refresh and route protection (deprecated in Next.js 16 but still functional)
- **Supabase RLS** enforces access control at DB level — never trust client-side role checks alone
- **`handle_new_user` trigger** auto-creates user profile on auth signup, auto-assigns role based on `authorized_trainers` table

### Supabase Client Usage
- **Client-side**: `src/lib/supabase/client.ts` — `createBrowserClient()`
- **Server-side**: `src/lib/supabase/server.ts` — `createServerClient()` with cookie handling
- **Middleware**: `src/lib/supabase/middleware.ts` — session refresh

## File Structure
```
src/
├── app/
│   ├── (auth)/          # Login, register, verify-otp, callback
│   ├── admin/           # Superadmin panel
│   ├── dashboard/       # Role-based dashboard
│   ├── runners/         # Trainer: manage runners
│   ├── training/[id]/   # Runner: view training + submit results
│   ├── trainings/       # Trainer: list, create, edit trainings
│   ├── globals.css      # Tailwind v4 theme + custom styles
│   ├── layout.tsx       # Root layout (AuthProvider, fonts)
│   ├── manifest.ts      # PWA manifest
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Button, Card, Input, Badge, Tabs, Modal, Spinner
│   ├── layout/          # AppShell, Navbar, Sidebar, MobileNav
│   ├── trainer/         # TrainerDashboard, TrainingForm, BlockEditor, RunnerList
│   ├── runner/          # RunnerDashboard, TrainingCard, ResultForm, RankingTable, PersonalStats
│   └── admin/           # TrainerManager
├── contexts/            # AuthContext
├── lib/supabase/        # client.ts, server.ts, middleware.ts
├── types/               # database.ts (Supabase types), next-pwa.d.ts
└── utils/               # formatters.ts
supabase/
└── schema.sql           # Full DDL + RLS + RPC + triggers
```

## Database Schema (Supabase)

### Tables
| Table | Purpose |
|---|---|
| `users` | User profiles (extends auth.users). Fields: id, email, name, role, status, trainer_id |
| `authorized_trainers` | Whitelist of trainer emails managed by superadmin |
| `trainings` | Workouts created by trainers. Fields: id, trainer_id, title, description, date, status (draft/published), version |
| `training_blocks` | Workout blocks within a training. Fields: id, training_id, block_name, input_type (distance_time/time/distance/comment), repetitions, order_index |
| `runner_assignments` | Links trainings to runners. Fields: id, training_id, runner_id, status (pending/completed) |
| `runner_results` | Runner-submitted results per block. Fields: id, assignment_id, block_id, value_distance, value_time, comment |

### Key RPC Functions
- `publish_training(p_training_id)` — Publishes training + auto-assigns to all active runners of that trainer
- `get_monthly_km_top5(p_trainer_id)` — Top 5 runners by km this month
- `get_monthly_training_top5(p_trainer_id)` — Top 5 runners by completed trainings this month

### Roles & Auth
| Role | Login Method | Access |
|---|---|---|
| `superadmin` | Via "Entrenador" tab with email+password (`superadmin@trail.com`) | Same as trainer + manages authorized_trainers via `/admin` |
| `trainer` | Via "Entrenador" tab with OTP (must be in authorized_trainers) | CRUD trainings, manage assigned runners |
| `runner` | Via "Corredor" tab with OTP | View assigned trainings, submit results |

**Note**: Superadmin and trainer share the same UI profile ("Entrenador" badge). The superadmin is a trainer with the extra ability to manage the trainer whitelist. Login auto-detects the superadmin email and shows a password field instead of OTP.

## Design System / Palette (Mountain/Trail theme)

All colors defined as CSS variables in `globals.css` and mapped via `@theme inline`:

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| primary | `#1B4332` | `bg-primary`, `text-primary` | Verde Bosque — main actions, headers |
| secondary | `#2D6A4F` | `bg-secondary`, `text-secondary` | Verde Musgo — secondary elements |
| accent | `#7F5539` | `bg-accent`, `text-accent` | Marrón Tierra — highlights, CTAs |
| background | `#DAD7CD` | `bg-background` | Gris Piedra — page background |
| foreground | `#344E41` | `text-foreground` | Gris Oscuro — body text |
| highlight | `#A3B18A` | `bg-highlight` | Verde Lima — badges, tags |
| dark | `#3A2F28` | `bg-dark` | Dark accents |
| tt-white | `#FAFAF8` | `bg-tt-white` | Off-white for cards |
| danger | `#9B2226` | `bg-danger`, `text-danger` | Error states |
| warning | `#BB8B1A` | `bg-warning` | Warning states |

## Conventions
- UI language: **Spanish**
- Use Tailwind utility classes with the project's custom color tokens (e.g. `bg-primary`, `text-foreground`)
- Components use `'use client'` directive when they need browser APIs or React hooks
- Server components are the default — only add `'use client'` when necessary
- Supabase queries on server: use `createServerClient()` from `src/lib/supabase/server.ts`
- Supabase queries on client: use `createBrowserClient()` from `src/lib/supabase/client.ts`
- Types are defined in `src/types/database.ts`
- Always respect RLS — never bypass with service_role key on client

## Setup
1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Create superadmin user in Supabase Dashboard > Authentication: `superadmin@trail.com` / `1234`
3. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `npm install && npm run dev`
