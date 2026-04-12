-- supabase/migrations/004_create_weekly_schedules.sql

CREATE TYPE public.schedule_status AS ENUM ('draft', 'configured', 'imported', 'generated', 'modified', 'confirmed');

CREATE TABLE public.weekly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL UNIQUE,
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
