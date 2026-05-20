-- Documents the city_transport_cache table that already exists in production.
-- This table caches AI-generated transport instructions (airport, train, road)
-- per city/country/airport for 30 days to avoid redundant Gemini/OpenAI calls.

CREATE TABLE IF NOT EXISTS public.city_transport_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  country_code text NOT NULL,
  airport_code text NULL,
  transport_info jsonb NOT NULL,
  highway_info jsonb NOT NULL,
  cached_at timestamp with time zone NULL DEFAULT now(),
  expires_at timestamp with time zone NULL DEFAULT (now() + '30 days'::interval),
  CONSTRAINT city_transport_cache_pkey PRIMARY KEY (id),
  CONSTRAINT city_transport_cache_city_name_country_code_airport_code_key
    UNIQUE (city_name, country_code, airport_code)
) TABLESPACE pg_default;
