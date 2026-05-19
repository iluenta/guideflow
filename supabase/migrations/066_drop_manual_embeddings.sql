-- Drop legacy manual_embeddings table and related objects.
-- All embeddings now live in context_embeddings (migrated in 019).
-- The only consumer (app/actions/chat.ts) was dead code with no importers.

DROP TRIGGER IF EXISTS tr_sync_manual_embeddings ON public.manual_embeddings;
DROP FUNCTION IF EXISTS public.sync_manual_to_context_embeddings();
DROP FUNCTION IF EXISTS public.match_property_manuals(vector, float, int, uuid);
DROP TABLE IF EXISTS public.manual_embeddings;
