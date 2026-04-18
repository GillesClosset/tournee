# AGENTS.md — Tournée Nath

## Project

Route planning tool for Foyer de l'Enfance (child welfare facility).
Optimizes driver tour schedules for weekly missions.

- **Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, PostgreSQL 16, Drizzle ORM, NextAuth v5 (beta)
- **Domain:** `tournee.chezgilles.ovh`
- **Repo:** `GillesClosset/tournee` on GitHub

## Architecture

```
src/
├── app/           # Next.js App Router
│   ├── (auth)/    # Login page (unauthenticated)
│   ├── (app)/     # Authenticated shell (planning, référentiels)
│   └── api/       # REST endpoints (drivers, locations, vehicles, schedules)
├── components/    # UI: layout/, referentiels/, planning/, ui/ (shadcn)
├── lib/
│   ├── db/        # Drizzle ORM schema + postgres client
│   ├── routing/   # OpenRouteService geocoding/routing
│   └── validators/ # Zod schemas
└── types/         # Shared TS types: api.ts, database.ts, domain.ts
```

**Dependency direction:** `app pages → components → lib/validators + lib/db + lib/routing`

## Infrastructure

- **Host:** Self-hosted Coolify on VPS
- **Build pack:** Nixpacks (NOT the Dockerfile) — the `Dockerfile` in the repo is **dead code**
- **Start command:** Nixpacks auto-detects `npm run start` from package.json
- **Proxy:** Traefik v3 with Let's Encrypt
- **Auto-deploy:** Webhook triggers on push to `master`
- **Server-specific details:** See `.agents/infra.md` (gitignored, only on production VPS)

## Database

- **Migrations:** `db/migrations/` — managed by Drizzle Kit
- **Generate migration:** `npx drizzle-kit generate --name <name>`
- **Run migration:** `npm run db:migrate`
- **Caution:** Do NOT run migrations inside the npm start script — it hangs in the Nixpacks container. Run separately before deployment.

## Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run tests (vitest)
npm run lint       # ESLint
npm run format     # Prettier
npm run db:migrate # Run pending migrations
```

## Lot history

| Lot | Commit | Description |
|-----|--------|-------------|
| 0 | `47b2451` | Scaffolding — layout shell, SQL migrations, Supabase stubs |
| 1 | `761159d` | Auth, référentiels CRUD, ORS geocoding |
| 2 | `bf7934a` | Weekly schedule config & availability grid |
