-- supabase/migrations/008_create_tour_stops.sql

CREATE TABLE public.tour_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    sequence_order SMALLINT NOT NULL,
    location_id UUID REFERENCES public.locations(id),
    mission_request_id UUID REFERENCES public.mission_requests(id),
    scheduled_time TIME NOT NULL,
    travel_time_minutes INTEGER NOT NULL DEFAULT 0,
    parking_extra_minutes INTEGER NOT NULL DEFAULT 0,
    accompaniment_extra_minutes INTEGER NOT NULL DEFAULT 0,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    is_manual_task BOOLEAN NOT NULL DEFAULT false,
    manual_task_text TEXT,
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
