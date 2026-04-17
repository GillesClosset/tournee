# Architecture Technique — Tournée Nath

| Champ                | Valeur      |
| -------------------- | ----------- |
| **Version**          | 1.0         |
| **Date**             | 2026-04-12  |
| **PRD de référence** | PRD.md v1.0 |
| **Statut**           | Draft       |

---

## Table des matières

1. [Stack Technique & Versions](#1-stack-technique--versions)
2. [Structure du Projet](#2-structure-du-projet)
3. [Schéma de Base de Données](#3-schéma-de-base-de-données)
4. [Contrats API](#4-contrats-api)
5. [Architecture des Composants](#5-architecture-des-composants)
6. [Décisions Techniques Clés](#6-décisions-techniques-clés)
7. [Intégration OpenRouteService](#7-intégration-openrouteservice)
8. [Algorithme d'Optimisation — Spécification](#8-algorithme-doptimisation--spécification)
9. [Import/Export Excel — Spécification](#9-importexport-excel--spécification)
10. [Authentification & Sécurité](#10-authentification--sécurité)
11. [Plan d'Implémentation](#11-plan-dimplémentation)
12. [Environnements & Déploiement](#12-environnements--déploiement)

---

## 1. Stack Technique & Versions

> **Règle absolue** : utiliser la dernière version stable de chaque dépendance au moment du `create-next-app`. Vérifier via `npm info <package> version` avant chaque ajout.

| Technologie         | Version cible                    | Rôle                                   |
| ------------------- | -------------------------------- | -------------------------------------- |
| **Next.js**         | ^15.5 (App Router)               | Framework fullstack (SSR + API Routes) |
| **React**           | ^19.0                            | UI library                             |
| **TypeScript**      | ^5.9                             | Typage statique                        |
| **Tailwind CSS**    | ^4.0                             | Utility-first CSS                      |
| **shadcn/ui**       | latest (CLI)                     | Composants UI accessibles              |
| **PostgreSQL**      | ^16 (Coolify-managed)            | Base de données                        |
| **Drizzle ORM**     | drizzle-orm + node-postgres (pg) | ORM type-safe                          |
| **ExcelJS**         | ^4.4                             | Lecture/écriture Excel (.xlsx)         |
| **Zod**             | ^3.23                            | Validation de schémas (API + forms)    |
| **React Hook Form** | ^7.53                            | Gestion des formulaires                |
| **dnd-kit**         | @dnd-kit/core ^6                 | Drag & drop pour réordonnancement      |
| **date-fns**        | ^4.1                             | Manipulation de dates/heures           |
| **Lucide React**    | latest                           | Icônes                                 |

### Dépendances de développement

| Technologie    | Rôle                      |
| -------------- | ------------------------- |
| **ESLint**     | Linting (config Next.js)  |
| **Prettier**   | Formatage                 |
| **Vitest**     | Tests unitaires           |
| **Playwright** | Tests E2E (si nécessaire) |

---

## 2. Structure du Projet

```
tournee-nath/
├── .env.local                          # Variables d'environnement (PostgreSQL, ORS)
├── .env.example                        # Template des variables
├── next.config.ts                      # Config Next.js (output: standalone)
├── drizzle.config.ts                   # Config Drizzle Kit
├── Dockerfile                          # Multi-stage build pour Coolify
├── tsconfig.json
├── package.json
│
├── db/
│   └── migrations/                     # Migrations SQL (plain PostgreSQL)
│       ├── 001_create_drivers.sql
│       ├── 002_create_vehicles.sql
│       ├── 003_create_locations.sql
│       ├── 004_create_weekly_schedules.sql
│       ├── 005_create_driver_availabilities.sql
│       ├── 006_create_mission_requests.sql
│       ├── 007_create_tours.sql
│       ├── 008_create_tour_stops.sql
│       ├── 009_create_travel_time_cache.sql
│       └── 010_seed_initial_data.sql
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Layout racine (auth wrapper)
│   │   ├── page.tsx                    # Dashboard / page d'accueil
│   │   ├── login/
│   │   │   └── page.tsx               # Page de connexion
│   │   │
│   │   ├── referentiels/
│   │   │   ├── layout.tsx
│   │   │   ├── chauffeurs/
│   │   │   │   └── page.tsx           # CRUD chauffeurs
│   │   │   ├── vehicules/
│   │   │   │   └── page.tsx           # CRUD véhicules
│   │   │   └── points-de-passage/
│   │   │       └── page.tsx           # CRUD locations
│   │   │
│   │   ├── planning/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Liste des semaines planifiées
│   │   │   └── [weekId]/
│   │   │       ├── page.tsx           # Vue semaine : config + import + génération
│   │   │       ├── configuration/
│   │   │       │   └── page.tsx       # Config chauffeurs/véhicules de la semaine
│   │   │       ├── import/
│   │   │       │   └── page.tsx       # Import Excel + validation
│   │   │       ├── tournees/
│   │   │       │   └── page.tsx       # Éditeur de tournées (vue principale)
│   │   │       └── export/
│   │   │           └── page.tsx       # Export Excel
│   │   │
│   │   └── api/                        # Route Handlers (API)
│   │       ├── drivers/
│   │       │   └── route.ts
│   │       ├── vehicles/
│   │       │   └── route.ts
│   │       ├── locations/
│   │       │   ├── route.ts
│   │       │   └── geocode/
│   │       │       └── route.ts
│   │       ├── schedules/
│   │       │   ├── route.ts
│   │       │   └── [scheduleId]/
│   │       │       ├── route.ts
│   │       │       ├── availabilities/
│   │       │       │   └── route.ts
│   │       │       ├── import/
│   │       │       │   └── route.ts
│   │       │       ├── generate/
│   │       │       │   └── route.ts
│   │       │       ├── tours/
│   │       │       │   ├── route.ts
│   │       │       │   └── [tourId]/
│   │       │       │       ├── route.ts
│   │       │       │       └── stops/
│   │       │       │           └── route.ts
│   │       │       └── export/
│   │       │           └── route.ts
│   │       └── routing/
│   │           ├── directions/
│   │           │   └── route.ts
│   │           └── matrix/
│   │               └── route.ts
│   │
│   ├── components/                     # Composants React
│   │   ├── ui/                         # shadcn/ui (auto-généré)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx            # Navigation latérale
│   │   │   ├── header.tsx             # En-tête avec user info
│   │   │   └── nav-links.tsx          # Liens de navigation
│   │   │
│   │   ├── referentiels/
│   │   │   ├── driver-form.tsx
│   │   │   ├── driver-table.tsx
│   │   │   ├── vehicle-form.tsx
│   │   │   ├── vehicle-table.tsx
│   │   │   ├── location-form.tsx
│   │   │   └── location-table.tsx
│   │   │
│   │   ├── planning/
│   │   │   ├── week-selector.tsx
│   │   │   ├── availability-grid.tsx  # Grille semaine chauffeurs
│   │   │   ├── import-dropzone.tsx    # Zone d'upload Excel
│   │   │   ├── import-validation.tsx  # Rapport de validation
│   │   │   ├── unresolved-location.tsx # Dialog pour nouveau point
│   │   │   └── generation-panel.tsx   # Panel de lancement génération
│   │   │
│   │   └── tournees/
│   │       ├── tour-day-view.tsx      # Vue d'une journée
│   │       ├── tour-driver-column.tsx # Colonne d'un chauffeur
│   │       ├── tour-stop-card.tsx     # Carte d'un arrêt (draggable)
│   │       ├── tour-stop-editor.tsx   # Édition d'un arrêt
│   │       ├── manual-task-form.tsx   # Ajout tâche manuelle
│   │       ├── tour-alerts.tsx        # Alertes (dépassement, priorité)
│   │       └── tour-summary.tsx       # Résumé / stats de la tournée
│   │
│   ├── lib/                            # Logique métier & utilitaires
│   │   ├── db/
│   │   │   ├── index.ts               # Client Drizzle (pool PostgreSQL)
│   │   │   └── schema.ts             # Définitions tables/enums Drizzle
│   │   │
│   │   ├── routing/
│   │   │   ├── ors-client.ts          # Client OpenRouteService
│   │   │   ├── osrm-client.ts         # Client OSRM (fallback)
│   │   │   ├── routing-service.ts     # Service abstrait (cache + fallback)
│   │   │   └── geocoding.ts           # Géocodage adresses → lat/lng
│   │   │
│   │   ├── optimizer/
│   │   │   ├── types.ts               # Types de l'algorithme
│   │   │   ├── priority-scorer.ts     # Calcul des scores de priorité
│   │   │   ├── greedy-builder.ts      # Phase 1 : construction gloutonne
│   │   │   ├── local-search.ts        # Phase 2 : amélioration locale
│   │   │   ├── constraints.ts         # Vérification des contraintes
│   │   │   ├── time-calculator.ts     # Calcul des horaires (trajet + parking + accomp)
│   │   │   └── optimizer.ts           # Orchestrateur principal
│   │   │
│   │   ├── excel/
│   │   │   ├── import-parser.ts       # Parsing Excel d'entrée
│   │   │   ├── export-generator.ts    # Génération Excel de sortie
│   │   │   ├── tour-reimport.ts       # Ré-import d'un Excel de tournée
│   │   │   ├── time-parser.ts         # Normalisation des heures
│   │   │   ├── mission-classifier.ts  # Classification missions (type, sens)
│   │   │   └── location-matcher.ts    # Matching fuzzy des noms de lieux
│   │   │
│   │   ├── validators/
│   │   │   ├── driver.schema.ts       # Zod schemas
│   │   │   ├── vehicle.schema.ts
│   │   │   ├── location.schema.ts
│   │   │   ├── schedule.schema.ts
│   │   │   ├── availability.schema.ts
│   │   │   └── mission.schema.ts
│   │   │
│   │   └── utils/
│   │       ├── constants.ts           # Constantes (adresse dépôt, durées, etc.)
│   │       ├── date-utils.ts          # Helpers dates/heures
│   │       └── fuzzy-match.ts         # Algorithme de matching flou
│   │
│   ├── hooks/                          # React hooks personnalisés
│   │   ├── use-drivers.ts
│   │   ├── use-vehicles.ts
│   │   ├── use-locations.ts
│   │   ├── use-schedule.ts
│   │   ├── use-tours.ts
│   │   └── use-toast.ts
│   │
│   └── types/                          # Types TypeScript globaux
│       ├── database.ts                # Types Drizzle (re-export depuis schema)
│       ├── domain.ts                  # Types domaine métier
│       └── api.ts                     # Types requêtes/réponses API
│
├── public/
│   └── favicon.ico
│
└── tests/
    ├── unit/
    │   ├── optimizer/
    │   │   ├── priority-scorer.test.ts
    │   │   ├── greedy-builder.test.ts
    │   │   ├── time-calculator.test.ts
    │   │   └── constraints.test.ts
    │   ├── excel/
    │   │   ├── import-parser.test.ts
    │   │   ├── time-parser.test.ts
    │   │   ├── mission-classifier.test.ts
    │   │   └── location-matcher.test.ts
    │   └── lib/
    │       └── fuzzy-match.test.ts
    └── e2e/
        └── (si Playwright configuré)
```

---

## 3. Schéma de Base de Données

### 3.1 Migration 001 — drivers

```sql
-- db/migrations/001_create_drivers.sql

CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read drivers"
    ON public.drivers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage drivers"
    ON public.drivers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.2 Migration 002 — vehicles

```sql
-- db/migrations/002_create_vehicles.sql

CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicles"
    ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage vehicles"
    ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.3 Migration 003 — locations

```sql
-- db/migrations/003_create_locations.sql

CREATE TYPE public.location_type AS ENUM ('villa', 'rdv');

CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    parking_difficulty BOOLEAN NOT NULL DEFAULT false,
    location_type public.location_type NOT NULL DEFAULT 'villa',
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour le matching par nom (recherche fuzzy)
CREATE INDEX locations_name_trgm_idx ON public.locations
    USING gin (name gin_trgm_ops);

-- Nécessite l'extension pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read locations"
    ON public.locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage locations"
    ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.4 Migration 004 — weekly_schedules

```sql
-- db/migrations/004_create_weekly_schedules.sql

CREATE TYPE public.schedule_status AS ENUM ('draft', 'configured', 'imported', 'generated', 'modified', 'confirmed');

CREATE TABLE public.weekly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL UNIQUE,  -- Toujours un lundi
    status public.schedule_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read schedules"
    ON public.weekly_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage schedules"
    ON public.weekly_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER weekly_schedules_updated_at
    BEFORE UPDATE ON public.weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.5 Migration 005 — driver_availabilities

```sql
-- db/migrations/005_create_driver_availabilities.sql

CREATE TABLE public.driver_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=lundi, 7=dimanche
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Un chauffeur ne peut avoir qu'une seule dispo par jour par semaine
    UNIQUE (schedule_id, driver_id, day_of_week),

    -- L'heure de fin doit être après l'heure de début
    CHECK (end_time > start_time)
);

-- Index pour requêtes fréquentes
CREATE INDEX driver_avail_schedule_day_idx
    ON public.driver_availabilities(schedule_id, day_of_week);

ALTER TABLE public.driver_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read availabilities"
    ON public.driver_availabilities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage availabilities"
    ON public.driver_availabilities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER driver_availabilities_updated_at
    BEFORE UPDATE ON public.driver_availabilities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.6 Migration 006 — mission_requests

```sql
-- db/migrations/006_create_mission_requests.sql

CREATE TYPE public.mission_type AS ENUM ('accompagnement', 'recuperation', 'both');
CREATE TYPE public.accompaniment_type AS ENUM ('scolaire', 'medical', 'loisir', 'famille', 'autre');
CREATE TYPE public.mission_status AS ENUM ('pending', 'assigned', 'cancelled');

CREATE TABLE public.mission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    location_id UUID REFERENCES public.locations(id),           -- Villa / point de passage
    destination_location_id UUID REFERENCES public.locations(id), -- Destination de mission (si connue)
    destination_address TEXT,                                     -- Adresse de destination (texte brut si pas en base)
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    requested_time TIME NOT NULL,
    time_range_end TIME,                                         -- Fin de plage si "15h-16h"
    minor_name TEXT,
    mission_text TEXT NOT NULL,
    mission_type public.mission_type NOT NULL DEFAULT 'accompagnement',
    accompaniment_type public.accompaniment_type NOT NULL DEFAULT 'autre',
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    priority_override NUMERIC(5,2),                              -- Override manuel (null = auto)
    is_priority_flagged BOOLEAN NOT NULL DEFAULT false,          -- Marqué "Prioritaire" dans l'Excel
    observations TEXT,
    raw_row_data JSONB,                                          -- Ligne Excel brute pour debug
    status public.mission_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mission_requests_schedule_day_idx
    ON public.mission_requests(schedule_id, day_of_week);

CREATE INDEX mission_requests_status_idx
    ON public.mission_requests(status);

ALTER TABLE public.mission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read missions"
    ON public.mission_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage missions"
    ON public.mission_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER mission_requests_updated_at
    BEFORE UPDATE ON public.mission_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.7 Migration 007 — tours

```sql
-- db/migrations/007_create_tours.sql

CREATE TYPE public.tour_status AS ENUM ('generated', 'modified', 'confirmed');

CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    driver_availability_id UUID NOT NULL REFERENCES public.driver_availabilities(id),
    status public.tour_status NOT NULL DEFAULT 'generated',
    total_travel_minutes INTEGER,
    total_distance_meters INTEGER,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tours_schedule_idx ON public.tours(schedule_id);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tours"
    ON public.tours FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage tours"
    ON public.tours FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER tours_updated_at
    BEFORE UPDATE ON public.tours
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.8 Migration 008 — tour_stops

```sql
-- db/migrations/008_create_tour_stops.sql

CREATE TABLE public.tour_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    sequence_order SMALLINT NOT NULL,
    location_id UUID REFERENCES public.locations(id),
    mission_request_id UUID REFERENCES public.mission_requests(id),
    scheduled_time TIME NOT NULL,
    travel_time_minutes INTEGER NOT NULL DEFAULT 0,       -- Temps de trajet depuis l'arrêt précédent
    parking_extra_minutes INTEGER NOT NULL DEFAULT 0,     -- +20min si stationnement difficile
    accompaniment_extra_minutes INTEGER NOT NULL DEFAULT 0, -- +10min si accompagnement depuis villa
    is_optional BOOLEAN NOT NULL DEFAULT false,            -- Partie facultative (hors plage)
    is_manual_task BOOLEAN NOT NULL DEFAULT false,         -- Tâche ajoutée manuellement
    manual_task_text TEXT,                                  -- Texte libre pour tâches manuelles
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (tour_id, sequence_order)
);

CREATE INDEX tour_stops_tour_idx ON public.tour_stops(tour_id);
CREATE INDEX tour_stops_mission_idx ON public.tour_stops(mission_request_id);

ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tour_stops"
    ON public.tour_stops FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage tour_stops"
    ON public.tour_stops FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER tour_stops_updated_at
    BEFORE UPDATE ON public.tour_stops
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 3.9 Migration 009 — travel_time_cache

```sql
-- db/migrations/009_create_travel_time_cache.sql

CREATE TABLE public.travel_time_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    dest_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lng DOUBLE PRECISION NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    duration_seconds INTEGER NOT NULL,
    distance_meters INTEGER NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Un seul cache par paire origine-destination
    UNIQUE (origin_location_id, dest_location_id)
);

CREATE INDEX travel_cache_origin_dest_idx
    ON public.travel_time_cache(origin_location_id, dest_location_id);

-- Fonction pour nettoyer le cache expiré (>30 jours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.travel_time_cache
    WHERE cached_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.travel_time_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
    ON public.travel_time_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage cache"
    ON public.travel_time_cache FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 3.10 Migration 010 — seed (données initiales)

```sql
-- db/migrations/010_seed_initial_data.sql

-- Chauffeurs
INSERT INTO public.drivers (name, notes) VALUES
    ('Yannick', 'Semaine, 7h-15h habituel'),
    ('Solange', 'Semaine, 7h-14h habituel'),
    ('Ali', 'Semaine après-midi/soir, 15h-23h'),
    ('Aymen', 'Weekend + remplacements');

-- Véhicules
INSERT INTO public.vehicles (name, license_plate) VALUES
    ('Dacia 1', 'HE-271-AT'),
    ('Dacia 2', 'HH-147-GZ');

-- Point de départ fixe (dépôt)
INSERT INTO public.locations (name, address, latitude, longitude, location_type, notes) VALUES
    ('Dépôt - Simone Veil', '117 avenue Simone Veil, 06200 Nice', 43.6205, 7.0489, 'rdv', 'Point de départ et retour fixe pour toutes les tournées');
```

### Diagramme des relations

```
drivers ──┐
           ├──▶ driver_availabilities ──▶ tours ──▶ tour_stops
vehicles ──┘         │                                  │
                     │                                  │
              weekly_schedules ◀──── mission_requests ◀─┘
                                          │
              locations ◀─────────────────┘
                  │
              travel_time_cache (locations × locations)
```

---

## 4. Contrats API

### Convention générale

- **Base path** : `/api/`
- **Format** : JSON
- **Auth** : Bearer token — vérifié par middleware (non implémenté actuellement)
- **Erreurs** : `{ error: string, details?: unknown }`
- **Pagination** : `?page=1&limit=20` (quand applicable)
- **Validation** : Zod côté serveur, erreurs 400 avec détails

### 4.1 Référentiels

#### `GET /api/drivers`

Retourne la liste des chauffeurs.

```typescript
// Response 200
{
  data: Array<{
    id: string
    name: string
    is_active: boolean
    notes: string | null
  }>
}
```

#### `POST /api/drivers`

```typescript
// Request
{ name: string, notes?: string }
// Response 201
{ data: Driver }
```

#### `PATCH /api/drivers`

```typescript
// Request
{ id: string, name?: string, is_active?: boolean, notes?: string }
// Response 200
{ data: Driver }
```

_(Même pattern pour `/api/vehicles` et `/api/locations`)_

#### `POST /api/locations/geocode`

Géocode une adresse et retourne les coordonnées.

```typescript
// Request
{
  address: string
}
// Response 200
{
  data: {
    latitude: number
    longitude: number
    formatted_address: string
    confidence: number // 0-1
  }
}
```

### 4.2 Planning

#### `GET /api/schedules`

Liste des semaines planifiées.

```typescript
// Response 200
{
  data: Array<{
    id: string
    week_start_date: string // ISO date
    status: ScheduleStatus
    mission_count: number
    tour_count: number
  }>
}
```

#### `POST /api/schedules`

Créer une nouvelle semaine.

```typescript
// Request
{
  week_start_date: string
}
// Response 201
{
  data: WeeklySchedule
}
```

#### `GET /api/schedules/[scheduleId]/availabilities`

Retourne les disponibilités chauffeurs de la semaine.

```typescript
// Response 200
{
  data: Array<{
    id: string
    driver: { id: string; name: string }
    vehicle: { id: string; name: string; license_plate: string } | null
    day_of_week: number
    start_time: string // "HH:mm"
    end_time: string
    is_available: boolean
  }>
}
```

#### `PUT /api/schedules/[scheduleId]/availabilities`

Met à jour toutes les disponibilités de la semaine (bulk upsert).

```typescript
// Request
{
  availabilities: Array<{
    driver_id: string
    vehicle_id: string | null
    day_of_week: number
    start_time: string
    end_time: string
    is_available: boolean
  }>
}
// Response 200
{ data: DriverAvailability[] }
```

### 4.3 Import

#### `POST /api/schedules/[scheduleId]/import`

Import du fichier Excel des demandes.

```typescript
// Request: multipart/form-data
// Field: file (xlsx)

// Response 200
{
  data: {
    total_rows: number
    parsed_missions: number
    days_detected: string[]
    unresolved_locations: Array<{
      row_number: number
      location_name: string
      suggested_matches: Array<{ id: string, name: string, score: number }>
    }>
    parse_errors: Array<{
      row_number: number
      field: string
      message: string
      raw_value: string
    }>
    missions: MissionRequest[]  // Missions parsées (preview avant confirmation)
  }
}
```

#### `POST /api/schedules/[scheduleId]/import/confirm`

Confirme l'import après résolution des erreurs.

```typescript
// Request
{
  missions: Array<{
    ...ParsedMission
    location_id: string          // Résolu (existant ou nouvellement créé)
    corrections?: {              // Corrections manuelles
      requested_time?: string
      mission_type?: MissionType
      accompaniment_type?: AccompanimentType
    }
  }>
}
// Response 200
{ data: { imported_count: number } }
```

### 4.4 Génération

#### `POST /api/schedules/[scheduleId]/generate`

Lance la génération des tournées optimisées.

```typescript
// Request (optionnel)
{
  options?: {
    preserve_confirmed_stops?: boolean  // Ne pas toucher aux arrêts déjà confirmés
    days?: number[]                     // Régénérer seulement certains jours
  }
}

// Response 200
{
  data: {
    tours: Array<{
      id: string
      driver: { id: string, name: string }
      vehicle: { id: string, name: string }
      day_of_week: number
      start_time: string
      end_time: string
      stops: TourStop[]
      total_travel_minutes: number
      total_distance_meters: number
      has_optional_stops: boolean
    }>
    unassigned_missions: Array<{
      mission: MissionRequest
      reason: string  // "no_driver_available", "time_conflict", "capacity_exceeded"
    }>
    warnings: string[]
    stats: {
      total_missions: number
      assigned_missions: number
      total_travel_minutes: number
      average_utilization_percent: number  // % plage horaire utilisée par chauffeur
    }
  }
}
```

### 4.5 Tournées (CRUD + édition)

#### `GET /api/schedules/[scheduleId]/tours`

Retourne toutes les tournées de la semaine.

```typescript
// Response 200
{ data: Tour[] }  // Avec stops inclus, triés par day_of_week puis start_time
```

#### `PATCH /api/schedules/[scheduleId]/tours/[tourId]/stops`

Met à jour les arrêts d'une tournée (réordonnancement, suppression, ajout).

```typescript
// Request
{
  action: 'reorder' | 'remove' | 'add_manual' | 'move_to_tour' | 'update_time'
  // Pour reorder :
  stop_ids_ordered?: string[]
  // Pour remove :
  stop_id?: string
  // Pour add_manual :
  manual_task?: { text: string, scheduled_time: string, sequence_after: string }
  // Pour move_to_tour :
  stop_id?: string
  target_tour_id?: string
  // Pour update_time :
  stop_id?: string
  new_time?: string
}

// Response 200
{
  data: {
    updated_tour: Tour          // Tournée mise à jour avec horaires recalculés
    target_tour?: Tour          // Si move_to_tour
    alerts: Array<{
      type: 'overtime' | 'priority_delayed' | 'time_conflict'
      message: string
      stop_id: string
    }>
  }
}
```

### 4.6 Export

#### `GET /api/schedules/[scheduleId]/export`

Génère et retourne le fichier Excel de sortie.

```typescript
// Response 200
// Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// Content-Disposition: attachment; filename="Planning_semaine_2026-04-13.xlsx"
// Body: binary Excel file
```

### 4.7 Routage (interne)

#### `POST /api/routing/matrix`

Calcule la matrice des temps de trajet (avec cache).

```typescript
// Request
{
  locations: Array<{ id?: string, lat: number, lng: number }>
}
// Response 200
{
  data: {
    durations: number[][]    // Matrice NxN en secondes
    distances: number[][]    // Matrice NxN en mètres
    from_cache: number       // Nombre de paires servies depuis le cache
    from_api: number         // Nombre de nouvelles requêtes API
  }
}
```

---

## 5. Architecture des Composants

### 5.1 Hiérarchie des pages

```
app/layout.tsx                    ← Sidebar + Header
├── app/page.tsx                  ← Dashboard (résumé semaine active)
├── app/login/page.tsx            ← Login (pas de sidebar)
│
├── app/referentiels/layout.tsx   ← Sous-nav (Chauffeurs | Véhicules | Points)
│   ├── chauffeurs/page.tsx       ← Table + formulaire modal
│   ├── vehicules/page.tsx        ← Table + formulaire modal
│   └── points-de-passage/page.tsx ← Table + formulaire modal + géocodage
│
└── app/planning/layout.tsx       ← Sous-nav contextuelle
    ├── page.tsx                  ← Liste des semaines + création
    └── [weekId]/
        ├── page.tsx              ← Vue d'ensemble semaine (stepper)
        ├── configuration/page.tsx ← Grille disponibilités
        ├── import/page.tsx       ← Upload + validation + résolution
        ├── tournees/page.tsx     ← Éditeur principal (colonnes par chauffeur)
        └── export/page.tsx       ← Preview + téléchargement Excel
```

### 5.2 Flux de navigation principal (Stepper)

```
Configuration  →  Import  →  Génération  →  Édition  →  Export
    [1]            [2]         [3]           [4]         [5]
```

La page `planning/[weekId]/page.tsx` affiche un stepper horizontal reflétant l'état du workflow. L'utilisateur peut naviguer librement entre les étapes déjà complétées.

### 5.3 Composant clé : Éditeur de tournées

L'éditeur de tournées (`tournees/page.tsx`) est la vue la plus complexe :

```
┌─────────────────────────────────────────────────────────────────┐
│  [< Lundi]  [Mardi]  [Mercredi]  [Jeudi]  [Vendredi]  [Sam >] │  ← Tabs jours
├─────────────────┬──────────────────┬────────────────────────────┤
│  Solange        │  Yannick         │  Ali                       │  ← Colonnes chauffeurs
│  7h00-14h00     │  7h00-15h00      │  15h00-23h00               │
│  Dacia HE-271   │  Dacia HH-147    │  Dacia HE-271              │
│─────────────────┼──────────────────┼────────────────────────────│
│ ┌─────────────┐ │ ┌──────────────┐ │ ┌────────────────────────┐ │
│ │ 07:50       │ │ │ 08:00        │ │ │ 15:00                  │ │
│ │ Clair-Castel│ │ │ Clair-Castel │ │ │ Béluga                 │ │  ← Stop cards
│ │ COLOZZI     │ │ │ BILLELO      │ │ │ ALAUX Antéa            │ │     (draggable)
│ │ Acc. scol.  │ │ │ Acc. scol.   │ │ │ Récup. collège         │ │
│ │ 🚗 25min    │ │ │ 🚗 18min     │ │ │ 🚗 30min               │ │
│ │ 🅿️ +20min   │ │ │              │ │ │                        │ │
│ └─────────────┘ │ └──────────────┘ │ └────────────────────────┘ │
│ ┌─────────────┐ │ ┌──────────────┐ │ ┌────────────────────────┐ │
│ │ 09:30       │ │ │ 08:45        │ │ │ 17:10                  │ │
│ │ ...         │ │ │ ...          │ │ │ ...                    │ │
│ └─────────────┘ │ └──────────────┘ │ └────────────────────────┘ │
│                 │                  │                            │
│ [+ Tâche]       │ [+ Tâche]        │ [+ Tâche]                  │
│─────────────────┼──────────────────┼────────────────────────────│
│ Total: 4h20     │ Total: 5h10      │ Total: 6h45                │  ← Stats
│ Missions: 5     │ Missions: 7      │ Missions: 4                │
└─────────────────┴──────────────────┴────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Alertes                                                     │
│ • Ali dépasse sa plage de 15min (partie facultative)            │
│ • Mission GRAND Chrystal non assignée (conflit horaire)         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 State Management

Approche **Server Components + Client Components ciblés** :

| Donnée                | Stratégie                            | Justification                                              |
| --------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Référentiels (CRUD)   | Server Components + Server Actions   | Données stables, rafraîchies à la navigation               |
| Configuration semaine | Server Component + formulaire client | Formulaire complexe (grille)                               |
| Import/validation     | Client Component                     | Upload fichier + interactions dynamiques                   |
| Tournées (éditeur)    | Client Component + hooks             | Drag & drop, modifications fréquentes, recalcul temps réel |
| Tournées (données)    | `useSWR` ou `React Query`            | Cache côté client, revalidation optimiste                  |

L'éditeur de tournées utilise un **état local riche** (React state) avec synchronisation serveur via API calls lors des modifications. Pas de store global (Redux/Zustand) nécessaire — la complexité est confinée à l'éditeur.

---

## 6. Décisions Techniques Clés

### DT1 : Server Components vs Client Components

**Décision** : Maximiser les Server Components. Seuls les composants nécessitant de l'interactivité sont des Client Components.

| Server Components                               | Client Components                   |
| ----------------------------------------------- | ----------------------------------- |
| Pages de listing (chauffeurs, véhicules, lieux) | Formulaires d'édition (modals)      |
| Page de planning (liste des semaines)           | Grille de disponibilités            |
| Layout, navigation                              | Zone d'upload Excel                 |
|                                                 | Éditeur de tournées (drag & drop)   |
|                                                 | Composants avec toast/notifications |

### DT2 : Gestion des formulaires

**Décision** : React Hook Form + Zod pour tous les formulaires.

- Les schémas Zod sont partagés entre validation client et serveur.
- Les erreurs serveur sont propagées dans les champs du formulaire.

### DT3 : Drag & Drop

**Décision** : `@dnd-kit/core` + `@dnd-kit/sortable`.

- Supporte le drag intra-liste (réordonnancement) et inter-listes (déplacement entre chauffeurs).
- Accessible (clavier supporté).
- Léger (~10kb gzipped).

### DT4 : Matching fuzzy des noms de lieux

**Décision** : Algorithme de distance de Levenshtein normalisé, côté serveur.

- Seuil de matching : score > 0.7 (sur 0-1).
- Si plusieurs matchs > 0.7 : proposer les 3 meilleurs à l'utilisateur.
- Si aucun match > 0.7 : signaler comme non résolu.
- Normalisation avant matching : lowercase, suppression accents, trim.

Implémentation en TypeScript pur (pas de dépendance externe).

### DT5 : Gestion des heures

**Décision** : `date-fns` pour toutes les manipulations de dates/heures.

- Les heures sont stockées en `TIME` PostgreSQL (sans timezone).
- Le parsing des heures variées de l'Excel (cf. `time-parser.ts`) produit un `string` au format `HH:mm`.
- Les calculs de durée utilisent des minutes entières (arrondi supérieur).

### DT6 : Classification automatique des missions

**Décision** : Approche par dictionnaire de mots-clés (pas de ML).

```typescript
// mission-classifier.ts
const MISSION_TYPE_KEYWORDS = {
  accompagnement: ['accompagnement', 'accompagner', 'accompagnment', 'déposer', 'emmener'],
  recuperation: [
    'récupération',
    'récupérer',
    'raccompagner',
    'raccompagnement',
    'retour',
    'ramener',
  ],
}

const ACCOMPANIMENT_TYPE_KEYWORDS = {
  scolaire: ['scolaire', 'école', 'collège', 'college', 'lycée', 'ITEP'],
  medical: ['médical', 'CMP', 'orthophoniste', 'médecin', 'hôpital', 'pédiatre', 'infirmière'],
  famille: ['VM', 'visite médiatisée', 'famille', 'PAJE', 'MSD', 'Montjoye', 'ERPE', 'ARPAS'],
  loisir: ['loisir', 'sport', 'danse', 'gymnase', 'stade', 'piscine', 'activité'],
}
```

Extensible : les dictionnaires peuvent être enrichis sans modification de code (futur : stockage en base).

---

## 7. Intégration OpenRouteService

### Configuration

```typescript
// .env.local
ORS_API_KEY=your_api_key_here
ORS_BASE_URL=https://api.openrouteservice.org
```

### Client ORS

```typescript
// src/lib/routing/ors-client.ts

interface ORSDirectionsResponse {
  routes: Array<{
    summary: { distance: number; duration: number }
    segments: Array<{ distance: number; duration: number }>
  }>
}

interface ORSMatrixResponse {
  durations: number[][] // secondes
  distances: number[][] // mètres
}

class ORSClient {
  private apiKey: string
  private baseUrl: string

  async getDirections(
    from: [number, number],
    to: [number, number],
  ): Promise<{
    duration_seconds: number
    distance_meters: number
  }>

  async getMatrix(locations: Array<[number, number]>): Promise<{
    durations: number[][]
    distances: number[][]
  }>

  async geocode(address: string): Promise<{
    latitude: number
    longitude: number
    formatted_address: string
    confidence: number
  }>
}
```

### Service de routage avec cache

```typescript
// src/lib/routing/routing-service.ts

class RoutingService {
  private orsClient: ORSClient
  private osrmClient: OSRMClient // fallback

  /**
   * Calcule la matrice de temps de trajet entre les locations.
   * 1. Vérifie le cache pour chaque paire
   * 2. Requête l'API pour les paires manquantes
   * 3. Stocke les résultats en cache
   * 4. Fallback vers OSRM si ORS échoue
   * 5. Fallback vers distance euclidienne × 1.4 si les deux échouent
   */
  async getMatrix(locations: Location[]): Promise<TravelTimeMatrix>

  /**
   * Géocode une adresse.
   * Essaie ORS en premier, puis Nominatim (OSM) en fallback.
   */
  async geocode(address: string): Promise<GeocodingResult>
}
```

### Limites et quotas

| Endpoint   | Limite gratuite      | Notre usage estimé/semaine | Marge |
| ---------- | -------------------- | -------------------------- | ----- |
| Directions | 2000/jour            | ~50-100 (nouvelles paires) | Large |
| Matrix     | 500/jour (max 50×50) | ~5-10 (batch par jour)     | Large |
| Geocoding  | 2000/jour            | ~5-10 (nouveaux lieux)     | Large |

Grâce au cache, après les premières semaines, l'usage API sera minimal.

---

## 8. Algorithme d'Optimisation — Spécification

### 8.1 Types

```typescript
// src/lib/optimizer/types.ts

interface OptimizationInput {
  missions: MissionRequest[] // Demandes du jour
  availabilities: DriverAvailability[] // Chauffeurs disponibles ce jour
  travelMatrix: TravelTimeMatrix // Matrice des temps de trajet
  depot: { lat: number; lng: number } // 117 av Simone Veil
  preservedStops?: TourStop[] // Arrêts à ne pas toucher (re-génération)
}

interface OptimizationOutput {
  tours: GeneratedTour[]
  unassigned: Array<{ mission: MissionRequest; reason: string }>
  warnings: string[]
  stats: OptimizationStats
}

interface GeneratedTour {
  driverAvailabilityId: string
  stops: GeneratedStop[]
  totalTravelMinutes: number
  totalDistanceMeters: number
}

interface GeneratedStop {
  missionRequestId: string
  locationId: string
  scheduledTime: string // HH:mm
  travelTimeMinutes: number
  parkingExtraMinutes: number
  accompanimentExtraMinutes: number
  isOptional: boolean
}
```

### 8.2 Pipeline d'optimisation

```
Input (missions du jour + disponibilités)
  │
  ▼
[1] Pré-traitement
  │  - Calcul des scores de priorité
  │  - Résolution des séquences de stops par mission
  │    (accompagnement: dépôt→villa→destination,
  │     récupération: dépôt→destination→villa)
  │  - Identification des missions à heure fixe vs flexibles
  │
  ▼
[2] Construction gloutonne
  │  - Trier missions par : heure fixe d'abord, puis priorité décroissante
  │  - Pour chaque mission :
  │    - Identifier les chauffeurs éligibles (disponibilité + véhicule)
  │    - Pour chaque chauffeur éligible, calculer le coût d'insertion :
  │      coût = temps_trajet + parking_extra + accomp_extra
  │    - Vérifier la faisabilité (pas de dépassement de plage,
  │      pas de conflit avec les arrêts existants)
  │    - Attribuer au chauffeur au coût le plus faible
  │  - Missions non attribuables → liste "unassigned"
  │
  ▼
[3] Amélioration locale (max 100 itérations)
  │  - Opérateur RELOCATE : déplacer un stop vers une meilleure position
  │  - Opérateur SWAP : échanger deux stops entre tournées
  │  - Opérateur 2-OPT : inverser un segment dans une tournée
  │  - Accepter le mouvement si : temps_total_toutes_tournées diminue
  │    ET aucune contrainte violée
  │  - Arrêter si aucune amélioration depuis 10 itérations
  │
  ▼
[4] Post-traitement
  │  - Recalculer tous les horaires précis
  │  - Identifier les stops dépassant la plage → marquer "facultatif"
  │  - Vérifier qu'aucun stop a une durée impossible
  │  - Calculer les stats (total km, utilisation chauffeur, etc.)
  │
  ▼
Output (tournées optimisées + non-assignées + alertes)
```

### 8.3 Règles de calcul des horaires

Pour chaque arrêt `i` dans une tournée :

```
arrival_time[i] = departure_time[i-1] + travel_time[i-1 → i]

// Le temps effectif à un arrêt inclut :
effective_time[i] = travel_time[i-1 → i]
                  + parking_extra[i]           // +20min si stationnement difficile à destination
                  + accompaniment_extra[i]     // +10min si accompagnement ET départ = villa

// L'heure de départ de l'arrêt :
departure_time[i] = MAX(arrival_time[i], requested_time[i])
                  + dwell_time[i]              // Temps passé sur place (0 pour simple dépose, durée si plage)

// Pour le premier arrêt :
departure_time[0] = driver_start_time          // L'heure de début de la plage chauffeur
// Le chauffeur part du dépôt (117 av Simone Veil)
```

### 8.4 Gestion des plages horaires (missions avec durée)

Quand une mission a une plage (ex: "15h-16h") :

1. **Sans indication supplémentaire** = aller-retour. Le chauffeur dépose, revient plus tard récupérer (ou un autre chauffeur récupère).
2. **Avec indication** = suivre l'indication textuelle.

Le système crée **deux stops** pour un A/R :

- Stop A : aller (accompagnement) à `time_range_start`
- Stop B : retour (récupération) à `time_range_end`

Ces deux stops peuvent être attribués à des chauffeurs différents si c'est plus optimal. Le chauffeur peut accomplir d'autres missions entre les deux.

---

## 9. Import/Export Excel — Spécification

### 9.1 Import Parser

```typescript
// src/lib/excel/import-parser.ts

interface ParsedRow {
  row_number: number
  day_text: string // Ex: "Lundi 16-Mars"
  day_of_week: number // 1-7
  location_name: string // Ex: "Clair-Castel"
  location_id: string | null // Résolu si match
  time_text: string // Ex: "8h30", "15h-16h"
  requested_time: string // Normalisé "HH:mm"
  time_range_end: string | null // Si plage horaire
  minor_name: string | null
  mission_text: string
  mission_type: MissionType
  accompaniment_type: AccompanimentType
  observations: string | null
  is_priority_flagged: boolean
  parse_warnings: string[]
}

function parseImportExcel(workbook: ExcelJS.Workbook): {
  rows: ParsedRow[]
  errors: ParseError[]
  stats: { total_rows: number; days_found: string[] }
}
```

### 9.2 Time Parser

```typescript
// src/lib/excel/time-parser.ts

/**
 * Normalise les formats d'heure variés vers "HH:mm".
 *
 * Formats supportés :
 * - "8h" → "08:00"
 * - "8h30" → "08:30"
 * - "08h00" → "08:00"
 * - "8H30" → "08:30"
 * - "9h30" → "09:30"
 * - "15h" → "15:00"
 * - "15h-16h" → { start: "15:00", end: "16:00" }
 * - "15h00-16h30" → { start: "15:00", end: "16:30" }
 * - "9h45 - 10h15" → { start: "09:45", end: "10:15" }
 * - "13h30-14h30" → { start: "13:30", end: "14:30" }
 * - "16h30 a peu prés" → "16:30" (ignorer le texte superflu)
 * - "matin" → null (signaler comme non parsable)
 * - "entre 15h00 et 16h00" → { start: "15:00", end: "16:00" }
 * - "10h00 \n(en retard)" → "10:00" (ignorer annotations)
 */
function parseTime(raw: string): {
  start: string
  end: string | null
  raw: string
  warnings: string[]
}
```

### 9.3 Export Generator

```typescript
// src/lib/excel/export-generator.ts

/**
 * Génère le fichier Excel de sortie conforme au format attendu.
 *
 * Structure :
 * - 3 onglets par jour (lun-ven) : "{Jour} {plage1}", "{Jour} Matin", "{Jour} Aprés midi"
 * - 1 onglet samedi, 1 onglet dimanche
 *
 * Chaque onglet :
 * - A1: "Foyer de l'enfance"
 * - D1: "{Véhicule}\n{Chauffeur}\n{plage}" OU "pas de chauffeur"
 * - A2:E2 (fusionné): "{JOUR} {date}"
 * - A4:E4: Headers (Villa | heure | nom mineur | missions | observation)
 * - A5+: Arrêts
 */
async function generateExportExcel(
  schedule: WeeklySchedule,
  tours: Tour[],
  availabilities: DriverAvailability[],
): Promise<ExcelJS.Workbook>
```

---

## 10. Authentification & Sécurité

### Setup Auth

> **Note** : Aucune authentification n'est actuellement implémentée. L'ancienne dépendance Supabase Auth a été retirée. Si une authentification est nécessaire à l'avenir, elle sera ajoutée via NextAuth.js / Auth.js.

### Variables d'environnement

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/tournee
ORS_API_KEY=your_openrouteservice_key
ORS_BASE_URL=https://api.openrouteservice.org
```

### Données sensibles

- Les noms de mineurs sont des données sensibles (RGPD, protection de l'enfance).
- Pas de logging des noms en clair dans les logs serveur.
- Pas de partage de données avec des services tiers (sauf routage : seules les coordonnées GPS sont envoyées à ORS, jamais les noms).

---

## 11. Plan d'Implémentation

### Découpage en lots

Le projet est découpé en **6 lots** livrables séquentiellement. Chaque lot produit un incrément fonctionnel testable.

```
Lot 0 ──▶ Lot 1 ──▶ Lot 2 ──▶ Lot 3 ──▶ Lot 4 ──▶ Lot 5
Setup     Référ.    Config    Import    Génér.    Export
          + Auth    semaine   Excel     + Édit.   + Ré-import
```

---

#### Lot 0 : Scaffolding & Infrastructure

**Objectif** : Projet bootable, déployable, avec DB prête.

| Tâche                                                   | Fichiers                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| `create-next-app` avec TypeScript, Tailwind, App Router | `next.config.ts`, `tsconfig.json`, `package.json` |
| Installer shadcn/ui + composants de base                | `src/components/ui/*`                             |
| Configurer PostgreSQL (projet + .env)                   | `.env.local`, `.env.example`                      |
| Créer toutes les migrations SQL                         | `db/migrations/*`                                 |
| Exécuter les migrations + seed                          | Via `drizzle-kit push` ou `psql`                  |
| Configurer le layout racine + sidebar                   | `src/app/layout.tsx`, `src/components/layout/*`   |
| Configurer ESLint + Prettier                            | `.eslintrc.json`, `.prettierrc`                   |
| Premier déploiement Coolify                             | Dockerfile                                        |

**Validation** : L'app se lance en local, la DB est accessible, le layout s'affiche.

---

#### Lot 1 : Authentification & Référentiels (Epic 1 + Epic 7)

**Objectif** : Nath peut se connecter et gérer ses chauffeurs, véhicules et points de passage.

| Tâche                                 | Fichiers                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Page login + Auth                     | `src/app/login/page.tsx`                                                                 |
| Middleware auth                       | `src/middleware.ts`, `src/lib/db/*`                                                      |
| CRUD Chauffeurs                       | `src/app/referentiels/chauffeurs/page.tsx`, `src/app/api/drivers/route.ts`, composants   |
| CRUD Véhicules                        | `src/app/referentiels/vehicules/page.tsx`, `src/app/api/vehicles/route.ts`, composants   |
| CRUD Points de passage + géocodage    | `src/app/referentiels/points-de-passage/page.tsx`, `src/app/api/locations/*`, composants |
| Service de géocodage (ORS + fallback) | `src/lib/routing/geocoding.ts`, `src/lib/routing/ors-client.ts`                          |
| Schemas Zod pour validation           | `src/lib/validators/*`                                                                   |

**Validation** : Nath peut se connecter, créer les 4 chauffeurs, 2 véhicules, et au moins 3 points de passage avec adresses géocodées.

---

#### Lot 2 : Configuration Hebdomadaire (Epic 2)

**Objectif** : Nath peut créer une semaine et configurer les disponibilités chauffeurs.

| Tâche                                                     | Fichiers                                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Page liste des semaines + création                        | `src/app/planning/page.tsx`, `src/app/api/schedules/route.ts`                                       |
| Grille de disponibilités (7 jours × 4 chauffeurs)         | `src/app/planning/[weekId]/configuration/page.tsx`, `src/components/planning/availability-grid.tsx` |
| API CRUD disponibilités (bulk upsert)                     | `src/app/api/schedules/[scheduleId]/availabilities/route.ts`                                        |
| Duplication semaine précédente                            | Intégré dans la page planning                                                                       |
| Validation contrainte véhicule (pas de doublon simultané) | `src/lib/validators/availability.schema.ts`                                                         |

**Validation** : Nath peut créer la semaine du 6 avril, configurer Yannick 8h-18h30, Solange 7h-14h, Ali 15h-23h avec les bons véhicules.

---

#### Lot 3 : Import Excel (Epic 3)

**Objectif** : Nath peut importer l'Excel des demandes et voir les missions parsées/validées.

| Tâche                              | Fichiers                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Zone d'upload avec dropzone        | `src/app/planning/[weekId]/import/page.tsx`, `src/components/planning/import-dropzone.tsx`         |
| Parser Excel complet               | `src/lib/excel/import-parser.ts`, `src/lib/excel/time-parser.ts`                                   |
| Classification des missions        | `src/lib/excel/mission-classifier.ts`                                                              |
| Matching fuzzy des lieux           | `src/lib/excel/location-matcher.ts`, `src/lib/utils/fuzzy-match.ts`                                |
| API d'import                       | `src/app/api/schedules/[scheduleId]/import/route.ts`                                               |
| Interface de validation/résolution | `src/components/planning/import-validation.tsx`, `src/components/planning/unresolved-location.tsx` |
| Confirmation d'import              | API confirm + stockage en base                                                                     |
| Tests unitaires du parser          | `tests/unit/excel/*`                                                                               |

**Validation** : Importer l'exemple "Exemple de tableau de demandes en entrée_6avril.xlsx" et vérifier que toutes les missions sont correctement parsées, classifiées, et les lieux résolus.

---

#### Lot 4 : Génération & Édition des Tournées (Epic 4 + Epic 5)

**Objectif** : Nath peut générer les tournées et les ajuster manuellement.

| Tâche                                                        | Fichiers                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Service de routage avec cache                                | `src/lib/routing/routing-service.ts`, `src/lib/routing/ors-client.ts`, `src/lib/routing/osrm-client.ts` |
| API matrice de trajet                                        | `src/app/api/routing/matrix/route.ts`                                                                   |
| Algorithme d'optimisation complet                            | `src/lib/optimizer/*` (tous les fichiers)                                                               |
| API génération                                               | `src/app/api/schedules/[scheduleId]/generate/route.ts`                                                  |
| Éditeur de tournées (vue colonnes)                           | `src/app/planning/[weekId]/tournees/page.tsx`, `src/components/tournees/*`                              |
| Drag & drop (réordonnancement + déplacement inter-chauffeur) | `src/components/tournees/tour-stop-card.tsx` avec dnd-kit                                               |
| Modification horaire, annulation stop                        | API PATCH stops                                                                                         |
| Ajout tâche manuelle                                         | `src/components/tournees/manual-task-form.tsx`                                                          |
| Système d'alertes (dépassement, priorité)                    | `src/components/tournees/tour-alerts.tsx`                                                               |
| Re-génération partielle (preserve_confirmed_stops)           | Option dans l'API generate                                                                              |
| Tests unitaires de l'optimiseur                              | `tests/unit/optimizer/*`                                                                                |

**Validation** : Générer les tournées pour la semaine du 6 avril, vérifier la cohérence avec l'exemple de sortie, tester le drag & drop, vérifier les alertes de dépassement.

---

#### Lot 5 : Export & Ré-import (Epic 6)

**Objectif** : Nath peut exporter le planning au format Excel attendu et ré-importer un planning pour modification.

| Tâche                                       | Fichiers                                                           |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Générateur Excel de sortie                  | `src/lib/excel/export-generator.ts`                                |
| API d'export                                | `src/app/api/schedules/[scheduleId]/export/route.ts`               |
| Page d'export avec preview                  | `src/app/planning/[weekId]/export/page.tsx`                        |
| Parser de ré-import (Excel tournée → tours) | `src/lib/excel/tour-reimport.ts`                                   |
| Dashboard page d'accueil                    | `src/app/page.tsx`                                                 |
| Tests de conformité du format de sortie     | Comparaison avec "Exemple de Planning final à générer_6avril.xlsx" |

**Validation** : Exporter les tournées générées, comparer le format avec l'exemple fourni (mêmes onglets, mêmes en-têtes, même structure). Ré-importer le fichier exporté et vérifier que les données sont intactes.

---

### Estimation globale

| Lot                          | Effort estimé      | Dépendances |
| ---------------------------- | ------------------ | ----------- |
| Lot 0 : Scaffolding          | 1-2 sessions       | Aucune      |
| Lot 1 : Auth + Référentiels  | 2-3 sessions       | Lot 0       |
| Lot 2 : Config semaine       | 1-2 sessions       | Lot 1       |
| Lot 3 : Import Excel         | 2-3 sessions       | Lot 2       |
| Lot 4 : Génération + Édition | 4-5 sessions       | Lot 3       |
| Lot 5 : Export + Ré-import   | 2-3 sessions       | Lot 4       |
| **Total**                    | **12-18 sessions** |             |

---

## 12. Environnements & Déploiement

### Environnements

| Environnement  | Hébergement                   | Base de données                  | Usage         |
| -------------- | ----------------------------- | -------------------------------- | ------------- |
| **Local**      | `next dev` (localhost:3000)   | PostgreSQL (VPS ou local Docker) | Développement |
| **Production** | Coolify (VPS, branche `main`) | PostgreSQL (même VPS, Coolify)   | Usage réel    |

### Domaine

`tournee.chezgilles.ovh` — SSL géré automatiquement par Coolify (Let's Encrypt).

### CI/CD

```
git push main → Coolify webhook → build Dockerfile → deploy
```

### Déploiement pas à pas

1. **PostgreSQL** : Service déjà en cours sur Coolify
2. **Migrations** : `psql $DATABASE_URL -f db/migrations/001_create_drivers.sql` (etc.) ou `npx drizzle-kit push`
3. **Application** : Coolify → Create Application → GitHub repo → Dockerfile → Port 3000 → Domaine `tournee.chezgilles.ovh`
4. **Variables d'environnement** dans Coolify :
   - `DATABASE_URL`
   - `ORS_API_KEY`
   - `ORS_BASE_URL`
5. **Auto-deploy** : Activer le webhook GitHub dans Coolify

### Drizzle Kit — Commandes utiles

```bash
npx drizzle-kit push      # Pousser le schéma vers la DB (dev)
npx drizzle-kit generate  # Générer une migration SQL depuis le diff du schéma
npx drizzle-kit studio    # Navigateur visuel à https://local.drizzle.studio
```

### Commandes

```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm run test          # Vitest
npm run test:e2e      # Playwright (si configuré)

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

_Document généré le 2026-04-12 — Compagnon du PRD.md v1.0_
