-- db/migrations/005_create_driver_availabilities.sql

CREATE TABLE public.driver_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.weekly_schedules(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (schedule_id, driver_id, day_of_week),
    CHECK (end_time > start_time)
);

CREATE INDEX driver_avail_schedule_day_idx
    ON public.driver_availabilities(schedule_id, day_of_week);




CREATE TRIGGER driver_availabilities_updated_at
    BEFORE UPDATE ON public.driver_availabilities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
