-- db/migrations/006_create_mission_requests.sql

CREATE TYPE public.mission_type AS ENUM ('accompagnement', 'recuperation', 'both');
CREATE TYPE public.accompaniment_type AS ENUM ('scolaire', 'medical', 'loisir', 'famille', 'autre');
CREATE TYPE public.mission_status AS ENUM ('pending', 'assigned', 'cancelled');

CREATE TABLE public.mission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    location_id UUID REFERENCES public.locations(id),
    destination_location_id UUID REFERENCES public.locations(id),
    destination_address TEXT,
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    requested_time TIME NOT NULL,
    time_range_end TIME,
    minor_name TEXT,
    mission_text TEXT NOT NULL,
    mission_type public.mission_type NOT NULL DEFAULT 'accompagnement',
    accompaniment_type public.accompaniment_type NOT NULL DEFAULT 'autre',
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    priority_override NUMERIC(5,2),
    is_priority_flagged BOOLEAN NOT NULL DEFAULT false,
    observations TEXT,
    raw_row_data JSONB,
    status public.mission_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mission_requests_schedule_day_idx
    ON public.mission_requests(schedule_id, day_of_week);

CREATE INDEX mission_requests_status_idx
    ON public.mission_requests(status);




CREATE TRIGGER mission_requests_updated_at
    BEFORE UPDATE ON public.mission_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
