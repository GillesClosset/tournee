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

-- Nécessite l'extension pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index pour le matching par nom (recherche fuzzy)
CREATE INDEX locations_name_trgm_idx ON public.locations
    USING gin (name gin_trgm_ops);




CREATE TRIGGER locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
