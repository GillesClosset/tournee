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

## Infrastructure — Coolify

### Key facts

- **Host:** Self-hosted Coolify on the same VPS
- **Build pack:** Nixpacks (NOT the Dockerfile) — the Dockerfile in the repo is **not used** by Coolify
- **Start command:** Nixpacks auto-detects `npm run start` from package.json
- **Proxy:** Traefik v3 with Let's Encrypt
- **Auto-deploy:** Webhook triggers on push to `master`

### Coolify API

- **URL:** `http://localhost:8000/api/v1`
- **Token:** `vPeTf2e25y23UkanvhuCsdGnl1WzXK9Uj8SHJOCy`
- **Auth header:** `Authorization: Bearer <token>` (no `0|` prefix)

### Resource UUIDs

| Resource | UUID | Notes |
|----------|------|-------|
| Tournée Nath (app) | `l4seif73zxnzeeat7tn3pdz4` | application_id=2 |
| PostgreSQL DB | `k56jqpn1ici0gdic3ml70hz0` | postgres:16-alpine, shared with BoardGameBeats |
| Coolify project | `xunl05aasfpzpw7k3etorjcs` | |
| Environment | `eeo3nmmptgkgmox0w2avajb6` | production |

### Useful API calls

```bash
# List deployments (only shows in-progress ones)
curl -s http://localhost:8000/api/v1/deployments \
  -H "Authorization: Bearer vPeTf2e25y23UkanvhuCsdGnl1WzXK9Uj8SHJOCy"

# Get app details
curl -s http://localhost:8000/api/v1/applications/l4seif73zxnzeeat7tn3pdz4 \
  -H "Authorization: Bearer vPeTf2e25y23UkanvhuCsdGnl1WzXK9Uj8SHJOCy"

# Deploy (trigger manual deploy)
curl -s -X POST http://localhost:8000/api/v1/applications/l4seif73zxnzeeat7tn3pdz4/deploy \
  -H "Authorization: Bearer vPeTf2e25y23UkanvhuCsdGnl1WzXK9Uj8SHJOCy"

# Full deployment history (via DB — more reliable than API)
sudo docker exec coolify-db psql -U coolify -c \
  "SELECT id, status, substring(commit,1,12) as sha, created_at
   FROM application_deployment_queues
   WHERE application_id = '2'
   ORDER BY id DESC LIMIT 10;"
```

### Troubleshooting deployments

```bash
# Check running containers
sudo docker ps --format '{{.Names}} {{.Image}} {{.Status}}' | grep l4seif

# Container logs
sudo docker logs <container-name> 2>&1 | tail -30

# Check if container is restart-looping
sudo docker ps --format '{{.Names}} {{.Status}}' | grep Restarting
```

### Known pitfalls

1. **Nixpacks, not Dockerfile:** Coolify is configured to use Nixpacks. The `Dockerfile` in the repo is dead code. Nixpacks runs `npm run start` as the start command.
2. **No standalone mode:** `output: 'standalone'` in next.config.ts is incompatible with `next start`. Don't re-add it unless switching to Dockerfile build pack.
3. **Migrations at startup:** Running `npx drizzle-kit migrate` in the npm start script hangs in the Nixpacks container. Run migrations separately via `npm run db:migrate` before deployment or from the host.
4. **Node version:** Nixpacks uses `nodejs_22` (set via `NIXPACKS_NODE_VERSION=22` env var in Coolify). The local dev environment uses Node 24.
5. **`NPM_CONFIG_PRODUCTION=false`:** Set by Nixpacks so devDependencies are installed during build (needed for TypeScript, eslint, etc.).

## Database

- **Connection (from containers):** `postgresql://tournee_user:<password>@k56jqpn1ici0gdic3ml70hz0:5432/tournee`
- **Migrations:** `db/migrations/` — managed by Drizzle Kit
- **Generate migration:** `npx drizzle-kit generate --name <name>`
- **Run migration:** `npm run db:migrate`

## Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run tests (vitest)
npm run lint       # ESLint
npm run format     # Prettier
```

## Lot history

| Lot | Commit | Description |
|-----|--------|-------------|
| 0 | `47b2451` | Scaffolding — layout shell, SQL migrations, Supabase stubs |
| 1 | `761159d` | Auth, référentiels CRUD, ORS geocoding |
| 2 | `bf7934a` | Weekly schedule config & availability grid |
