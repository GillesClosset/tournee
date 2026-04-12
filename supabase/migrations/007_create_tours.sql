-- supabase/migrations/007_create_tours.sql

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
