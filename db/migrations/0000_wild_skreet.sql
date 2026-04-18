CREATE TYPE "public"."accompaniment_type" AS ENUM('scolaire', 'medical', 'loisir', 'famille', 'autre');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('villa', 'rdv');--> statement-breakpoint
CREATE TYPE "public"."mission_status" AS ENUM('pending', 'assigned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."mission_type" AS ENUM('accompagnement', 'recuperation', 'both');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('draft', 'configured', 'imported', 'generated', 'modified', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."tour_status" AS ENUM('generated', 'modified', 'confirmed');--> statement-breakpoint
CREATE TABLE "driver_availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_avail_unique" UNIQUE("schedule_id","driver_id","day_of_week"),
	CONSTRAINT "day_of_week_check" CHECK ("driver_availabilities"."day_of_week" BETWEEN 1 AND 7),
	CONSTRAINT "end_after_start" CHECK ("driver_availabilities"."end_time" > "driver_availabilities"."start_time")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"parking_difficulty" boolean DEFAULT false NOT NULL,
	"location_type" "location_type" DEFAULT 'villa' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"location_id" uuid,
	"destination_location_id" uuid,
	"destination_address" text,
	"destination_latitude" double precision,
	"destination_longitude" double precision,
	"requested_time" time NOT NULL,
	"time_range_end" time,
	"minor_name" text,
	"mission_text" text NOT NULL,
	"mission_type" "mission_type" DEFAULT 'accompagnement' NOT NULL,
	"accompaniment_type" "accompaniment_type" DEFAULT 'autre' NOT NULL,
	"priority_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"priority_override" numeric(5, 2),
	"is_priority_flagged" boolean DEFAULT false NOT NULL,
	"observations" text,
	"raw_row_data" jsonb,
	"status" "mission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mission_day_check" CHECK ("mission_requests"."day_of_week" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE TABLE "tour_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tour_id" uuid NOT NULL,
	"sequence_order" smallint NOT NULL,
	"location_id" uuid,
	"mission_request_id" uuid,
	"scheduled_time" time NOT NULL,
	"travel_time_minutes" integer DEFAULT 0 NOT NULL,
	"parking_extra_minutes" integer DEFAULT 0 NOT NULL,
	"accompaniment_extra_minutes" integer DEFAULT 0 NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_manual_task" boolean DEFAULT false NOT NULL,
	"manual_task_text" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tour_stops_unique" UNIQUE("tour_id","sequence_order")
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"driver_availability_id" uuid NOT NULL,
	"status" "tour_status" DEFAULT 'generated' NOT NULL,
	"total_travel_minutes" integer,
	"total_distance_meters" integer,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_time_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin_location_id" uuid,
	"dest_location_id" uuid,
	"origin_lat" double precision NOT NULL,
	"origin_lng" double precision NOT NULL,
	"dest_lat" double precision NOT NULL,
	"dest_lng" double precision NOT NULL,
	"duration_seconds" integer NOT NULL,
	"distance_meters" integer NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "travel_cache_unique" UNIQUE("origin_location_id","dest_location_id")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"license_plate" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_license_plate_unique" UNIQUE("license_plate")
);
--> statement-breakpoint
CREATE TABLE "weekly_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start_date" date NOT NULL,
	"status" "schedule_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_schedules_week_start_date_unique" UNIQUE("week_start_date")
);
--> statement-breakpoint
ALTER TABLE "driver_availabilities" ADD CONSTRAINT "driver_availabilities_schedule_id_weekly_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."weekly_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_availabilities" ADD CONSTRAINT "driver_availabilities_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_availabilities" ADD CONSTRAINT "driver_availabilities_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_requests" ADD CONSTRAINT "mission_requests_schedule_id_weekly_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."weekly_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_requests" ADD CONSTRAINT "mission_requests_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_requests" ADD CONSTRAINT "mission_requests_destination_location_id_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_stops" ADD CONSTRAINT "tour_stops_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_stops" ADD CONSTRAINT "tour_stops_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_stops" ADD CONSTRAINT "tour_stops_mission_request_id_mission_requests_id_fk" FOREIGN KEY ("mission_request_id") REFERENCES "public"."mission_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_schedule_id_weekly_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."weekly_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_driver_availability_id_driver_availabilities_id_fk" FOREIGN KEY ("driver_availability_id") REFERENCES "public"."driver_availabilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_time_cache" ADD CONSTRAINT "travel_time_cache_origin_location_id_locations_id_fk" FOREIGN KEY ("origin_location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_time_cache" ADD CONSTRAINT "travel_time_cache_dest_location_id_locations_id_fk" FOREIGN KEY ("dest_location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "driver_avail_schedule_day_idx" ON "driver_availabilities" USING btree ("schedule_id","day_of_week");--> statement-breakpoint
CREATE INDEX "locations_name_trgm_idx" ON "locations" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "mission_requests_schedule_day_idx" ON "mission_requests" USING btree ("schedule_id","day_of_week");--> statement-breakpoint
CREATE INDEX "mission_requests_status_idx" ON "mission_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tour_stops_tour_idx" ON "tour_stops" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "tour_stops_mission_idx" ON "tour_stops" USING btree ("mission_request_id");--> statement-breakpoint
CREATE INDEX "tours_schedule_idx" ON "tours" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "travel_cache_origin_dest_idx" ON "travel_time_cache" USING btree ("origin_location_id","dest_location_id");