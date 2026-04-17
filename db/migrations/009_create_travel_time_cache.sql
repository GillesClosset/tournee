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

    UNIQUE (origin_location_id, dest_location_id)
);

CREATE INDEX travel_cache_origin_dest_idx
    ON public.travel_time_cache(origin_location_id, dest_location_id);

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.travel_time_cache
    WHERE cached_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;



